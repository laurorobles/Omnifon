import type { Cable } from '../rack';

const SVG = 'http://www.w3.org/2000/svg';
const COLORS = ['#a7a6a0', '#8e8d87', '#b9b7ae', '#7f7e78', '#9d9b92'];

interface Handlers {
  onConnect: (c: Cable) => void;
  onDisconnect: (c: Cable) => void;
}

/** Capa de cables de conexión con caída natural (catenaria aproximada con Bézier). */
export class CableLayer {
  cables: Cable[] = [];
  private svg: SVGSVGElement;
  private gCables: SVGGElement;
  private temp: SVGGElement;
  private drag: { fixed: string; dir: 'in' | 'out'; x: number; y: number } | null = null;

  constructor(
    private host: HTMLElement,
    private h: Handlers,
  ) {
    this.svg = document.createElementNS(SVG, 'svg');
    this.svg.classList.add('cables');
    this.gCables = document.createElementNS(SVG, 'g');
    this.temp = document.createElementNS(SVG, 'g');
    this.svg.append(this.gCables, this.temp);
    host.appendChild(this.svg);

    new ResizeObserver(() => this.render()).observe(host);
    window.addEventListener('resize', () => this.render());
    host.addEventListener('pointerdown', (e) => this.down(e));
    host.addEventListener('pointermove', (e) => this.move(e));
    host.addEventListener('pointerup', (e) => this.up(e));
    host.addEventListener('pointercancel', () => this.cancel());
  }

  set(cables: Cable[]): void {
    this.cables = cables.map((c) => ({ ...c }));
    this.render();
  }

  private jackEl(key: string): HTMLElement | null {
    return this.host.querySelector(`.jack[data-jack="${CSS.escape(key)}"]`);
  }

  private center(key: string): [number, number] | null {
    const el = this.jackEl(key);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const o = this.svg.getBoundingClientRect();
    return [r.left + r.width / 2 - o.left, r.top + r.height / 2 - o.top];
  }

  private local(e: PointerEvent): [number, number] {
    const o = this.svg.getBoundingClientRect();
    return [e.clientX - o.left, e.clientY - o.top];
  }

  private path(a: [number, number], b: [number, number]): string {
    const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const sag = Math.min(180, 25 + dist * 0.32);
    return `M${a[0]},${a[1]} C${a[0]},${a[1] + sag} ${b[0]},${b[1] + sag} ${b[0]},${b[1]}`;
  }

  private drawCable(g: SVGGElement, a: [number, number], b: [number, number], color: string): void {
    const d = this.path(a, b);
    const shadow = document.createElementNS(SVG, 'path');
    shadow.setAttribute('d', d);
    shadow.setAttribute('class', 'cable-shadow');
    const outline = document.createElementNS(SVG, 'path');
    outline.setAttribute('d', d);
    outline.setAttribute('class', 'cable-outline');
    const body = document.createElementNS(SVG, 'path');
    body.setAttribute('d', d);
    body.setAttribute('class', 'cable-body');
    body.setAttribute('stroke', color);
    const shine = document.createElementNS(SVG, 'path');
    shine.setAttribute('d', d);
    shine.setAttribute('class', 'cable-shine');
    g.append(shadow, outline, body, shine);
    for (const p of [a, b]) {
      const plug = document.createElementNS(SVG, 'circle');
      plug.setAttribute('cx', String(p[0]));
      plug.setAttribute('cy', String(p[1]));
      plug.setAttribute('r', '6.5');
      plug.setAttribute('class', 'plug');
      g.appendChild(plug);
    }
  }

  render(): void {
    const { width, height } = this.host.getBoundingClientRect();
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.gCables.replaceChildren();
    this.host.querySelectorAll('.jack.patched').forEach((j) => j.classList.remove('patched'));
    this.cables.forEach((c, i) => {
      const a = this.center(c.from);
      const b = this.center(c.to);
      if (!a || !b) return;
      this.jackEl(c.from)?.classList.add('patched');
      this.jackEl(c.to)?.classList.add('patched');
      this.drawCable(this.gCables, a, b, COLORS[i % COLORS.length]);
    });
  }

  private down(e: PointerEvent): void {
    const j = (e.target as HTMLElement).closest<HTMLElement>('.jack');
    if (!j) return;
    e.preventDefault();
    const key = j.dataset.jack!;
    const dir = j.dataset.dir as 'in' | 'out';
    if (dir === 'in') {
      const existing = this.cables.find((c) => c.to === key);
      if (existing) {
        // desenchufar: el cable queda colgando de su salida
        this.remove(existing);
        this.drag = { fixed: existing.from, dir: 'out', x: 0, y: 0 };
      } else {
        this.drag = { fixed: key, dir: 'in', x: 0, y: 0 };
      }
    } else {
      this.drag = { fixed: key, dir: 'out', x: 0, y: 0 };
    }
    this.host.setPointerCapture(e.pointerId);
    this.host.classList.add('patching');
    this.move(e);
  }

  private move(e: PointerEvent): void {
    if (!this.drag) return;
    const a = this.center(this.drag.fixed);
    if (!a) return;
    this.temp.replaceChildren();
    this.drawCable(this.temp, a, this.local(e), '#c8c6bd');
  }

  private up(e: PointerEvent): void {
    if (!this.drag) return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const target = el?.closest<HTMLElement>('.jack');
    if (target && target.dataset.dir !== this.drag.dir) {
      const other = target.dataset.jack!;
      const cable: Cable =
        this.drag.dir === 'out' ? { from: this.drag.fixed, to: other } : { from: other, to: this.drag.fixed };
      const occupied = this.cables.find((c) => c.to === cable.to);
      if (occupied) this.remove(occupied);
      this.cables.push(cable);
      this.h.onConnect(cable);
    }
    this.cancel();
    this.render();
  }

  private cancel(): void {
    this.drag = null;
    this.temp.replaceChildren();
    this.host.classList.remove('patching');
  }

  private remove(c: Cable): void {
    this.cables = this.cables.filter((x) => x !== c);
    this.h.onDisconnect(c);
    this.render();
  }
}
