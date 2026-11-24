/**
 * Procesadores DSP del Omnifón modular (un AudioWorkletProcessor por tipo de módulo).
 * Todo se calcula por muestra; las entradas de control son señales de audio.
 */
import { BANDS, MODULES } from './modules';

declare const sampleRate: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
}
declare function registerProcessor(name: string, ctor: unknown): void;

type Ins = Float32Array[][];
type Outs = Float32Array[][];
type Ps = Record<string, Float32Array>;
type Msg = { type: string; [k: string]: unknown };

const TAU = Math.PI * 2;
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);

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

function softClip(x: number): number {
  if (x > 3) return 1;
  if (x < -3) return -1;
  const x2 = x * x;
  return (x * (27 + x2)) / (27 + 9 * x2);
}

/** xoshiro128** — ruido blanco de espectro plano. */
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
  bipolar(): number {
    return this.next() * 2 - 1;
  }
}

/** Filtro de variables de estado con retardo cero (Simper). */
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
}

class Trigger {
  private prev = 0;
  rise(v: number): boolean {
    const r = v > 0.5 && this.prev <= 0.5;
    this.prev = v;
    return r;
  }
}

const descriptors = (type: string) =>
  MODULES[type].params.map((q) => ({
    name: q.id,
    defaultValue: q.def,
    minValue: q.min,
    maxValue: q.max,
    automationRate: 'k-rate',
  }));

/** Base: rampas de parámetros por bloque (sin «zipper noise») y mensajes. */
abstract class Mod extends AudioWorkletProcessor {
  private last: Record<string, number> = {};
  private bufs: Record<string, Float32Array> = {};
  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => this.onMessage(e.data as Msg);
  }
  protected onMessage(_m: Msg): void {}

  /** Valor del parámetro interpolado linealmente a lo largo del bloque. */
  protected ramp(ps: Ps, id: string, n: number): Float32Array {
    let b = this.bufs[id];
    if (!b || b.length < n) b = this.bufs[id] = new Float32Array(n);
    const target = ps[id][0];
    const prev = this.last[id] ?? target;
    this.last[id] = target;
    if (prev === target) b.fill(target, 0, n);
    else {
      const step = (target - prev) / n;
      for (let i = 0; i < n; i++) b[i] = prev + step * (i + 1);
    }
    return b;
  }
}

const inp = (ins: Ins, i: number): Float32Array | null => (ins[i] && ins[i][0]) || null;
const out = (outs: Outs, i: number): Float32Array => outs[i][0];

// ───────────────────────────────────────── Oscilador
class Oscilador extends Mod {
  static get parameterDescriptors() {
    return descriptors('oscilador');
  }
  private ph = 0;
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const fr = this.ramp(ps, 'frecuencia', n);
    const md = this.ramp(ps, 'modulador', n);
    const an = this.ramp(ps, 'ancho', n);
    const fino = ps.fino[0] / 12;
    const cvF = inp(ins, 0);
    const cvM = inp(ins, 1);
    const cvW = inp(ins, 2);
    const oS = out(outs, 0);
    const oT = out(outs, 1);
    const oR = out(outs, 2);
    const oQ = out(outs, 3);
    const nyq = 0.45 * sampleRate;
    for (let i = 0; i < n; i++) {
      const pitch = Math.log2(fr[i]) + fino + (cvF ? cvF[i] : 0) + (cvM ? cvM[i] * md[i] * 4 : 0);
      const f = clamp(2 ** pitch, 0.01, nyq);
      const dt = f / sampleRate;
      let ph = this.ph + dt;
      if (ph >= 1) ph -= Math.floor(ph);
      this.ph = ph;
      const w = clamp(an[i] + (cvW ? cvW[i] * 0.5 : 0), 0.02, 0.98);
      oS[i] = Math.sin(TAU * ph);
      oT[i] = 1 - 4 * Math.abs(ph - 0.5);
      oR[i] = 2 * ph - 1 - polyBlep(ph, dt);
      let ph2 = ph - w;
      if (ph2 < 0) ph2 += 1;
      oQ[i] = (ph < w ? 1 : -1) + polyBlep(ph, dt) - polyBlep(ph2, dt);
    }
    return true;
  }
}

// ───────────────────────────────────────── Filtro-V (por voltaje)
class FiltroV extends Mod {
  static get parameterDescriptors() {
    return descriptors('filtrov');
  }
  private svf = new Svf();
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const ce = this.ramp(ps, 'centro', n);
    const an = this.ramp(ps, 'ancho', n);
    const mo = this.ramp(ps, 'modulacion', n);
    const x = inp(ins, 0);
    const cv = inp(ins, 1);
    const cm = inp(ins, 2);
    const oL = out(outs, 0);
    const oB = out(outs, 1);
    const oH = out(outs, 2);
    const fmax = 0.49 * sampleRate;
    for (let i = 0; i < n; i++) {
      const lc = Math.log2(ce[i]) + (cv ? cv[i] : 0) + (cm ? cm[i] * mo[i] : 0);
      const fc = clamp(2 ** lc, 10, fmax);
      const g = Math.tan((Math.PI * fc) / sampleRate);
      const k = 0.03 + an[i] * 1.97; // ancho de banda: estrecho = resonante
      this.svf.process(softClip(x ? x[i] : 0), g, k);
      oL[i] = this.svf.low;
      oB[i] = this.svf.band;
      oH[i] = this.svf.high;
    }
    return true;
  }
}

// ───────────────────────────────────────── Filtro-O (banco de octavas)
class FiltroO extends Mod {
  static get parameterDescriptors() {
    return descriptors('filtroo');
  }
  private svfs = BANDS.map(() => new Svf());
  private gs = BANDS.map((f) => Math.tan((Math.PI * Math.min(f, 0.45 * sampleRate)) / sampleRate));
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const x = inp(ins, 0);
    const gains = BANDS.map((_, b) => this.ramp(ps, `g${b}`, n));
    const su = this.ramp(ps, 'suma', n);
    const oSum = out(outs, 0);
    const K = 0.7071; // Q ≈ 1.41: una octava
    for (let i = 0; i < n; i++) {
      const v = x ? x[i] : 0;
      let sum = 0;
      for (let b = 0; b < BANDS.length; b++) {
        const s = this.svfs[b];
        s.process(v, this.gs[b], K);
        const y = s.band * K * gains[b][i];
        out(outs, b + 1)[i] = y;
        sum += y;
      }
      oSum[i] = sum * su[i];
    }
    return true;
  }
}

// ───────────────────────────────────────── Envolvedor (amplificador controlado)
class Envolvedor extends Mod {
  static get parameterDescriptors() {
    return descriptors('envolvedor');
  }
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const mi = this.ramp(ps, 'min', n);
    const ma = this.ramp(ps, 'max', n);
    const x = inp(ins, 0);
    const c = inp(ins, 1);
    const o1 = out(outs, 0);
    const o2 = out(outs, 1);
    for (let i = 0; i < n; i++) {
      const g = clamp(mi[i] + ma[i] * (c ? c[i] : 0), 0, 2);
      const y = (x ? x[i] : 0) * g;
      o1[i] = y;
      o2[i] = y;
    }
    return true;
  }
}

// ───────────────────────────────────────── Integrador de envolvente
const enum Stage {
  Idle,
  Attack,
  Decay,
  Sustain,
  Release,
}

class Integrador extends Mod {
  static get parameterDescriptors() {
    return descriptors('integrador');
  }
  private env = 0;
  private stage: Stage = Stage.Idle;
  private gate = false;
  private manual = false;
  protected onMessage(m: Msg): void {
    if (m.type === 'press') this.manual = true;
    if (m.type === 'release') this.manual = false;
  }
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const sr = sampleRate;
    const cA = 1 - Math.exp(-1.79 / (ps.ataque[0] * sr));
    const cD = 1 - Math.exp(-4.6 / (ps.caida[0] * sr));
    const cR = 1 - Math.exp(-6.9 / (ps.extincion[0] * sr));
    const cS = 1 - Math.exp(-1 / (0.005 * sr));
    const sus = ps.sosten[0];
    const g = inp(ins, 0);
    const o = out(outs, 0);
    const oi = out(outs, 1);
    for (let i = 0; i < n; i++) {
      const gate = this.manual || (g ? g[i] > 0.5 : false);
      if (gate && !this.gate) this.stage = Stage.Attack;
      else if (!gate && this.gate && this.stage !== Stage.Idle) this.stage = Stage.Release;
      this.gate = gate;
      switch (this.stage) {
        case Stage.Attack:
          this.env += (1.2 - this.env) * cA;
          if (this.env >= 1) {
            this.env = 1;
            this.stage = Stage.Decay;
          }
          break;
        case Stage.Decay:
          this.env += (sus - this.env) * cD;
          if (Math.abs(this.env - sus) < 1e-4) this.stage = Stage.Sustain;
          break;
        case Stage.Sustain:
          this.env += (sus - this.env) * cS;
          break;
        case Stage.Release:
          this.env -= this.env * cR;
          if (this.env < 1e-5) {
            this.env = 0;
            this.stage = Stage.Idle;
          }
          break;
      }
      o[i] = this.env;
      oi[i] = -this.env;
    }
    return true;
  }
}

// ───────────────────────────────────────── Aleator (muestreo y retención aleatoria)
class Aleator extends Mod {
  static get parameterDescriptors() {
    return descriptors('aleator');
  }
  private rng = new Rng(0xa1ea7);
  private trig = new Trigger();
  private ph = 0;
  private value = 0;
  private smooth = 0;
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const rate = ps.velocidad[0];
    const lvl = this.ramp(ps, 'nivel', n);
    const c = 1 - Math.exp((-TAU * rate * 1.5) / sampleRate);
    const t = inp(ins, 0);
    const oE = out(outs, 0);
    const oS = out(outs, 1);
    for (let i = 0; i < n; i++) {
      let fire = false;
      if (t) fire = this.trig.rise(t[i]);
      else {
        this.ph += rate / sampleRate;
        if (this.ph >= 1) {
          this.ph -= 1;
          fire = true;
        }
      }
      if (fire) this.value = this.rng.bipolar();
      this.smooth += (this.value - this.smooth) * c;
      oE[i] = this.value * lvl[i];
      oS[i] = this.smooth * lvl[i];
    }
    return true;
  }
}

// ───────────────────────────────────────── Modulador de anillo
class Anillo extends Mod {
  static get parameterDescriptors() {
    return descriptors('anillo');
  }
  private ph = 0;
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const fr = this.ramp(ps, 'portadora', n);
    const lv = this.ramp(ps, 'nivel', n);
    const a = inp(ins, 0);
    const b = inp(ins, 1);
    const o = out(outs, 0);
    for (let i = 0; i < n; i++) {
      let carrier: number;
      if (b) carrier = b[i];
      else {
        this.ph += fr[i] / sampleRate;
        if (this.ph >= 1) this.ph -= 1;
        carrier = Math.sin(TAU * this.ph);
      }
      o[i] = (a ? a[i] : 0) * carrier * lv[i];
    }
    return true;
  }
}

// ───────────────────────────────────────── Ruidor
class Ruidor extends Mod {
  static get parameterDescriptors() {
    return descriptors('ruidor');
  }
  private rng = new Rng(0x4f4d4e49);
  private b = new Float64Array(7);
  process(_ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const lv = this.ramp(ps, 'nivel', n);
    const oW = out(outs, 0);
    const oP = out(outs, 1);
    const b = this.b;
    for (let i = 0; i < n; i++) {
      const w = this.rng.bipolar();
      // Filtro rosa de Paul Kellet
      b[0] = 0.99886 * b[0] + w * 0.0555179;
      b[1] = 0.99332 * b[1] + w * 0.0750759;
      b[2] = 0.969 * b[2] + w * 0.153852;
      b[3] = 0.8665 * b[3] + w * 0.3104856;
      b[4] = 0.55 * b[4] + w * 0.5329522;
      b[5] = -0.7616 * b[5] - w * 0.016898;
      const pink = (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + w * 0.5362) * 0.11;
      b[6] = w * 0.115926;
      oW[i] = w * lv[i];
      oP[i] = pink * lv[i];
    }
    return true;
  }
}

// ───────────────────────────────────────── Reverberal (Freeverb monofónico)
class Comb {
  private buf: Float32Array;
  private i = 0;
  private store = 0;
  constructor(len: number) {
    this.buf = new Float32Array(len);
  }
  process(x: number, fb: number, damp: number): number {
    const y = this.buf[this.i];
    this.store = y * (1 - damp) + this.store * damp;
    this.buf[this.i] = x + this.store * fb;
    if (++this.i >= this.buf.length) this.i = 0;
    return y;
  }
}

class Allpass {
  private buf: Float32Array;
  private i = 0;
  constructor(len: number) {
    this.buf = new Float32Array(len);
  }
  process(x: number): number {
    const b = this.buf[this.i];
    this.buf[this.i] = x + b * 0.5;
    if (++this.i >= this.buf.length) this.i = 0;
    return b - x;
  }
}

class Reverberal extends Mod {
  static get parameterDescriptors() {
    return descriptors('reverberal');
  }
  private combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(
    (l) => new Comb(Math.round((l * sampleRate) / 44100)),
  );
  private aps = [556, 441, 341, 225].map((l) => new Allpass(Math.round((l * sampleRate) / 44100)));
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const mix = this.ramp(ps, 'intensidad', n);
    const fb = 0.7 + ps.tiempo[0] * 0.28;
    const x = inp(ins, 0);
    const o = out(outs, 0);
    for (let i = 0; i < n; i++) {
      const v = x ? x[i] : 0;
      const vin = v * 0.015;
      let wet = 0;
      for (const c of this.combs) wet += c.process(vin, fb, 0.25);
      for (const a of this.aps) wet = a.process(wet);
      o[i] = v * (1 - mix[i]) + wet * 3 * mix[i];
    }
    return true;
  }
}

// ───────────────────────────────────────── Pulsador (reloj)
class Pulsador extends Mod {
  static get parameterDescriptors() {
    return descriptors('pulsador');
  }
  private ph = 0;
  private running = true;
  private tStart = new Trigger();
  private tStop = new Trigger();
  private lastState = -1;
  protected onMessage(m: Msg): void {
    if (m.type === 'toggle') {
      this.running = !this.running;
      if (this.running) this.ph = 0;
    }
  }
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const rate = ps.reloj[0];
    const w = ps.ancho[0];
    const a = inp(ins, 0);
    const b = inp(ins, 1);
    const o = out(outs, 0);
    const oi = out(outs, 1);
    for (let i = 0; i < n; i++) {
      if (a && this.tStart.rise(a[i])) {
        this.running = true;
        this.ph = 0;
      }
      if (b && this.tStop.rise(b[i])) this.running = false;
      let v = 0;
      if (this.running) {
        v = this.ph < w ? 1 : 0;
        this.ph += rate / sampleRate;
        if (this.ph >= 1) this.ph -= 1;
      }
      o[i] = v;
      oi[i] = this.running ? 1 - v : 0;
    }
    const state = this.running ? 1 : 0;
    if (state !== this.lastState) {
      this.lastState = state;
      this.port.postMessage({ type: 'running', value: this.running });
    }
    return true;
  }
}

// ───────────────────────────────────────── Secuenciador (3 × 10)
class Secuenciador extends Mod {
  static get parameterDescriptors() {
    return descriptors('secuenciador');
  }
  private step = -1;
  private tClock = new Trigger();
  private tReset = new Trigger();
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const steps = Math.round(ps.pasos[0]);
    const quant = ps.cuantizar[0] >= 0.5;
    const ck = inp(ins, 0);
    const rs = inp(ins, 1);
    const oA = out(outs, 0);
    const oB = out(outs, 1);
    const oC = out(outs, 2);
    const oP = out(outs, 3);
    const before = this.step;
    for (let i = 0; i < n; i++) {
      if (rs && this.tReset.rise(rs[i])) this.step = -1;
      if (ck && this.tClock.rise(ck[i])) this.step = (this.step + 1) % steps;
      if (this.step >= steps) this.step = 0;
      const s = Math.max(this.step, 0);
      const a = ps[`s${s}`][0];
      oA[i] = quant ? Math.round(a * 24) / 12 : a * 2;
      oB[i] = ps[`s${10 + s}`][0] * 2;
      oC[i] = ps[`s${20 + s}`][0] * 2;
      oP[i] = ck ? (ck[i] > 0.5 ? 1 : 0) : 0;
    }
    if (this.step !== before) this.port.postMessage({ type: 'step', value: this.step });
    return true;
  }
}

// ───────────────────────────────────────── Teclado (voltaje + pulso)
class Teclado extends Mod {
  static get parameterDescriptors() {
    return descriptors('teclado');
  }
  private held: number[] = [];
  private note = 60;
  private noteSm = 60;
  private retrig = 0;
  protected onMessage(m: Msg): void {
    const note = m.note as number;
    if (m.type === 'noteOn') {
      const wasHeld = this.held.length > 0;
      this.held = this.held.filter((x) => x !== note);
      this.held.push(note);
      this.note = note;
      if (wasHeld) this.retrig = 64; // breve caída del pulso para redisparar
    } else if (m.type === 'noteOff') {
      this.held = this.held.filter((x) => x !== note);
      if (this.held.length) this.note = this.held[this.held.length - 1];
    } else if (m.type === 'allOff') this.held = [];
  }
  process(_ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const gl = ps.portamento[0];
    const c = gl > 0.0005 ? 1 - Math.exp(-1 / (gl * sampleRate)) : 1;
    const oV = out(outs, 0);
    const oG = out(outs, 1);
    const on = this.held.length > 0;
    for (let i = 0; i < n; i++) {
      this.noteSm += (this.note - this.noteSm) * c;
      oV[i] = (this.noteSm - 60) / 12;
      let g = on ? 1 : 0;
      if (this.retrig > 0) {
        this.retrig--;
        g = 0;
      }
      oG[i] = g;
    }
    return true;
  }
}

// ───────────────────────────────────────── Salida (estéreo)
class Salida extends Mod {
  static get parameterDescriptors() {
    return descriptors('salida');
  }
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const L = outs[0][0];
    const R = outs[0][1];
    const n = L.length;
    const vol = this.ramp(ps, 'volumen', n);
    const a = inp(ins, 0);
    const b = inp(ins, 1);
    const l = a ?? b;
    const r = b ?? a;
    for (let i = 0; i < n; i++) {
      L[i] = softClip((l ? l[i] : 0) * vol[i] * 1.4);
      if (R) R[i] = softClip((r ? r[i] : 0) * vol[i] * 1.4);
    }
    return true;
  }
}

registerProcessor('oscilador', Oscilador);
registerProcessor('filtrov', FiltroV);
registerProcessor('filtroo', FiltroO);
registerProcessor('envolvedor', Envolvedor);
registerProcessor('integrador', Integrador);
registerProcessor('aleator', Aleator);
registerProcessor('anillo', Anillo);
registerProcessor('ruidor', Ruidor);
registerProcessor('reverberal', Reverberal);
registerProcessor('pulsador', Pulsador);
registerProcessor('secuenciador', Secuenciador);
registerProcessor('teclado', Teclado);
registerProcessor('salida', Salida);
