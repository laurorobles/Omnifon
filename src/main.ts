import './style.css';
import { OmnifonEngine, type Mode } from './engine';
import { PARAMS, PARAM_MAP } from './engine/params';
import { createKnob, createSwitch } from './ui/controls';
import { createKeyboard } from './ui/keyboard';
import { createScope } from './ui/scope';

const STORAGE = 'omnifon:v1';

// ── Estado persistente
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) ?? '{}');
  } catch {
    return {};
  }
})() as { values?: Record<string, number>; mode?: Mode };

const values: Record<string, number> = Object.fromEntries(PARAMS.map((p) => [p.id, p.def]));
Object.assign(values, saved.values ?? {});
let mode: Mode = saved.mode ?? 'prototipo';

const persist = () => localStorage.setItem(STORAGE, JSON.stringify({ values, mode }));

const engine = new OmnifonEngine(values, mode);
const setters: Record<string, (v: number) => void> = {};

const onChange = (id: string) => (v: number) => {
  values[id] = v;
  engine.set(id, v);
  persist();
};

// ── Construcción de los paneles
function control(id: string, size: 'lg' | 'md' = 'md'): HTMLElement {
  const def = PARAM_MAP[id];
  const c =
    def.fmt === 'choice'
      ? createSwitch(def, values[id], onChange(id))
      : createKnob(def, values[id], onChange(id), size);
  setters[id] = c.set;
  return c.el;
}

function mount(selector: string, ids: (string | [string, 'lg'])[]): void {
  const host = document.querySelector(`${selector} .controls`)!;
  for (const item of ids) {
    const [id, size] = Array.isArray(item) ? item : [item, 'md' as const];
    host.appendChild(control(id, size));
  }
}

mount('#mod-osc', [['vcoFreq', 'lg'], 'vcoTrack', 'glide', 'tolerance']);
mount('#mod-mix', ['lvlSine', 'lvlSquare', 'lvlRamp', 'lvlNoise']);
mount('#mod-vcf', [['cutoff', 'lg'], 'resonance', 'filterEnv', 'filterTrack', 'filterMode', 'filterSlope']);
mount('#mod-eg', ['attack', 'decay', 'sustain', 'release', 'egMode', 'egCv']);
mount('#mod-vca', ['vcaBias', ['volume', 'lg']]);
mount('#mod-vco2', [['vco2Freq', 'lg'], 'vco2Wave', 'vco2ToPitch', 'vco2ToCutoff', 'vco2ToAmp']);

// ── Modo dual: Prototipo (1960–64) / Estudio (1981)
const modeButtons = document.querySelectorAll<HTMLButtonElement>('[data-mode]');
const applyMode = (m: Mode) => {
  mode = m;
  document.body.dataset.mode = m;
  modeButtons.forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  engine.setMode(m);
  persist();
};
modeButtons.forEach((b) => b.addEventListener('click', () => applyMode(b.dataset.mode as Mode)));
applyMode(mode);

// ── Encendido (los navegadores exigen un gesto del usuario para iniciar audio)
const power = document.getElementById('power') as HTMLButtonElement;
const powerOn = async () => {
  if (engine.running) return;
  try {
    await engine.start();
    document.body.classList.add('powered');
    power.setAttribute('aria-pressed', 'true');
    initMidi();
  } catch (err) {
    console.error(err);
    alert('No se pudo iniciar el audio: ' + (err as Error).message);
  }
};
power.addEventListener('click', async () => {
  if (engine.running) {
    engine.allOff();
    await engine.ctx?.suspend();
    document.body.classList.remove('powered');
    power.setAttribute('aria-pressed', 'false');
  } else {
    await powerOn();
  }
});

// ── Teclado de 5 octavas
const kb = createKeyboard(document.getElementById('keyboard')!, {
  noteOn: (n) => {
    if (!engine.running) void powerOn().then(() => engine.noteOn(n));
    else engine.noteOn(n);
  },
  noteOff: (n) => engine.noteOff(n),
});

document.getElementById('panic')!.addEventListener('click', () => engine.allOff());
document.getElementById('reset')!.addEventListener('click', () => {
  for (const p of PARAMS) {
    values[p.id] = p.def;
    setters[p.id]?.(p.def);
    engine.set(p.id, p.def);
  }
  persist();
});

// ── Osciloscopio
const scope = createScope(document.getElementById('scope') as HTMLCanvasElement, () => engine.analyser);
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
        status.textContent = count ? `MIDI: ${count} entrada${count > 1 ? 's' : ''}` : 'MIDI: sin dispositivos';
      };
      access.onstatechange = bind;
      bind();
    })
    .catch(() => {
      /* MIDI no disponible o denegado */
    });
}
