import processorUrl from './engine/omnifon-processor.ts?worker&url';
import { PARAMS, STUDIO_ONLY } from './engine/params';

export type Mode = 'prototipo' | 'estudio';

/** Puente entre la interfaz y el AudioWorklet. */
export class OmnifonEngine {
  ctx: AudioContext | null = null;
  node: AudioWorkletNode | null = null;
  analyser: AnalyserNode | null = null;
  private values: Record<string, number> = {};
  private mode: Mode = 'prototipo';

  constructor(initial: Record<string, number>, mode: Mode) {
    this.values = { ...initial };
    this.mode = mode;
  }

  get running(): boolean {
    return this.ctx?.state === 'running';
  }

  async start(): Promise<void> {
    if (this.ctx) {
      await this.ctx.resume();
      return;
    }
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    await ctx.audioWorklet.addModule(processorUrl);
    const node = new AudioWorkletNode(ctx, 'omnifon', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 4096;
    node.connect(analyser);
    analyser.connect(ctx.destination);
    this.ctx = ctx;
    this.node = node;
    this.analyser = analyser;
    for (const p of PARAMS) this.push(p.id);
  }

  set(id: string, value: number): void {
    this.values[id] = value;
    this.push(id);
  }

  setMode(mode: Mode): void {
    this.mode = mode;
    for (const id of STUDIO_ONLY) this.push(id);
  }

  noteOn(note: number): void {
    this.node?.port.postMessage({ type: 'noteOn', note });
  }

  noteOff(note: number): void {
    this.node?.port.postMessage({ type: 'noteOff', note });
  }

  allOff(): void {
    this.node?.port.postMessage({ type: 'allOff' });
  }

  private push(id: string): void {
    if (!this.node || !this.ctx) return;
    let v = this.values[id];
    // En Modo Prototipo el oscilador modulador queda desconectado.
    if (this.mode === 'prototipo' && STUDIO_ONLY.includes(id)) v = 0;
    const param = this.node.parameters.get(id);
    param?.setValueAtTime(v, this.ctx.currentTime);
  }
}
