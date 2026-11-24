/**
 * Procesadores DSP del Omnifón modular (un AudioWorkletProcessor por tipo de módulo).
 * Alineado 1:1 con los conectores y controles del gabinete físico original.
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

abstract class Mod extends AudioWorkletProcessor {
  private last: Record<string, number> = {};
  private bufs: Record<string, Float32Array> = {};
  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => this.onMessage(e.data as Msg);
  }
  protected onMessage(_m: Msg): void {}

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

// ───────────────────────────────────────── 1. Envolvedor
class Envolvedor extends Mod {
  static get parameterDescriptors() {
    return descriptors('envolvedor');
  }
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const nv = this.ramp(ps, 'nivel', n);
    const md = this.ramp(ps, 'mod', n);
    const x = inp(ins, 0);
    const c = inp(ins, 1);
    const o1 = out(outs, 0);
    const o2 = out(outs, 1);
    for (let i = 0; i < n; i++) {
      const g = clamp(nv[i] + md[i] * (c ? c[i] : 0), 0, 2);
      const y = (x ? x[i] : 0) * g;
      o1[i] = y;
      o2[i] = y;
    }
    return true;
  }
}

// ───────────────────────────────────────── 2. Aleator
class Aleator extends Mod {
  static get parameterDescriptors() {
    return descriptors('aleator');
  }
  private rng = new Rng(0xa1ea7);
  private trig = new Trigger();
  private ph = 0;
  private value = 0;
  private smooth = 0;
  process(ins: Ins, outs: Outs): boolean {
    const n = out(outs, 0).length;
    const rate = 2.5;
    const c = 1 - Math.exp((-TAU * 2.2) / sampleRate);
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
      oE[i] = this.value * 0.8;
      oS[i] = this.smooth * 0.8;
    }
    return true;
  }
}

// ───────────────────────────────────────── 3. Mod. Anular
class Anillo extends Mod {
  static get parameterDescriptors() {
    return descriptors('anillo');
  }
  private ph = 0;
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const lv = this.ramp(ps, 'nivel', n);
    const a = inp(ins, 0);
    const b = inp(ins, 1);
    const m = inp(ins, 2);
    const o1 = out(outs, 0);
    const o2 = out(outs, 1);
    for (let i = 0; i < n; i++) {
      let carrier: number;
      if (b) {
        carrier = b[i];
      } else {
        const f = clamp(220 * 2 ** (m ? m[i] : 0), 1, 0.45 * sampleRate);
        this.ph += f / sampleRate;
        if (this.ph >= 1) this.ph -= Math.floor(this.ph);
        carrier = Math.sin(TAU * this.ph);
      }
      const modScale = b && m ? clamp(1 + m[i] * 0.5, 0, 2) : 1;
      const y = (a ? a[i] : 0) * carrier * lv[i] * modScale;
      o1[i] = y;
      o2[i] = y;
    }
    return true;
  }
}

// ───────────────────────────────────────── 4. Ruidor
class Ruidor extends Mod {
  static get parameterDescriptors() {
    return descriptors('ruidor');
  }
  private rng = new Rng(0x4f4d4e49);
  private b = new Float64Array(7);
  process(_ins: Ins, outs: Outs): boolean {
    const n = out(outs, 0).length;
    const oW = out(outs, 0);
    const oP = out(outs, 1);
    const b = this.b;
    for (let i = 0; i < n; i++) {
      const w = this.rng.bipolar();
      b[0] = 0.99886 * b[0] + w * 0.0555179;
      b[1] = 0.99332 * b[1] + w * 0.0750759;
      b[2] = 0.969 * b[2] + w * 0.153852;
      b[3] = 0.8665 * b[3] + w * 0.3104856;
      b[4] = 0.55 * b[4] + w * 0.5329522;
      b[5] = -0.7616 * b[5] - w * 0.016898;
      const pink = (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + w * 0.5362) * 0.11;
      b[6] = w * 0.115926;
      oW[i] = w * 0.75;
      oP[i] = pink * 0.75;
    }
    return true;
  }
}

// ───────────────────────────────────────── 5. Reverberal
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
    const fb = 0.68 + ps.tiempo[0] * 0.29;
    const x1 = inp(ins, 0);
    const x2 = inp(ins, 1);
    const o1 = out(outs, 0);
    const o2 = out(outs, 1);
    for (let i = 0; i < n; i++) {
      const v = (x1 ? x1[i] : 0) + (x2 ? x2[i] : 0);
      const vin = v * 0.015;
      let wet = 0;
      for (const c of this.combs) wet += c.process(vin, fb, 0.25);
      for (const a of this.aps) wet = a.process(wet);
      const y = v * (1 - mix[i]) + wet * 3 * mix[i];
      o1[i] = y;
      o2[i] = y;
    }
    return true;
  }
}

// ───────────────────────────────────────── 6. Integrador Envolv.
const enum EnvStage {
  Idle,
  Attack,
  Hold,
  Decay,
}

class Integrador extends Mod {
  static get parameterDescriptors() {
    return descriptors('integrador');
  }
  private env = 0;
  private stage: EnvStage = EnvStage.Idle;
  private holdSamples = 0;
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
    const holdTarget = Math.max(1, Math.round(ps.duracion[0] * sr));
    const cD = 1 - Math.exp(-6.9 / (ps.decaimiento[0] * sr));
    const autoCycle = ps.modo[0] >= 0.5;

    const pIn = inp(ins, 0);
    const oE1 = out(outs, 0);
    const oE2 = out(outs, 1);
    const oPls = out(outs, 2);

    for (let i = 0; i < n; i++) {
      const extGate = this.manual || (pIn ? pIn[i] > 0.5 : false);
      if (extGate && !this.gate) {
        this.stage = EnvStage.Attack;
      }
      this.gate = extGate;

      if (autoCycle && this.stage === EnvStage.Idle) {
        this.stage = EnvStage.Attack;
      }

      switch (this.stage) {
        case EnvStage.Attack:
          this.env += (1.2 - this.env) * cA;
          if (this.env >= 1) {
            this.env = 1;
            this.holdSamples = holdTarget;
            this.stage = EnvStage.Hold;
          }
          break;
        case EnvStage.Hold:
          this.env = 1;
          if (this.holdSamples > 0) this.holdSamples--;
          if (this.holdSamples <= 0 && (autoCycle || !extGate)) {
            this.stage = EnvStage.Decay;
          }
          break;
        case EnvStage.Decay:
          this.env -= this.env * cD;
          if (this.env < 1e-4) {
            this.env = 0;
            this.stage = autoCycle ? EnvStage.Attack : EnvStage.Idle;
          }
          break;
      }

      oE1[i] = this.env;
      oE2[i] = this.env;
      oPls[i] = this.stage === EnvStage.Attack || this.stage === EnvStage.Hold ? 1 : 0;
    }
    return true;
  }
}

// ───────────────────────────────────────── 7 & 8. Oscilador
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
    const rec = ps.modoMod[0] >= 0.5;
    const cvF = inp(ins, 0);
    const cvM = inp(ins, 1);
    const oS = out(outs, 0);
    const oT = out(outs, 1);
    const oR = out(outs, 2);
    const oQ = out(outs, 3);
    const nyq = 0.45 * sampleRate;
    for (let i = 0; i < n; i++) {
      const mRaw = cvM ? cvM[i] : 0;
      const mVal = rec ? Math.max(0, mRaw) : mRaw;
      const pitch = Math.log2(fr[i]) + fino + (cvF ? cvF[i] : 0) + mVal * md[i] * 3;
      const f = clamp(2 ** pitch, 0.01, nyq);
      const dt = f / sampleRate;
      let ph = this.ph + dt;
      if (ph >= 1) ph -= Math.floor(ph);
      this.ph = ph;
      const w = clamp(an[i], 0.03, 0.97);
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

// ───────────────────────────────────────── 9. Filtro-V
class FiltroV extends Mod {
  static get parameterDescriptors() {
    return descriptors('filtrov');
  }
  private svf = new Svf();
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const ce = this.ramp(ps, 'centro', n);
    const co = this.ramp(ps, 'corte', n);
    const an = this.ramp(ps, 'ancho', n);
    const mo = this.ramp(ps, 'modulacion', n);
    const x = inp(ins, 0);
    const wCv = inp(ins, 1);
    const cv = inp(ins, 2);
    const cm = inp(ins, 3);
    const oL = out(outs, 0);
    const oH = out(outs, 1);
    const oB = out(outs, 2);
    const fmax = 0.49 * sampleRate;
    for (let i = 0; i < n; i++) {
      const lc = Math.log2(ce[i]) + co[i] + (cv ? cv[i] : 0) + (cm ? cm[i] * mo[i] : 0);
      const fc = clamp(2 ** lc, 10, fmax);
      const g = Math.tan((Math.PI * fc) / sampleRate);
      const w = clamp(an[i] + (wCv ? wCv[i] * 0.4 : 0), 0, 1);
      const k = 0.04 + w * 1.96;
      this.svf.process(softClip(x ? x[i] : 0), g, k);
      oL[i] = this.svf.low;
      oH[i] = this.svf.high;
      oB[i] = this.svf.band;
    }
    return true;
  }
}

// ───────────────────────────────────────── 10. Filtro-O
class FiltroO extends Mod {
  static get parameterDescriptors() {
    return descriptors('filtroo');
  }
  private svfs = BANDS.map(() => new Svf());
  private gs = BANDS.map((f) => Math.tan((Math.PI * Math.min(f, 0.45 * sampleRate)) / sampleRate));
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const x = inp(ins, 0);
    const co = this.ramp(ps, 'corte', n);
    const gains = BANDS.map((_, b) => this.ramp(ps, `g${b}`, n));
    const su = this.ramp(ps, 'suma', n);
    const oSum = out(outs, 0);
    const K = 0.7071;
    for (let i = 0; i < n; i++) {
      const v = x ? x[i] : 0;
      let sum = 0;
      const cut = co[i];
      for (let b = 0; b < BANDS.length; b++) {
        const s = this.svfs[b];
        s.process(v, this.gs[b], K);
        const tilt = clamp(1 - (1 - cut) * (b / 9) * 1.3, 0, 1);
        const y = s.band * K * gains[b][i] * tilt;
        out(outs, b + 1)[i] = y;
        sum += y;
      }
      oSum[i] = sum * su[i];
    }
    return true;
  }
}

// ───────────────────────────────────────── 11. Pulsador
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
    if (m.type === 'start') {
      this.running = true;
      this.ph = 0;
    } else if (m.type === 'stop') {
      this.running = false;
    } else if (m.type === 'toggle') {
      this.running = !this.running;
      if (this.running) this.ph = 0;
    }
  }
  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const baseRate = ps.reloj[0];
    const baseW = ps.ancho[0];
    const a = inp(ins, 0);
    const b = inp(ins, 1);
    const wCv = inp(ins, 2);
    const rCv = inp(ins, 3);
    const o1 = out(outs, 0);
    const o2 = out(outs, 1);
    const o3 = out(outs, 2);
    for (let i = 0; i < n; i++) {
      if (a && this.tStart.rise(a[i])) {
        this.running = true;
        this.ph = 0;
      }
      if (b && this.tStop.rise(b[i])) this.running = false;
      const rate = rCv ? clamp(baseRate * 2 ** rCv[i], 0.05, 100) : baseRate;
      const w = wCv ? clamp(baseW + wCv[i] * 0.4, 0.05, 0.95) : baseW;
      let v = 0;
      if (this.running) {
        v = this.ph < w ? 1 : 0;
        this.ph += rate / sampleRate;
        if (this.ph >= 1) this.ph -= 1;
      }
      o1[i] = v;
      o2[i] = v;
      o3[i] = this.running ? 1 - v : 0;
    }
    const state = this.running ? 1 : 0;
    if (state !== this.lastState) {
      this.lastState = state;
      this.port.postMessage({ type: 'running', value: this.running });
    }
    return true;
  }
}

// ───────────────────────────────────────── 12. Secuenciador
class Secuenciador extends Mod {
  static get parameterDescriptors() {
    return descriptors('secuenciador');
  }
  private step = 0;
  private started = false;
  private resetAtStep: number | null = null;
  private tClock = new Trigger();
  private tReset = new Trigger();

  protected onMessage(m: Msg): void {
    if (m.type === 'resetAt') {
      this.resetAtStep = typeof m.step === 'number' ? m.step : null;
    }
  }

  process(ins: Ins, outs: Outs, ps: Ps): boolean {
    const n = out(outs, 0).length;
    const ck = inp(ins, 0);
    const rs = inp(ins, 1);
    const oPls = out(outs, 0);
    const oA = out(outs, 1);
    const oB = out(outs, 2);
    const oC = out(outs, 3);
    const oVolt = out(outs, 4);
    const before = this.step;

    for (let i = 0; i < n; i++) {
      if (rs && this.tReset.rise(rs[i])) {
        this.step = 0;
        this.started = false;
      }
      if (ck && this.tClock.rise(ck[i])) {
        if (!this.started) {
          this.step = 0;
          this.started = true;
        } else {
          this.step = (this.step + 1) % 10;
        }
        if (this.resetAtStep !== null && this.step === this.resetAtStep) {
          this.step = 0;
        }
      }
      const s = this.step;
      const a = ps[`s${s}`][0];
      const swOn = ps[`sw${s}`][0] >= 0.5;
      oA[i] = Math.round(a * 24) / 12;
      oB[i] = ps[`s${10 + s}`][0] * 2;
      oC[i] = ps[`s${20 + s}`][0] * 2;
      oVolt[i] = a * 2;
      const gate = swOn && ck && ck[i] > 0.5 ? 1 : 0;
      oPls[i] = gate;
      for (let k = 0; k < 10; k++) {
        out(outs, 5 + k)[i] = k === s ? 1 : 0;
      }
    }
    if (this.step !== before) this.port.postMessage({ type: 'step', value: this.step });
    return true;
  }
}

// ───────────────────────────────────────── Teclado y Salida
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
      if (wasHeld) this.retrig = 64;
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
    const both = Boolean(a && b);
    const l = a ?? b;
    const r = b ?? a;
    for (let i = 0; i < n; i++) {
      const lv = both ? a![i] * 0.85 + b![i] * 0.25 : l ? l[i] : 0;
      const rv = both ? b![i] * 0.85 + a![i] * 0.25 : r ? r[i] : 0;
      L[i] = softClip(lv * vol[i] * 1.4);
      if (R) R[i] = softClip(rv * vol[i] * 1.4);
    }
    return true;
  }
}

registerProcessor('envolvedor', Envolvedor);
registerProcessor('aleator', Aleator);
registerProcessor('anillo', Anillo);
registerProcessor('ruidor', Ruidor);
registerProcessor('reverberal', Reverberal);
registerProcessor('integrador', Integrador);
registerProcessor('oscilador', Oscilador);
registerProcessor('filtrov', FiltroV);
registerProcessor('filtroo', FiltroO);
registerProcessor('pulsador', Pulsador);
registerProcessor('secuenciador', Secuenciador);
registerProcessor('teclado', Teclado);
registerProcessor('salida', Salida);
