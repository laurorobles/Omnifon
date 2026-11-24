import { MODULES, type Instance, type JackDef } from '../engine/modules';
import {
  createFader,
  createKnob,
  createSlideSwitch,
  createStepSwitch,
  createVerticalFader,
  type Control,
} from './controls';

export interface PanelContext {
  values: Record<string, Record<string, number>>;
  onParam: (mod: string, id: string, v: number) => void;
  onTrigger: (mod: string, action: string, down: boolean) => void;
  setters: Record<string, (v: number) => void>;
  langHooks: (() => void)[];
}

const h = (tag: string, cls = '', html = ''): HTMLElement => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};

const tEl = (tag: string, cls: string, text: string): HTMLElement => {
  const e = h(tag, cls, text);
  e.dataset.i18n = text;
  return e;
};

function jackSocket(mod: string, jd: JackDef, dir: 'in' | 'out'): HTMLElement {
  const j = h('div', 'jack');
  j.dataset.jack = `${mod}.${jd.id}`;
  j.dataset.dir = dir;
  j.dataset.jackLabel = jd.label;
  j.title = `${jd.label} (${dir === 'in' ? 'entrada' : 'salida'})`;
  return j;
}

function getJack(inst: Instance, dir: 'in' | 'out', id: string): HTMLElement {
  const def = MODULES[inst.type];
  const list = dir === 'in' ? def.inputs : def.outputs;
  const jd = list.find((x) => x.id === id)!;
  return jackSocket(inst.id, jd, dir);
}

function getParam(
  inst: Instance,
  id: string,
  ctx: PanelContext,
  opts: {
    showLabel?: boolean;
    labelBelow?: boolean;
    sizeOverride?: 'lg' | 'md' | 'sm';
    noTicks?: boolean;
  } = {},
): HTMLElement {
  const def = MODULES[inst.type].params.find((q) => q.id === id)!;
  const v = ctx.values[inst.id]?.[def.id] ?? def.def;
  const cb = (x: number) => ctx.onParam(inst.id, def.id, x);
  let c: Control;
  switch (def.control) {
    case 'fader':
      c = createFader(def, v, cb);
      break;
    case 'fader-v':
      c = createVerticalFader(def, v, cb);
      break;
    case 'slide-sw':
      c = createSlideSwitch(def, v, cb);
      break;
    case 'step-sw':
      c = createStepSwitch(def, v, cb);
      break;
    case 'knob-white':
      c = createKnob(def, v, cb, {
        size: opts.sizeOverride ?? 'lg',
        white: true,
        showLabel: opts.showLabel ?? true,
        labelBelow: opts.labelBelow ?? false,
      });
      break;
    case 'knob-white-sm':
      c = createKnob(def, v, cb, {
        size: opts.sizeOverride ?? 'md',
        white: true,
        showLabel: opts.showLabel ?? true,
        labelBelow: opts.labelBelow ?? false,
      });
      break;
    case 'knob-sm':
      c = createKnob(def, v, cb, {
        size: 'sm',
        white: false,
        showLabel: opts.showLabel ?? false,
        labelBelow: opts.labelBelow ?? false,
        noTicks: opts.noTicks ?? true,
      });
      break;
    default:
      c = createKnob(def, v, cb, {
        size: opts.sizeOverride ?? 'md',
        white: false,
        showLabel: opts.showLabel ?? true,
        labelBelow: opts.labelBelow ?? false,
      });
  }
  ctx.setters[`${inst.id}.${def.id}`] = c.set;
  if (c.refreshLang) ctx.langHooks.push(c.refreshLang);
  return c.el;
}

function vJackBus(jacks: HTMLElement[]): HTMLElement {
  const wrap = h('div', 'v-bus');
  jacks.forEach((j, idx) => {
    if (idx > 0) wrap.appendChild(h('span', 'v-line'));
    wrap.appendChild(j);
  });
  return wrap;
}

function linkedRow(jackEl: HTMLElement, ctrlEl: HTMLElement, cls = ''): HTMLElement {
  const row = h('div', `linked-row ${cls}`.trim());
  row.append(jackEl, h('span', 'h-line'), ctrlEl);
  return row;
}

function metalPinButton(mod: string, action: string, title: string, ctx: PanelContext, lampKey?: string): HTMLElement {
  const btn = h('button', 'metal-btn') as HTMLButtonElement;
  btn.type = 'button';
  btn.title = title;
  if (lampKey) btn.dataset.lamp = lampKey;
  btn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    btn.setPointerCapture(e.pointerId);
    btn.classList.add('down');
    ctx.onTrigger(mod, action, true);
  });
  const up = () => {
    if (!btn.classList.contains('down')) return;
    btn.classList.remove('down');
    ctx.onTrigger(mod, action, false);
  };
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  return btn;
}

function frame(inst: Instance, cls = ''): HTMLElement {
  const def = MODULES[inst.type];
  const panel = h('section', `panel mod-${inst.type} ${cls}`.trim());
  panel.style.gridArea = inst.area;
  panel.dataset.module = inst.id;
  const heading = tEl('h3', '', def.title);
  panel.append(
    h('span', 'screw tl'),
    h('span', 'screw tr'),
    h('span', 'screw bl'),
    h('span', 'screw br'),
    heading,
  );
  return panel;
}

const maker = () => h('div', 'maker', 'OMNIFÓN');

function topHeaders(leftText?: string, rightText?: string): HTMLElement {
  const bar = h('div', 'subheaders');
  bar.appendChild(leftText ? tEl('span', 'io-title', leftText) : h('span'));
  bar.appendChild(rightText ? tEl('span', 'io-title', rightText) : h('span'));
  return bar;
}

// ── 1. ENVOLVEDOR
function envolvedorPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const p = frame(inst);
  p.appendChild(topHeaders('Entradas', 'Salidas'));
  const body = h('div', 'mod-body env-body');
  const left = h('div', 'env-left');
  left.appendChild(linkedRow(getJack(inst, 'in', 'entrada'), getParam(inst, 'nivel', ctx, { showLabel: false }), 'r1'));
  left.appendChild(linkedRow(getJack(inst, 'in', 'control'), getParam(inst, 'mod', ctx, { showLabel: false }), 'r2'));
  const right = h('div', 'env-right');
  right.appendChild(vJackBus([getJack(inst, 'out', 's1'), getJack(inst, 'out', 's2')]));
  body.append(left, right);
  p.append(body, maker());
  return p;
}

// ── 2. ALEATOR
function aleatorPanel(inst: Instance): HTMLElement {
  const p = frame(inst);
  p.appendChild(topHeaders('Entrada', 'Salidas'));
  const body = h('div', 'mod-body ale-body');
  const left = h('div', 'ale-in');
  left.appendChild(getJack(inst, 'in', 'pulso'));
  const right = h('div', 'ale-out');
  right.appendChild(vJackBus([getJack(inst, 'out', 'esc'), getJack(inst, 'out', 'suave')]));
  body.append(left, right);
  p.append(body, maker());
  return p;
}

// ── 3. MOD. ANULAR
function anilloPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const p = frame(inst);
  p.appendChild(topHeaders('Entradas', 'Salidas'));
  const body = h('div', 'mod-body ani-body');
  const left = h('div', 'ani-left');
  left.appendChild(getJack(inst, 'in', 'a'));
  left.appendChild(linkedRow(getJack(inst, 'in', 'b'), getParam(inst, 'nivel', ctx, { showLabel: false }), 'long'));
  left.appendChild(getJack(inst, 'in', 'mod'));
  const right = h('div', 'ani-right');
  right.appendChild(vJackBus([getJack(inst, 'out', 'sal'), getJack(inst, 'out', 'sal2')]));
  body.append(left, right);
  p.append(body, maker());
  return p;
}

// ── 4. RUIDOR
function ruidorPanel(inst: Instance): HTMLElement {
  const p = frame(inst);
  p.appendChild(topHeaders(undefined, 'Salidas'));
  const body = h('div', 'mod-body rui-body');
  const r1 = h('div', 'rui-row');
  r1.append(tEl('span', 'mini-lbl', 'blanco'), vJackBus([getJack(inst, 'out', 'blanco'), h('span', 'pin-dot')]));
  const r2 = h('div', 'rui-row');
  r2.append(tEl('span', 'mini-lbl', 'rosa'), vJackBus([getJack(inst, 'out', 'rosa'), h('span', 'pin-dot')]));
  body.append(r1, r2);
  p.append(body, maker());
  return p;
}

// ── 5. REVERBERAL
function reverberalPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const p = frame(inst);
  p.appendChild(topHeaders('Entradas', 'Salidas'));
  const body = h('div', 'mod-body rev-body');
  const left = h('div', 'rev-left');
  left.appendChild(linkedRow(getJack(inst, 'in', 'e1'), getParam(inst, 'intensidad', ctx), 'long'));
  const row2 = h('div', 'rev-row2');
  row2.append(getJack(inst, 'in', 'e2'), getParam(inst, 'tiempo', ctx));
  left.appendChild(row2);
  const right = h('div', 'rev-right');
  right.appendChild(vJackBus([getJack(inst, 'out', 'sal'), getJack(inst, 'out', 'sal2')]));
  body.append(left, right);
  p.append(body, maker());
  return p;
}

// ── 6. INTEGRADOR ENVOLV.
function integradorPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const p = frame(inst);
  p.appendChild(topHeaders('Entradas', 'Salidas'));
  const body = h('div', 'mod-body int-body');

  const left = h('div', 'int-left');
  left.appendChild(getParam(inst, 'ataque', ctx));

  const pulseWrap = h('div', 'int-pulse-row');
  const pCol = h('div', 'int-pcol');
  pCol.append(tEl('span', 'mini-lbl', 'pulso'), getJack(inst, 'in', 'pulso'));
  pulseWrap.append(
    pCol,
    h('span', 'h-line flex'),
    getParam(inst, 'modo', ctx),
    metalPinButton(inst.id, 'manual', 'Disparo manual de pulso', ctx),
  );
  left.appendChild(pulseWrap);

  left.appendChild(getParam(inst, 'duracion', ctx));
  left.appendChild(getParam(inst, 'decaimiento', ctx));

  const right = h('div', 'int-right');
  const envGroup = h('div', 'int-out-group');
  envGroup.append(tEl('span', 'mini-lbl', 'env.'), vJackBus([getJack(inst, 'out', 'sal'), getJack(inst, 'out', 'sal2')]));
  const plsGroup = h('div', 'int-out-group');
  plsGroup.append(tEl('span', 'mini-lbl', 'pulso'), getJack(inst, 'out', 'pulsoSal'));
  right.append(envGroup, plsGroup);

  body.append(left, right);
  p.append(body, maker());
  return p;
}

// ── 7 & 8. OSCILADOR
function osciladorPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const p = frame(inst);
  p.appendChild(topHeaders('Entradas', 'Salidas'));
  const body = h('div', 'mod-body osc-body');

  const mainGrid = h('div', 'osc-main');
  const leftCol = h('div', 'osc-left');
  const fTop = h('div', 'osc-frec-top');
  fTop.append(getJack(inst, 'in', 'frec'), h('span', 'diag-line'));
  leftCol.append(
    fTop,
    getParam(inst, 'frecuencia', ctx, { sizeOverride: 'lg' }),
    h('span', 'v-line short'),
    getParam(inst, 'fino', ctx),
  );

  const rightCol = h('div', 'osc-right');
  const waves = h('div', 'osc-waves');
  for (const [id, sym] of [
    ['sen', '∿'],
    ['tri', '∧'],
    ['rampa', '⩘'],
    ['cuad', '⊓'],
  ] as const) {
    const w = h('div', 'wave-out');
    w.append(h('span', 'wave-sym', sym), getJack(inst, 'out', id));
    waves.appendChild(w);
  }
  rightCol.append(waves, getParam(inst, 'ancho', ctx, { labelBelow: true }));
  mainGrid.append(leftCol, rightCol);

  const bottom = h('div', 'osc-bottom');
  bottom.append(
    getJack(inst, 'in', 'mod'),
    h('span', 'h-line'),
    tEl('span', 'osc-mod-lbl', 'modular en frec.'),
    getParam(inst, 'modulador', ctx, { showLabel: false }),
    getParam(inst, 'modoMod', ctx),
  );

  body.append(mainGrid, bottom);
  p.append(body, maker());
  return p;
}

// ── 9. FILTRO-V
function filtrovPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const p = frame(inst);
  p.appendChild(topHeaders('Entradas', 'Salidas'));
  const body = h('div', 'mod-body fiv-body');

  const left = h('div', 'fiv-left');
  left.appendChild(getJack(inst, 'in', 'entrada'));
  left.appendChild(linkedRow(getJack(inst, 'in', 'anchoCv'), getParam(inst, 'ancho', ctx), 'long'));

  const corteRow = h('div', 'fiv-fader-row');
  corteRow.append(tEl('span', 'mini-lbl', 'Corte'), getParam(inst, 'corte', ctx));
  left.appendChild(corteRow);

  left.appendChild(linkedRow(getJack(inst, 'in', 'control'), getParam(inst, 'centro', ctx, { sizeOverride: 'md' }), 'long'));

  const modBlock = h('div', 'fiv-mod-block');
  modBlock.appendChild(tEl('div', 'mini-lbl center', 'modulación'));
  modBlock.appendChild(linkedRow(getJack(inst, 'in', 'mod'), getParam(inst, 'modulacion', ctx)));
  modBlock.appendChild(
    h('div', 'fader-minmax', '<span>0</span><span data-i18n="máx.">máx.</span>'),
  );
  left.appendChild(modBlock);

  const right = h('div', 'fiv-right');
  for (const [id, lbl] of [
    ['bajos', 'baj.'],
    ['altos', 'alt.'],
    ['banda', 'banda'],
  ] as const) {
    const g = h('div', 'fiv-out');
    g.append(tEl('span', 'mini-lbl', lbl), getJack(inst, 'out', id));
    right.appendChild(g);
  }

  body.append(left, right);
  p.append(body, maker());
  return p;
}

// ── 10. FILTRO-O
function filtrooPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const def = MODULES[inst.type];
  const p = frame(inst);
  p.appendChild(topHeaders('Entradas', 'Salidas'));

  const body = h('div', 'mod-body fio-body');
  const leftCol = h('div', 'fio-left');
  leftCol.append(
    getJack(inst, 'in', 'entrada'),
    tEl('span', 'mini-lbl', 'Corte'),
    getParam(inst, 'corte', ctx),
  );

  const bank = h('div', 'bank');
  const bands = def.params.filter((q) => q.id.startsWith('g'));
  bands.forEach((q, i) => {
    const row = h('div', 'bank-row');
    row.append(getParam(inst, q.id, ctx), h('span', 'bank-label', q.label), getJack(inst, 'out', `b${i}`));
    bank.appendChild(row);
  });
  const sumRow = h('div', 'bank-row bank-sum');
  sumRow.append(tEl('span', 'bank-label', 'Suma'), getParam(inst, 'suma', ctx), getJack(inst, 'out', 'suma'));
  bank.appendChild(sumRow);

  body.append(leftCol, bank);
  p.append(body, maker());
  return p;
}

// ── 11. PULSADOR
function pulsadorPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const p = frame(inst);
  p.appendChild(topHeaders('Entradas', 'Salidas'));
  const body = h('div', 'mod-body pul-body');

  const left = h('div', 'pul-left');
  const r1 = h('div', 'pul-trig-block');
  r1.append(
    tEl('span', 'mini-lbl', 'inicio'),
    linkedRow(
      getJack(inst, 'in', 'inicio'),
      metalPinButton(inst.id, 'start', 'Iniciar reloj', ctx, 'pulsador.marcha'),
      'long',
    ),
  );
  const r2 = h('div', 'pul-trig-block');
  r2.append(
    tEl('span', 'mini-lbl', 'fin'),
    linkedRow(getJack(inst, 'in', 'fin'), metalPinButton(inst.id, 'stop', 'Detener reloj', ctx), 'long'),
  );
  left.append(
    r1,
    r2,
    linkedRow(getJack(inst, 'in', 'anchoCv'), getParam(inst, 'ancho', ctx), 'long'),
    linkedRow(getJack(inst, 'in', 'relojCv'), getParam(inst, 'reloj', ctx), 'long'),
  );

  const right = h('div', 'pul-right');
  right.append(
    tEl('span', 'mini-lbl', 'Pulsos'),
    vJackBus([getJack(inst, 'out', 'pulsos'), getJack(inst, 'out', 'pulsos2'), getJack(inst, 'out', 'inv')]),
  );

  body.append(left, right);
  p.append(body, maker());
  return p;
}

// ── 12. S E C U E N C I A D O R
function seqPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const p = frame(inst, 'panel-seq');
  const body = h('div', 'seq-body');

  const left = h('div', 'seq-left');
  const topIo = h('div', 'seq-top-io');
  const colIn = h('div', 'seq-io-pair');
  colIn.append(tEl('span', 'io-title', 'Entradas'), getJack(inst, 'in', 'pulso'), tEl('span', 'mini-lbl', 'pulsos'));
  const colOut = h('div', 'seq-io-pair');
  colOut.append(tEl('span', 'io-title', 'Salida'), getJack(inst, 'out', 'pulsoSal'), getJack(inst, 'in', 'reinicio'), tEl('span', 'mini-lbl', 'reinicio'));
  topIo.append(colIn, colOut);
  left.appendChild(topIo);

  const rowOuts = h('div', 'seq-row-jacks');
  rowOuts.append(getJack(inst, 'out', 'a'), getJack(inst, 'out', 'b'), getJack(inst, 'out', 'c'));
  left.appendChild(rowOuts);

  const botVolt = h('div', 'seq-bot-volt');
  botVolt.append(tEl('span', 'mini-lbl', 'voltaje'), getJack(inst, 'out', 'volt'));
  left.appendChild(botVolt);

  const grid = h('div', 'seq-grid');
  for (let c = 0; c < 10; c++) {
    const head = h('div', 'seq-head');
    const led = h('span', 'led');
    led.dataset.step = String(c);
    head.append(led, getJack(inst, 'out', `st${c}`), h('span', 'seq-num', String(c + 1)));
    grid.appendChild(head);
  }
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 10; c++) {
      grid.appendChild(getParam(inst, `s${r * 10 + c}`, ctx));
    }
  }
  for (let c = 0; c < 10; c++) {
    grid.appendChild(getParam(inst, `sw${c}`, ctx));
  }

  body.append(left, grid);
  p.append(body, maker());
  return p;
}

// ── Consola inferior: TECLADO y SALIDA
function keysPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const p = frame(inst, 'panel-keys');
  p.appendChild(topHeaders(undefined, 'Salidas'));
  const outs = h('div', 'keys-outs');
  for (const [id, lbl] of [
    ['volt', 'Voltaje'],
    ['pulso', 'Pulso'],
  ] as const) {
    const r = h('div', 'jack-wrap out');
    r.append(getJack(inst, 'out', id), tEl('span', '', lbl));
    outs.appendChild(r);
  }
  p.appendChild(outs);
  const c = h('div', 'controls');
  c.appendChild(getParam(inst, 'portamento', ctx));
  p.appendChild(c);
  p.appendChild(
    h(
      'div',
      'keys-hint',
      '<span id="keys-hint-text">Teclas <kbd>A</kbd>–<kbd>Ñ</kbd></span><br><kbd>Z</kbd>/<kbd>X</kbd>: <b id="octave-label">C3</b>',
    ),
  );
  p.appendChild(h('div', 'midi', '<span id="midi-status">MIDI: —</span>'));
  return p;
}

function outPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  const p = frame(inst, 'panel-out');
  const row = h('div', 'out-row');
  const io = h('div', 'io-col in');
  io.appendChild(tEl('div', 'io-title', 'Entradas'));
  for (const [id, lbl] of [
    ['izq', 'Izquierda'],
    ['der', 'Derecha'],
  ] as const) {
    const r = h('div', 'jack-wrap in');
    r.append(getJack(inst, 'in', id), tEl('span', '', lbl));
    io.appendChild(r);
  }
  row.append(io, getParam(inst, 'volumen', ctx));
  p.appendChild(row);
  p.appendChild(
    h(
      'div',
      'scope-wrap',
      `<canvas id="scope" aria-label="Osciloscopio"></canvas>
       <div class="switch-group scope-span">
         <button type="button" data-span="256" data-i18n="Rápida">Rápida</button>
         <button type="button" data-span="1024" data-i18n="Media" class="on">Media</button>
         <button type="button" data-span="2560" data-i18n="Lenta">Lenta</button>
       </div>`,
    ),
  );
  return p;
}

export function renderPanel(inst: Instance, ctx: PanelContext): HTMLElement {
  switch (inst.type) {
    case 'envolvedor':
      return envolvedorPanel(inst, ctx);
    case 'aleator':
      return aleatorPanel(inst);
    case 'anillo':
      return anilloPanel(inst, ctx);
    case 'ruidor':
      return ruidorPanel(inst);
    case 'reverberal':
      return reverberalPanel(inst, ctx);
    case 'integrador':
      return integradorPanel(inst, ctx);
    case 'oscilador':
      return osciladorPanel(inst, ctx);
    case 'filtrov':
      return filtrovPanel(inst, ctx);
    case 'filtroo':
      return filtrooPanel(inst, ctx);
    case 'pulsador':
      return pulsadorPanel(inst, ctx);
    case 'secuenciador':
      return seqPanel(inst, ctx);
    case 'teclado':
      return keysPanel(inst, ctx);
    case 'salida':
      return outPanel(inst, ctx);
    default:
      return frame(inst);
  }
}
