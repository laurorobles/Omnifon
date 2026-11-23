/**
 * Motor DSP del Omnifón virtual (AudioWorklet).
 *
 * Reconstrucción históricamente informada — no es una clonación de circuito
 * (no existen esquemáticos publicados). Cadena monofónica:
 *   VCO (sen/cuad/rampa, 10 Hz–20 kHz) + ruido blanco → VCF (SVF ZDF) → VCA ← EG
 * con un segundo oscilador modulador para el Modo Estudio (1981).
 * Toda la modulación se calcula por muestra (audio-rate).
 */
import { PARAMS } from './params';

declare const sampleRate: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
}
declare function registerProcessor(name: string, ctor: unknown): void;

const TAU = Math.PI * 2;

/** Corrección PolyBLEP para discontinuidades (anti-aliasing). */
function polyBlep(t: number, dt: number): number {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}

/** Saturación suave (aprox. racional de tanh) como protección de salida. */
function softClip(x: number): number {
  if (x > 3) return 1;
  if (x < -3) return -1;
  const x2 = x * x;
  return (x * (27 + x2)) / (27 + 9 * x2);
}

/** Generador xoshiro128** — ruido blanco de espectro plano. */
class Rng {
  private s = new Uint32Array(4);
  constructor(seed: number) {
    let x = seed >>> 0 || 1;
    for (let i = 0; i < 4; i++) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      this.s[i] = x >>> 0;
    }
  }
  /** Uniforme en [0, 1). */
  next(): number {
    const s = this.s;
    const rotl = (v: number, k: number) => (v << k) | (v >>> (32 - k));
    const r = Math.imul(rotl(Math.imul(s[1], 5), 7), 9) >>> 0;
    const t = s[1] << 9;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 11);
    return r / 4294967296;
  }
}

/** Filtro de variables de estado con retardo cero (topología de Simper). */
class Svf {
  private ic1 = 0;
  private ic2 = 0;
  low = 0;
  band = 0;
  high = 0;
  process(v0: number, g: number, k: number): void {
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = v0 - this.ic2;
    const v1 = a1 * this.ic1 + a2 * v3;
    const v2 = this.ic2 + a2 * this.ic1 + a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.low = v2;
    this.band = v1;
    this.high = v0 - k * v1 - v2;
  }
  out(mode: number): number {
    return mode === 0 ? this.low : mode === 1 ? this.band : this.high;
  }
}

const enum Stage {
  Idle,
  Attack,
  Decay,
  Sustain,
  Release,
}

type Params = Record<string, Float32Array>;

class OmnifonProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return PARAMS.map((p) => ({
      name: p.id,
      defaultValue: p.def,
      minValue: p.min,
      maxValue: p.max,
      automationRate: 'k-rate',
    }));
  }

  private phase1 = 0;
  private phase2 = 0;
  private held: number[] = [];
  private note = 69;
  private noteSm = 69;
  private env = 0;
  private stage: Stage = Stage.Idle;
  private svfA = new Svf();
  private svfB = new Svf();
  private rng = new Rng(0x4f4d4e49); // "OMNI"
  private drift = [0, 0];
  private driftTarget = [0, 0];
  private driftCounter = 0;
  /** Valores suavizados (anti-zipper) por parámetro continuo. */
  private sm: Record<string, number> = {};

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => this.onMessage(e.data);
  }

  private onMessage(msg: { type: string; note?: number }): void {
    switch (msg.type) {
      case 'noteOn': {
        const n = msg.note!;
        this.held = this.held.filter((x) => x !== n);
        this.held.push(n);
        this.note = n;
        this.stage = Stage.Attack; // redisparo desde el valor actual: sin clics
        break;
      }
      case 'noteOff': {
        const n = msg.note!;
        this.held = this.held.filter((x) => x !== n);
        if (this.held.length > 0) {
          this.note = this.held[this.held.length - 1]; // prioridad a la última nota
        } else if (this.stage !== Stage.Idle) {
          this.stage = Stage.Release;
        }
        break;
      }
      case 'allOff':
        this.held = [];
        if (this.stage !== Stage.Idle) this.stage = Stage.Release;
        break;
    }
  }

  /** Suavizado exponencial de un valor objetivo. */
  private smooth(key: string, target: number, c: number): number {
    const prev = this.sm[key];
    const v = prev === undefined ? target : prev + (target - prev) * c;
    this.sm[key] = v;
    return v;
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][], p: Params): boolean {
    const out = outputs[0];
    const L = out[0];
    const R = out[1];
    const n = L.length;
    const sr = sampleRate;
    const nyq = 0.45 * sr;

    const v = (id: string) => p[id][0];
    const tLogF1 = Math.log2(v('vcoFreq'));
    const tLogF2 = Math.log2(v('vco2Freq'));
    const tLogCut = Math.log2(v('cutoff'));
    const track = v('vcoTrack') >= 0.5;
    const mode = Math.round(v('filterMode'));
    const slope24 = v('filterSlope') >= 0.5;
    const wave2 = Math.round(v('vco2Wave'));
    const ar = v('egMode') < 0.5;
    const sustain = ar ? 1 : v('sustain');
    const glide = v('glide');

    const cSmooth = 1 - Math.exp(-1 / (0.005 * sr)); // 5 ms
    const cGlide = glide > 0.0005 ? 1 - Math.exp(-1 / (glide * sr)) : 1;
    // Constantes RC: tiempos calibrados al umbral de cada etapa.
    const cA = 1 - Math.exp(-1.79 / (v('attack') * sr)); // 0→1 con objetivo 1.2
    const cD = 1 - Math.exp(-4.6 / (v('decay') * sr)); // hasta el 1 %
    const cR = 1 - Math.exp(-6.9 / (v('release') * sr)); // hasta −60 dB
    const cDrift = 1 - Math.exp(-1 / (0.7 * sr));

    for (let i = 0; i < n; i++) {
      // ── Parámetros suavizados
      const logF1 = this.smooth('f1', tLogF1, cSmooth);
      const logF2 = this.smooth('f2', tLogF2, cSmooth);
      const logCut = this.smooth('cut', tLogCut, cSmooth);
      const lS = this.smooth('lS', v('lvlSine'), cSmooth);
      const lQ = this.smooth('lQ', v('lvlSquare'), cSmooth);
      const lR = this.smooth('lR', v('lvlRamp'), cSmooth);
      const lN = this.smooth('lN', v('lvlNoise'), cSmooth);
      const res = this.smooth('res', v('resonance'), cSmooth);
      const fEnv = this.smooth('fEnv', v('filterEnv'), cSmooth);
      const fTrk = this.smooth('fTrk', v('filterTrack'), cSmooth);
      const egCv = this.smooth('egCv', v('egCv'), cSmooth);
      const bias = this.smooth('bias', v('vcaBias'), cSmooth);
      const vol = this.smooth('vol', v('volume'), cSmooth);
      const toP = this.smooth('toP', v('vco2ToPitch'), cSmooth);
      const toC = this.smooth('toC', v('vco2ToCutoff'), cSmooth);
      const toA = this.smooth('toA', v('vco2ToAmp'), cSmooth);
      const tol = this.smooth('tol', v('tolerance'), cSmooth);

      this.noteSm += (this.note - this.noteSm) * cGlide;

      // ── Tolerancia analógica: deriva lenta y aleatoria (0 % = pureza total)
      if (this.driftCounter-- <= 0) {
        this.driftCounter = 2048 + ((this.rng.next() * 4096) | 0);
        this.driftTarget[0] = this.rng.next() * 2 - 1;
        this.driftTarget[1] = this.rng.next() * 2 - 1;
      }
      this.drift[0] += (this.driftTarget[0] - this.drift[0]) * cDrift;
      this.drift[1] += (this.driftTarget[1] - this.drift[1]) * cDrift;

      // ── Oscilador 2 (modulador, Modo Estudio)
      const f2 = Math.min(2 ** logF2, nyq);
      const dt2 = f2 / sr;
      this.phase2 += dt2;
      if (this.phase2 >= 1) this.phase2 -= 1;
      let m: number;
      if (wave2 === 0) m = Math.sin(TAU * this.phase2);
      else if (wave2 === 1)
        m =
          (this.phase2 < 0.5 ? 1 : -1) +
          polyBlep(this.phase2, dt2) -
          polyBlep((this.phase2 + 0.5) % 1, dt2);
      else m = 2 * this.phase2 - 1 - polyBlep(this.phase2, dt2);

      // ── Oscilador 1: barrido continuo 10 Hz – 20 kHz
      const pitch =
        logF1 + (track ? (this.noteSm - 69) / 12 : 0) + m * toP + this.drift[0] * tol * (25 / 1200);
      const f1 = Math.min(Math.max(2 ** pitch, 1), nyq);
      const dt = f1 / sr;
      this.phase1 += dt;
      if (this.phase1 >= 1) this.phase1 -= 1;
      const ph = this.phase1;
      const sine = Math.sin(TAU * ph);
      const square = (ph < 0.5 ? 1 : -1) + polyBlep(ph, dt) - polyBlep((ph + 0.5) % 1, dt);
      const ramp = 2 * ph - 1 - polyBlep(ph, dt);
      const noise = this.rng.next() * 2 - 1;
      const mix = sine * lS + square * lQ + ramp * lR + noise * lN;

      // ── Generador de envolvente (RC exponencial, AR / ADSR)
      switch (this.stage) {
        case Stage.Attack:
          this.env += (1.2 - this.env) * cA;
          if (this.env >= 1) {
            this.env = 1;
            this.stage = ar ? Stage.Sustain : Stage.Decay;
          }
          break;
        case Stage.Decay:
          this.env += (sustain - this.env) * cD;
          if (Math.abs(this.env - sustain) < 1e-4) this.stage = Stage.Sustain;
          break;
        case Stage.Sustain:
          this.env += (sustain - this.env) * cSmooth;
          break;
        case Stage.Release:
          this.env -= this.env * cR;
          if (this.env < 1e-5) {
            this.env = 0;
            this.stage = Stage.Idle;
          }
          break;
      }
      const e = this.env * egCv; // control de voltaje externo sobre el total de la envolvente

      // ── Filtro por voltaje
      const cutLog =
        logCut + e * fEnv + fTrk * ((this.noteSm - 60) / 12) + m * toC + this.drift[1] * tol * 0.15;
      const fc = Math.min(Math.max(2 ** cutLog, 10), 0.49 * sr);
      const g = Math.tan((Math.PI * fc) / sr);
      const k = 2 - 1.97 * res;
      this.svfA.process(mix * 0.5, g, k);
      let y = this.svfA.out(mode);
      if (slope24) {
        this.svfB.process(y, g, Math.SQRT2);
        y = this.svfB.out(mode);
      }

      // ── Amplificador controlado por voltaje
      let amp = Math.min(Math.max(e + bias, 0), 1);
      amp *= 1 - toA * (0.5 - 0.5 * m);
      const s = softClip(y * amp * vol * 1.6);
      L[i] = s;
      if (R) R[i] = s;
    }
    return true;
  }
}

registerProcessor('omnifon', OmnifonProcessor);
