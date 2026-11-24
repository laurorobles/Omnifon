import './style.css';
import { defaults, RACK } from './engine/modules';
import { PATCHES, toCables, type Patch } from './patches';
import { Rack, type Cable } from './rack';
import { CableLayer } from './ui/cables';
import { createKeyboard } from './ui/keyboard';
import { renderPanel, type PanelContext } from './ui/panels';
import { createScope } from './ui/scope';

const STORAGE = 'omnifon:modular:v1';
type Values = Record<string, Record<string, number>>;

// ── Estado
function patchValues(p: Patch): Values {
  const v: Values = {};
  for (const inst of RACK) v[inst.id] = { ...defaults(inst.type), ...(p.values[inst.id] ?? {}) };
  return v;
}

const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) ?? 'null');
  } catch {
    return null;
  }
})() as { values: Values; cables: Cable[]; patch: string } | null;

let current = saved?.patch ?? PATCHES[0].name;
const values: Values = patchValues(PATCHES[0]);
if (saved) for (const id in saved.values) if (values[id]) Object.assign(values[id], saved.values[id]);
const initialCables: Cable[] = saved?.cables ?? toCables(PATCHES[0]);

const rack = new Rack();
let cables: CableLayer | null = null;
const persist = () =>
  localStorage.setItem(STORAGE, JSON.stringify({ values, cables: cables?.cables ?? [], patch: current }));

// ── Paneles
const ctx: PanelContext = {
  values,
  setters: {},
  onParam: (mod, id, v) => {
    values[mod][id] = v;
    rack.set(mod, id, v);
    persist();
  },
  onButton: (mod, id, down) => {
    if (!rack.running) void powerOn();
    if (mod === 'integrador' && id === 'manual') rack.send(mod, { type: down ? 'press' : 'release' });
    if (mod === 'pulsador' && id === 'marcha') rack.send(mod, { type: 'toggle' });
  },
};

const cabinet = document.getElementById('cabinet')!;
const keybed = document.getElementById('keybed')!;
for (const inst of RACK) {
  const panel = renderPanel(inst, ctx);
  if (inst.id === 'teclado') keybed.prepend(panel);
  else if (inst.id === 'salida') keybed.append(panel);
  else cabinet.appendChild(panel);
}

const instrument = document.getElementById('instrument')!;
const layer = new CableLayer(instrument, {
  onConnect: (c) => {
    rack.connect(c);
    persist();
  },
  onDisconnect: (c) => {
    rack.disconnect(c);
    persist();
  },
});
cables = layer;
layer.set(initialCables);
document.fonts?.ready.then(() => layer.render());

// ── Encendido
const power = document.getElementById('power') as HTMLButtonElement;
async function powerOn(): Promise<void> {
  if (rack.running) return;
  try {
    await rack.start(values, layer.cables);
    document.body.classList.add('powered');
    power.setAttribute('aria-pressed', 'true');
    initMidi();
  } catch (err) {
    console.error(err);
    alert('No se pudo iniciar el audio: ' + (err as Error).message);
  }
}
power.addEventListener('click', async () => {
  if (rack.running) {
    rack.send('teclado', { type: 'allOff' });
    await rack.ctx?.suspend();
    document.body.classList.remove('powered');
    power.setAttribute('aria-pressed', 'false');
  } else await powerOn();
});

// ── Indicadores
const leds = [...document.querySelectorAll<HTMLElement>('.led[data-step]')];
rack.on('secuenciador', (m) => {
  if (m.type === 'step') leds.forEach((l, i) => l.classList.toggle('on', i === m.value));
});
rack.on('pulsador', (m) => {
  if (m.type === 'running')
    document.querySelector('[data-lamp="pulsador.marcha"]')?.classList.toggle('on', Boolean(m.value));
});

// ── Parches
const patchBar = document.getElementById('patches')!;
function markPatch(): void {
  patchBar.querySelectorAll<HTMLElement>('button').forEach((b) => b.classList.toggle('on', b.dataset.patch === current));
}
function loadPatch(p: Patch): void {
  current = p.name;
  const v = patchValues(p);
  for (const mod in v)
    for (const id in v[mod]) {
      values[mod][id] = v[mod][id];
      ctx.setters[`${mod}.${id}`]?.(v[mod][id]);
      rack.set(mod, id, v[mod][id]);
    }
  layer.cables.forEach((c) => rack.disconnect(c));
  const next = toCables(p);
  next.forEach((c) => rack.connect(c));
  layer.set(next);
  markPatch();
  persist();
}
for (const p of PATCHES) {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.patch = p.name;
  b.textContent = p.name;
  b.title = p.description;
  b.addEventListener('click', () => loadPatch(p));
  patchBar.appendChild(b);
}
markPatch();

document.getElementById('toggle-cables')!.addEventListener('click', (e) => {
  const faded = instrument.classList.toggle('cables-faded');
  (e.currentTarget as HTMLElement).classList.toggle('on', faded);
});

// ── Teclado de 5 octavas
const kb = createKeyboard(document.getElementById('keyboard')!, {
  noteOn: (n) => {
    if (!rack.running) void powerOn().then(() => rack.send('teclado', { type: 'noteOn', note: n }));
    else rack.send('teclado', { type: 'noteOn', note: n });
  },
  noteOff: (n) => rack.send('teclado', { type: 'noteOff', note: n }),
});

// ── Osciloscopio
const scope = createScope(document.getElementById('scope') as HTMLCanvasElement, () => rack.analyser);
document.querySelectorAll<HTMLButtonElement>('[data-span]').forEach((b, _i, all) =>
  b.addEventListener('click', () => {
    scope.setSpan(Number(b.dataset.span));
    all.forEach((x) => x.classList.toggle('on', x === b));
  }),
);

// ── Web MIDI (opcional)
let midiReady = false;
function initMidi(): void {
  if (midiReady || !('requestMIDIAccess' in navigator)) return;
  midiReady = true;
  navigator
    .requestMIDIAccess()
    .then((access) => {
      const status = document.getElementById('midi-status')!;
      const bind = () => {
        let count = 0;
        access.inputs.forEach((input) => {
          count++;
          input.onmidimessage = (e) => {
            const [st, d1, d2] = e.data ?? [];
            const cmd = st & 0xf0;
            if (cmd === 0x90 && d2 > 0) kb.press(d1);
            else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) kb.release(d1);
          };
        });
        status.textContent = count ? `MIDI: ${count}` : 'MIDI: —';
      };
      access.onstatechange = bind;
      bind();
    })
    .catch(() => {});
}
