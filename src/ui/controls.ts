import type { ParamDef } from '../engine/params';

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
    case 'choice':
      return def.choices?.[Math.round(v)] ?? String(v);
  }
}

function toNorm(def: ParamDef, v: number): number {
  if (def.curve === 'log') return Math.log(v / def.min) / Math.log(def.max / def.min);
  return (v - def.min) / (def.max - def.min);
}

function fromNorm(def: ParamDef, n: number): number {
  n = Math.min(1, Math.max(0, n));
  if (def.curve === 'log') return def.min * (def.max / def.min) ** n;
  return def.min + n * (def.max - def.min);
}

/** Perilla de baquelita: arrastre vertical, Shift = ajuste fino, doble clic = valor inicial, rueda. */
export function createKnob(
  def: ParamDef,
  value: number,
  onChange: (v: number) => void,
  size: 'lg' | 'md' = 'md',
): { el: HTMLElement; set: (v: number) => void } {
  const el = document.createElement('div');
  el.className = `knob knob-${size}`;
  el.innerHTML = `
    <div class="knob-scale"><div class="knob-cap"><div class="knob-pointer"></div></div></div>
    <div class="knob-label">${def.label}</div>
    <output class="knob-value"></output>`;
  const cap = el.querySelector('.knob-cap') as HTMLElement;
  const out = el.querySelector('.knob-value') as HTMLOutputElement;
  el.tabIndex = 0;
  el.setAttribute('role', 'slider');
  el.setAttribute('aria-label', def.label);

  let norm = toNorm(def, value);
  const render = () => {
    const v = fromNorm(def, norm);
    cap.style.transform = `rotate(${-135 + norm * 270}deg)`;
    out.textContent = format(def, v);
    el.setAttribute('aria-valuetext', out.textContent);
  };
  const update = (n: number) => {
    norm = Math.min(1, Math.max(0, n));
    render();
    onChange(fromNorm(def, norm));
  };

  let startY = 0;
  let startNorm = 0;
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    startY = e.clientY;
    startNorm = norm;
    el.classList.add('active');
  });
  el.addEventListener('pointermove', (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    const range = e.shiftKey ? 1200 : 200;
    update(startNorm + (startY - e.clientY) / range);
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
      update(norm - Math.sign(e.deltaY) * (e.shiftKey ? 0.002 : 0.02));
    },
    { passive: false },
  );
  el.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 0.002 : 0.02;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') update(norm + step);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') update(norm - step);
    else return;
    e.preventDefault();
    e.stopPropagation();
  });

  render();
  return {
    el,
    set: (v: number) => {
      norm = toNorm(def, v);
      render();
    },
  };
}

/** Conmutador de palanca / selector de posiciones. */
export function createSwitch(
  def: ParamDef,
  value: number,
  onChange: (v: number) => void,
): { el: HTMLElement; set: (v: number) => void } {
  const el = document.createElement('div');
  el.className = 'switch';
  const label = document.createElement('div');
  label.className = 'knob-label';
  label.textContent = def.label;
  const group = document.createElement('div');
  group.className = 'switch-group';
  const buttons = (def.choices ?? []).map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = c;
    b.addEventListener('click', () => {
      set(i);
      onChange(i);
    });
    group.appendChild(b);
    return b;
  });
  const set = (v: number) => buttons.forEach((b, i) => b.classList.toggle('on', i === Math.round(v)));
  el.append(group, label);
  set(value);
  return { el, set };
}
