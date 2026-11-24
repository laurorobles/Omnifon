import processorUrl from './engine/processors.ts?worker&url';
import { MODULES, RACK } from './engine/modules';

/** Un cable: de «modulo.salida» a «modulo.entrada». */
export interface Cable {
  from: string;
  to: string;
}

export function splitJack(key: string): [string, string] {
  const i = key.indexOf('.');
  return [key.slice(0, i), key.slice(i + 1)];
}

function jackIndex(key: string, dir: 'in' | 'out'): [string, number] {
  const [mod, jack] = splitJack(key);
  const inst = RACK.find((r) => r.id === mod);
  if (!inst) throw new Error(`Módulo desconocido: ${mod}`);
  const def = MODULES[inst.type];
  const list = dir === 'in' ? def.inputs : def.outputs;
  const idx = list.findIndex((j) => j.id === jack);
  if (idx < 0) throw new Error(`Conector desconocido: ${key}`);
  return [mod, idx];
}

function seqSelfResetStep(c: Cable): number | null {
  if (c.to === 'secuenciador.reinicio' && c.from.startsWith('secuenciador.st')) {
    const n = Number(c.from.slice('secuenciador.st'.length));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

type Listener = (msg: { type: string; value?: unknown }) => void;

/** Gabinete de audio: un AudioWorkletNode por módulo, cables = conexiones del grafo. */
export class Rack {
  ctx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  private nodes = new Map<string, AudioWorkletNode>();
  private listeners = new Map<string, Listener[]>();

  get running(): boolean {
    return this.ctx?.state === 'running';
  }

  async start(values: Record<string, Record<string, number>>, cables: Cable[]): Promise<void> {
    if (this.ctx) {
      await this.ctx.resume();
      return;
    }
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    await ctx.audioWorklet.addModule(processorUrl);
    for (const inst of RACK) {
      const def = MODULES[inst.type];
      const node = new AudioWorkletNode(ctx, def.type, {
        numberOfInputs: def.inputs.length,
        numberOfOutputs: def.stereo ? 1 : def.outputs.length,
        outputChannelCount: def.stereo ? [2] : def.outputs.map(() => 1),
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'discrete',
        parameterData: values[inst.id] ?? {},
      });
      node.port.onmessage = (e) => this.listeners.get(inst.id)?.forEach((l) => l(e.data));
      this.nodes.set(inst.id, node);
    }
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 4096;
    this.nodes.get('salida')!.connect(analyser);
    analyser.connect(ctx.destination);
    this.ctx = ctx;
    this.analyser = analyser;
    cables.forEach((c) => this.connect(c));
  }

  connect(c: Cable): void {
    if (!this.ctx) return;
    const selfStep = seqSelfResetStep(c);
    if (selfStep !== null) {
      this.send('secuenciador', { type: 'resetAt', step: selfStep });
      return;
    }
    const [fm, fi] = jackIndex(c.from, 'out');
    const [tm, ti] = jackIndex(c.to, 'in');
    this.nodes.get(fm)!.connect(this.nodes.get(tm)!, fi, ti);
  }

  disconnect(c: Cable): void {
    if (!this.ctx) return;
    const selfStep = seqSelfResetStep(c);
    if (selfStep !== null) {
      this.send('secuenciador', { type: 'resetAt', step: null });
      return;
    }
    const [fm, fi] = jackIndex(c.from, 'out');
    const [tm, ti] = jackIndex(c.to, 'in');
    try {
      this.nodes.get(fm)!.disconnect(this.nodes.get(tm)!, fi, ti);
    } catch {
      /* ya desconectado */
    }
  }

  set(mod: string, param: string, value: number): void {
    const node = this.nodes.get(mod);
    if (!node || !this.ctx) return;
    node.parameters.get(param)?.setValueAtTime(value, this.ctx.currentTime);
  }

  send(mod: string, msg: Record<string, unknown>): void {
    this.nodes.get(mod)?.port.postMessage(msg);
  }

  on(mod: string, l: Listener): void {
    const arr = this.listeners.get(mod) ?? [];
    arr.push(l);
    this.listeners.set(mod, arr);
  }
}
