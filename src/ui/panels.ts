import { MODULES, type Instance, type JackDef, type ParamDef } from '../engine/modules';
import { createFader, createKnob, createSwitch, type Control } from './controls';

export interface PanelContext {
  values: Record<string, Record<string, number>>;
  onParam: (mod: string, id: string, v: number) => void;
  onButton: (mod: string, id: string, down: boolean) => void;
  /** setters["mod.param"] para actualizar la interfaz al cargar parches */
  setters: Record<string, (v: number) => void>;
}

const h = (tag: string, cls = '', html = ''): HTMLElement => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};

function jack(mod: string, jd: JackDef, dir: 'in' | 'out', showLabel = true): HTMLElement {
  const w = h('div', `jack-wrap ${dir}`);
  const j = h('div', 'jack');
  j.dataset.jack = `${mod}.${jd.id}`;
  j.dataset.dir = dir;
  j.title = `${jd.label} (${dir === 'in' ? 'entrada' : 'salida'})`;
  w.appendChild(j);
  if (showLabel) w.appendChild(h('span', '', jd.label));
  return w;
}

function control(inst: Instance, def: ParamDef, ctx: PanelContext, labelled = true): HTMLElement {
  const v = ctx.values[inst.id]?.[def.id] ?? def.def;
  const cb = (x: number) => ctx.onParam(inst.id, def.id, x);
  let c: Control;
  switch (def.control) {
    case 'switch':
      c = createSwitch(def, v, cb);
      break;
    case 'fader':
      c = createFader(def, v, cb);
      break;
    case 'knob-lg':
      c = createKnob(def, v, cb, 'lg', labelled);
      break;
    case 'step':
    case 'knob-sm':
      c = createKnob(def, v, cb, 'sm', labelled);
      break;
    default:
      c = createKnob(def, v, cb, 'md', labelled);
  }
  ctx.setters[`${inst.id}.${def.id}`] = c.set;
  return c.el;
}

function buttons(inst: Instance, ctx: PanelContext): HTMLElement | null {
  const def = MODULES[inst.type];
  if (!def.buttons?.length) return null;
  const row = h('div', 'buttons');
  for (const b of def.buttons) {
    const btn = h('button', 'push') as HTMLButtonElement;
    btn.type = 'button';
    btn.innerHTML = `<span class="lamp" data-lamp="${inst.id}.${b.id}"></span>${b.label}`;
    if (b.kind === 'momentary') {
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        btn.setPointerCapture(e.pointerId);
        btn.classList.add('down');
        ctx.onButton(inst.id, b.id, true);
      });
      const up = () => {
        btn.classList.remove('down');
        ctx.onButton(inst.id, b.id, false);
      };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
    } else {
      btn.addEventListener('click', () => ctx.onButton(inst.id, b.id, true));
    }
    row.appendChild(btn);
  }
  return row;
}

function ioBlock(inst: Instance): HTMLElement {
  const def = MODULES[inst.type];
  const io = h('div', 'io');
  if (def.inputs.length) {
    const col = h('div', 'io-col in', '<div class="io-title">Entradas</div>');
    def.inputs.forEach((jd) => col.appendChild(jack(inst.id, jd, 'in')));
    io.appendChild(col);
  }
  if (def.outputs.length) {
    const col = h('div', 'io-col out', '<div class="io-title">Salidas</div>');
    def.outputs.forEach((jd) => col.appendChild(jack(inst.id, jd, 'out')));
    io.appendChild(col);
  }
  return io;
}

function frame(inst: Instance, title?: string): HTMLElement {
  const def = MODULES[inst.type];
  const panel = h('section', `panel panel-${def.layout ?? 'std'}`);
  panel.style.gridArea = inst.area;
  panel.dataset.module = inst.id;
  panel.append(
    h('span', 'screw tl'),
    h('span', 'screw tr'),
    h('span', 'screw bl'),
    h('span', 'screw br'),
    h('h3', '', title ?? def.title),
  );
  return panel;
}

const maker = () => h('div', 'maker', 'OMNIFÓN');

function stdPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const def = MODULES[inst.type];
  const panel = frame(inst);
  panel.appendChild(ioBlock(inst));
  const controls = h('div', 'controls');
  def.params.forEach((q) => controls.appendChild(control(inst, q, ctx)));
  panel.appendChild(controls);
  const b = buttons(inst, ctx);
  if (b) panel.appendChild(b);
  panel.appendChild(maker());
  return panel;
}

function bankPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const def = MODULES[inst.type];
  const panel = frame(inst);
  const top = h('div', 'io bank-io');
  top.appendChild(jack(inst.id, def.inputs[0], 'in'));
  top.appendChild(h('div', 'io-title', 'Salidas'));
  panel.appendChild(top);
  const bank = h('div', 'bank');
  const bands = def.params.filter((q) => q.id.startsWith('g'));
  bands.forEach((q, i) => {
    const row = h('div', 'bank-row');
    row.appendChild(h('span', 'bank-label', q.label));
    row.appendChild(control(inst, q, ctx));
    row.appendChild(jack(inst.id, def.outputs[i + 1], 'out', false));
    bank.appendChild(row);
  });
  const sumRow = h('div', 'bank-row bank-sum');
  sumRow.appendChild(h('span', 'bank-label', 'Suma'));
  sumRow.appendChild(control(inst, def.params.find((q) => q.id === 'suma')!, ctx));
  sumRow.appendChild(jack(inst.id, def.outputs[0], 'out', false));
  bank.appendChild(sumRow);
  panel.appendChild(bank);
  panel.appendChild(maker());
  return panel;
}

function seqPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const def = MODULES[inst.type];
  const panel = frame(inst, 'S E C U E N C I A D O R');
  const body = h('div', 'seq-body');

  const left = h('div', 'seq-left');
  left.appendChild(h('div', 'io-title', 'Entradas'));
  def.inputs.forEach((jd) => left.appendChild(jack(inst.id, jd, 'in')));
  left.appendChild(control(inst, def.params.find((q) => q.id === 'pasos')!, ctx));
  left.appendChild(control(inst, def.params.find((q) => q.id === 'cuantizar')!, ctx));
  body.appendChild(left);

  const grid = h('div', 'seq-grid');
  for (let c = 0; c < 10; c++) {
    grid.appendChild(h('div', 'seq-head', `<span class="led" data-step="${c}"></span><span>${c + 1}</span>`));
  }
  grid.appendChild(h('div', 'io-title seq-out-title', 'Salidas'));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 10; c++) {
      grid.appendChild(control(inst, def.params[r * 10 + c], ctx, false));
    }
    grid.appendChild(jack(inst.id, def.outputs[r], 'out'));
  }
  for (let c = 0; c < 10; c++) grid.appendChild(h('div'));
  grid.appendChild(jack(inst.id, def.outputs[3], 'out'));
  body.appendChild(grid);

  panel.appendChild(body);
  panel.appendChild(maker());
  return panel;
}

function keysPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const def = MODULES[inst.type];
  const panel = frame(inst);
  panel.appendChild(ioBlock(inst));
  const controls = h('div', 'controls');
  def.params.forEach((q) => controls.appendChild(control(inst, q, ctx)));
  panel.appendChild(controls);
  panel.appendChild(
    h('div', 'keys-hint', 'Teclas <kbd>A</kbd>–<kbd>Ñ</kbd><br><kbd>Z</kbd>/<kbd>X</kbd> octava: <b id="octave-label">C3</b>'),
  );
  panel.appendChild(h('div', 'midi', '<span id="midi-status">MIDI: —</span>'));
  return panel;
}

function outPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const def = MODULES[inst.type];
  const panel = frame(inst);
  const row = h('div', 'out-row');
  const io = h('div', 'io-col in', '<div class="io-title">Entradas</div>');
  def.inputs.forEach((jd) => io.appendChild(jack(inst.id, jd, 'in')));
  row.appendChild(io);
  row.appendChild(control(inst, def.params[0], ctx));
  panel.appendChild(row);
  const scope = h(
    'div',
    'scope-wrap',
    `<canvas id="scope" aria-label="Osciloscopio"></canvas>
     <div class="switch-group scope-span">
       <button type="button" data-span="256">Rápida</button>
       <button type="button" data-span="1024" class="on">Media</button>
       <button type="button" data-span="2560">Lenta</button>
     </div>`,
  );
  panel.appendChild(scope);
  return panel;
}

export function renderPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  switch (MODULES[inst.type].layout) {
    case 'bank':
      return bankPanel(inst, ctx);
    case 'seq':
      return seqPanel(inst, ctx);
    case 'keys':
      return keysPanel(inst, ctx);
    case 'out':
      return outPanel(inst, ctx);
    default:
      return stdPanel(inst, ctx);
  }
}
