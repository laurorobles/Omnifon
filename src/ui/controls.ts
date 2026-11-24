import type { ParamDef } from '../engine/modules';
import { tr, type Lang } from '../i18n';

let currentLang: Lang = 'es';
export function setControlsLang(lang: Lang): void {
  currentLang = lang;
}

export function format(def: ParamDef, v: number): string {
  switch (def.fmt) {
    case 'hz':
      if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 1 : 2)} kHz`;
      return `${v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0)} Hz`;
    case 's':
      return v < 1 ? `${(v * 1000).toFixed(v < 0.01 ? 1 : 0)} ms` : `${v.toFixed(2)} s`;
    case 'pct':
      return `${Math.round(v * 100)} %`;
    case 'oct':
      return `${v > 0 ? '+' : ''}${v.toFixed(2)} oct`;
    case 'st':
      return `${v > 0 ? '+' : ''}${v.toFixed(2)} st`;
    case 'int':
      return String(Math.round(v));
    case 'choice': {
      const raw = def.choices?.[Math.round(v)] ?? String(v);
      return tr(raw, currentLang);
    }
  }
}

function toNorm(def: ParamDef, v: number): number {
  if (def.curve === 'log') return Math.log(v / def.min) / Math.log(def.max / def.min);
  return (v - def.min) / (def.max - def.min);
}

function fromNorm(def: ParamDef, n: number): number {
  n = Math.min(1, Math.max(0, n));
  let v = def.curve === 'log' ? def.min * (def.max / def.min) ** n : def.min + n * (def.max - def.min);
  if (def.fmt === 'int') v = Math.round(v);
  return v;
}

export interface Control {
  el: HTMLElement;
  set: (v: number) => void;
  refreshLang?: () => void;
}

/** Interacción común: arrastre, rueda, teclado, doble clic = valor inicial. */
function bindDrag(
  el: HTMLElement,
  def: ParamDef,
  getNorm: () => number,
  update: (n: number) => void,
  axis: 'y' | 'x',
  range: number,
): void {
  el.tabIndex = 0;
  el.setAttribute('role', 'slider');
  el.setAttribute('aria-label', def.label);
  let start = 0;
  let startNorm = 0;
  el.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    start = axis === 'y' ? e.clientY : e.clientX;
    startNorm = getNorm();
    el.classList.add('active');
  });
  el.addEventListener('pointermove', (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    const pos = axis === 'y' ? start - e.clientY : e.clientX - start;
    update(startNorm + pos / (e.shiftKey ? range * 6 : range));
  });
  const end = (e: PointerEvent) => {
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    el.classList.remove('active');
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('dblclick', () => update(toNorm(def, def.def)));
  el.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      update(getNorm() - Math.sign(e.deltaY) * (e.shiftKey ? 0.002 : 0.02));
    },
    { passive: false },
  );
  el.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 0.002 : 0.02;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') update(getNorm() + step);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') update(getNorm() - step);
    else return;
    e.preventDefault();
    e.stopPropagation();
  });
}

function rangeTicks(def: ParamDef): [string, string] {
  if (def.fmt === 'hz' && def.max >= 18000) return ['5hz', '20khz.'];
  if (def.fmt === 'hz' && def.max >= 10000) return ['20Hz', '16kHz'];
  if (def.fmt === 's' && def.max >= 5) return ['mín.', 'seg.'];
  if (def.fmt === 'st') return ['-2', '+2'];
  return ['mín.', 'máx.'];
}

/** Genera las marcas radiales exteriores (-135° a +135°) y el estriado perimetral en SVG. */
const TICKS_SVG = (() => {
  const lines: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const deg = -135 + i * 27;
    const rad = ((deg - 90) * Math.PI) / 180;
    const x1 = 50 + Math.cos(rad) * 42.2;
    const y1 = 50 + Math.sin(rad) * 42.2;
    const x2 = 50 + Math.cos(rad) * 47.2;
    const y2 = 50 + Math.sin(rad) * 47.2;
    lines.push(
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" class="knob-tick" />`,
    );
  }
  return lines.join('');
})();

function buildRibsSvg(count = 32): string {
  const ribs: string[] = [];
  for (let i = 0; i < count; i++) {
    const deg = (i * 360) / count;
    const rad = ((deg - 90) * Math.PI) / 180;
    const x1 = 50 + Math.cos(rad) * 26.2;
    const y1 = 50 + Math.sin(rad) * 26.2;
    const x2 = 50 + Math.cos(rad) * 33.6;
    const y2 = 50 + Math.sin(rad) * 33.6;
    ribs.push(
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" class="knob-rib" />`,
    );
  }
  return ribs.join('');
}

const RIBS_SVG = buildRibsSvg(32);

function knobSvgMarkup(): string {
  return `
    <svg class="knob-svg" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="41.8" class="knob-well" />
      ${TICKS_SVG}
      <g class="knob-shadow">
        <g class="knob-rotor">
          <circle cx="50" cy="50" r="34" class="knob-skirt" />
          ${RIBS_SVG}
          <circle cx="50" cy="50" r="34" class="knob-rim" />
          <circle cx="50" cy="50" r="26.2" class="knob-face" />
          <rect x="47.8" y="18.6" width="4.4" height="29" rx="2.2" class="knob-pointer-svg" />
        </g>
      </g>
    </svg>`;
}

/**
 * Perilla estriada fiel al diseño de referencia:
 * - negra mate con indicador crema (tamaños md y sm)
 * - blanca mate con indicador oscuro en controles principales de frecuencia/centro (lg)
 */
export function createKnob(
  def: ParamDef,
  value: number,
  onChange: (v: number) => void,
  size: 'lg' | 'md' | 'sm' = 'md',
  showLabel = true,
): Control {
  const el = document.createElement('div');
  const colorCls = size === 'lg' ? 'knob-white' : 'knob-dark';
  el.className = `knob knob-${size} ${colorCls}`;
  const [lo, hi] = rangeTicks(def);
  const minmax =
    size === 'sm'
      ? ''
      : `<div class="knob-minmax"><span data-i18n="${lo}">${lo}</span><span data-i18n="${hi}">${hi}</span></div>`;
  el.innerHTML = `
    ${showLabel ? `<div class="knob-label" data-i18n="${def.label}">${def.label}</div>` : ''}
    <div class="knob-body">${knobSvgMarkup()}</div>
    ${minmax}
    <output class="knob-value"></output>`;
  const rotor = el.querySelector('.knob-rotor') as SVGGElement;
  const out = el.querySelector('.knob-value') as HTMLOutputElement;
  let norm = toNorm(def, value);
  const render = () => {
    const angle = -135 + norm * 270;
    rotor.setAttribute('transform', `rotate(${angle.toFixed(2)} 50 50)`);
    out.textContent = format(def, fromNorm(def, norm));
    const lbl = tr(def.label, currentLang);
    el.setAttribute('aria-label', lbl);
    el.setAttribute('aria-valuetext', out.textContent);
    el.title = `${lbl}: ${out.textContent}`;
  };
  const update = (n: number) => {
    norm = Math.min(1, Math.max(0, n));
    render();
    onChange(fromNorm(def, norm));
  };
  bindDrag(el, def, () => norm, update, 'y', 200);
  render();
  return {
    el,
    set: (v) => {
      norm = toNorm(def, v);
      render();
    },
    refreshLang: render,
  };
}

/** Potenciómetro deslizante horizontal (banco Filtro-O). */
export function createFader(def: ParamDef, value: number, onChange: (v: number) => void): Control {
  const el = document.createElement('div');
  el.className = 'fader';
  el.innerHTML = `<div class="fader-track"></div><div class="fader-cap"></div>`;
  const cap = el.querySelector('.fader-cap') as HTMLElement;
  let norm = toNorm(def, value);
  const render = () => {
    cap.style.left = `${norm * 100}%`;
    const txt = format(def, fromNorm(def, norm));
    const lbl = tr(def.label, currentLang);
    el.title = `${lbl}: ${txt}`;
    el.setAttribute('aria-label', lbl);
    el.setAttribute('aria-valuetext', txt);
  };
  const update = (n: number) => {
    norm = Math.min(1, Math.max(0, n));
    render();
    onChange(fromNorm(def, norm));
  };
  bindDrag(el, def, () => norm, update, 'x', 80);
  render();
  return {
    el,
    set: (v) => {
      norm = toNorm(def, v);
      render();
    },
    refreshLang: render,
  };
}

/** Selector de palanca. */
export function createSwitch(def: ParamDef, value: number, onChange: (v: number) => void): Control {
  const el = document.createElement('div');
  el.className = 'switch';
  const label = document.createElement('div');
  label.className = 'knob-label';
  label.dataset.i18n = def.label;
  label.textContent = def.label;
  const group = document.createElement('div');
  group.className = 'switch-group';
  const buttons = (def.choices ?? []).map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.i18n = c;
    b.textContent = c;
    b.addEventListener('click', () => {
      set(i);
      onChange(i);
    });
    group.appendChild(b);
    return b;
  });
  const set = (v: number) => buttons.forEach((b, i) => b.classList.toggle('on', i === Math.round(v)));
  el.append(label, group);
  set(value);
  return { el, set };
}
