import './style.css';
import { defaults, RACK } from './engine/modules';
import { renderInfoModal, tr, UI_STRINGS, type Lang } from './i18n';
import { PATCHES, toCables, type Patch } from './patches';
import { Rack, type Cable } from './rack';
import { CableLayer } from './ui/cables';
import { setControlsLang } from './ui/controls';
import { createKeyboard } from './ui/keyboard';
import { renderPanel, type PanelContext } from './ui/panels';
import { createScope } from './ui/scope';

const STORAGE = 'omnifon:modular:v4';
const LANG_KEY = 'omnifon:lang';
type Values = Record<string, Record<string, number>>;

// ── Idioma (Español por defecto)
let lang: Lang = localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'es';
setControlsLang(lang);

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

let current = saved?.patch ?? PATCHES[0].id;
const basePatch = PATCHES.find((p) => p.id === current) ?? PATCHES[0];
const values: Values = patchValues(basePatch);
if (saved) for (const id in saved.values) if (values[id]) Object.assign(values[id], saved.values[id]);
const initialCables: Cable[] = saved?.cables ?? toCables(basePatch);

const rack = new Rack();
let cables: CableLayer | null = null;
const persist = () =>
  localStorage.setItem(STORAGE, JSON.stringify({ values, cables: cables?.cables ?? [], patch: current }));

// ── Paneles
const ctx: PanelContext = {
  values,
  setters: {},
  langHooks: [],
  onParam: (mod, id, v) => {
    values[mod][id] = v;
    rack.set(mod, id, v);
    persist();
  },
  onTrigger: (mod, action, down) => {
    if (!rack.running) void powerOn();
    if (mod === 'integrador' && action === 'manual') rack.send(mod, { type: down ? 'press' : 'release' });
    if (mod === 'pulsador' && down) rack.send(mod, { type: action });
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
const powerLabel = document.getElementById('power-label')!;
function syncPowerLabel(): void {
  const ui = UI_STRINGS[lang];
  powerLabel.textContent = rack.running ? ui.powerOff : ui.powerOn;
}
async function powerOn(): Promise<void> {
  if (rack.running) return;
  try {
    await rack.start(values, layer.cables);
    document.body.classList.add('powered');
    power.setAttribute('aria-pressed', 'true');
    syncPowerLabel();
    initMidi();
  } catch (err) {
    console.error(err);
    alert(UI_STRINGS[lang].audioError + (err as Error).message);
  }
}
power.addEventListener('click', async () => {
  if (rack.running) {
    rack.send('teclado', { type: 'allOff' });
    await rack.ctx?.suspend();
    document.body.classList.remove('powered');
    power.setAttribute('aria-pressed', 'false');
    syncPowerLabel();
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

// ── Parches (8 parches musicales y experimentales + botón Sin cables)
const patchBar = document.getElementById('patches')!;
const patchDesc = document.getElementById('patch-desc')!;
const clearCablesBtn = document.getElementById('clear-cables')!;

function syncPatchDesc(): void {
  const active = PATCHES.find((p) => p.id === current);
  patchDesc.textContent = active ? active.description[lang] : UI_STRINGS[lang].unpatchedDesc;
  clearCablesBtn.classList.toggle('on', current === 'unpatched');
}

function markPatch(): void {
  patchBar
    .querySelectorAll<HTMLElement>('button')
    .forEach((b) => b.classList.toggle('on', b.dataset.patch === current));
  syncPatchDesc();
}

function loadPatch(p: Patch): void {
  current = p.id;
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

clearCablesBtn.addEventListener('click', () => {
  current = 'unpatched';
  layer.cables.forEach((c) => rack.disconnect(c));
  layer.set([]);
  markPatch();
  persist();
});

for (const p of PATCHES) {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.patch = p.id;
  b.textContent = p.name[lang];
  b.title = p.description[lang];
  b.addEventListener('click', () => loadPatch(p));
  patchBar.appendChild(b);
}
markPatch();

// ── Atenuar cables
const toggleCablesBtn = document.getElementById('toggle-cables')!;
toggleCablesBtn.addEventListener('click', () => {
  const faded = instrument.classList.toggle('cables-faded');
  toggleCablesBtn.classList.toggle('on', faded);
});

// ── Ventana de Información histórica
const infoModal = document.getElementById('info-modal') as HTMLDialogElement;
const figImgUrl = `${import.meta.env.BASE_URL}fig-iv-38.jpg`;
function rebuildModal(): void {
  infoModal.innerHTML = renderInfoModal(lang, figImgUrl);
  infoModal.querySelector('[data-close-modal]')?.addEventListener('click', () => infoModal.close());
  infoModal.querySelector('[data-load-fig]')?.addEventListener('click', () => {
    loadPatch(PATCHES[0]);
    infoModal.close();
  });
}
document.getElementById('open-info')!.addEventListener('click', () => {
  rebuildModal();
  infoModal.showModal();
});
infoModal.addEventListener('click', (e) => {
  if (e.target === infoModal) infoModal.close();
});

// ── Cambio de idioma (ES / EN)
function applyLanguage(next: Lang): void {
  lang = next;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  setControlsLang(lang);

  const ui = UI_STRINGS[lang];
  document.getElementById('brand-subtitle')!.textContent = ui.subtitle;
  document.getElementById('credit-by')!.textContent = ui.byLabel;
  document.getElementById('presets-label')!.textContent = ui.presets;
  document.getElementById('info-label')!.textContent = ui.info;
  toggleCablesBtn.textContent = ui.dimCables;
  clearCablesBtn.textContent = ui.clearCables;
  document.getElementById('footer-credits')!.innerHTML = ui.footerHtml;
  syncPowerLabel();
  syncPatchDesc();

  const keysHint = document.getElementById('keys-hint-text');
  if (keysHint) {
    keysHint.innerHTML =
      lang === 'en' ? 'Keys <kbd>A</kbd>–<kbd>;</kbd>' : 'Teclas <kbd>A</kbd>–<kbd>Ñ</kbd>';
  }

  // Etiquetas de paneles, controles y conmutadores
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = tr(el.dataset.i18n!, lang);
  });

  // Tooltips de conectores
  document.querySelectorAll<HTMLElement>('.jack[data-jack-label]').forEach((j) => {
    const dir = j.dataset.dir === 'in' ? 'entrada' : 'salida';
    j.title = `${tr(j.dataset.jackLabel!, lang)} (${tr(dir, lang)})`;
  });

  // Tooltips y valores formateados de perillas/deslizadores
  ctx.langHooks.forEach((fn) => fn());

  // Nombres y descripciones de los presets
  patchBar.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
    const p = PATCHES.find((x) => x.id === b.dataset.patch);
    if (p) {
      b.textContent = p.name[lang];
      b.title = p.description[lang];
    }
  });

  // Botones ES / EN
  document
    .querySelectorAll<HTMLButtonElement>('#lang-switch button')
    .forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));

  if (infoModal.open) rebuildModal();

  // Reajustar posiciones de cables por si cambió el ancho de alguna etiqueta
  requestAnimationFrame(() => layer.render());
}

document.querySelectorAll<HTMLButtonElement>('#lang-switch button').forEach((b) => {
  b.addEventListener('click', () => applyLanguage(b.dataset.lang as Lang));
});
applyLanguage(lang);

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
