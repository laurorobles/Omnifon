/**
 * Catálogo fiel de módulos del Omnifón modular.
 * Reproduce con exactitud cada perilla, deslizador, conmutador y conector
 * del gabinete físico original de Raúl Pavón Sarrelangue.
 *
 * Convención de señales (todas a frecuencia de audio):
 *   audio      ±1
 *   voltaje    1.0 = 1 octava (equivalente a 1 V/oct)
 *   pulso      0 / 1 (umbral 0.5)
 */
export type Fmt = 'hz' | 's' | 'pct' | 'oct' | 'st' | 'int' | 'choice';
export type ControlKind =
  | 'knob'
  | 'knob-white'
  | 'knob-white-sm'
  | 'knob-sm'
  | 'fader'
  | 'fader-v'
  | 'slide-sw'
  | 'step-sw';

export interface ParamDef {
  id: string;
  label: string;
  min: number;
  max: number;
  def: number;
  fmt: Fmt;
  curve?: 'lin' | 'log';
  control?: ControlKind;
  choices?: string[];
  ticks?: [string, string];
}

export interface JackDef {
  id: string;
  label: string;
}

export interface ModuleDef {
  type: string;
  title: string;
  inputs: JackDef[];
  outputs: JackDef[];
  params: ParamDef[];
  stereo?: boolean;
}

const p = (
  id: string,
  label: string,
  min: number,
  max: number,
  def: number,
  fmt: Fmt,
  extra: Partial<ParamDef> = {},
): ParamDef => ({ id, label, min, max, def, fmt, ...extra });

const j = (id: string, label: string): JackDef => ({ id, label });

export const BANDS = [25, 50, 100, 200, 400, 800, 1600, 3200, 6500, 13000];
export const bandLabel = (f: number) => (f >= 1000 ? `${f / 1000}k` : String(f));

const SEQ_A = [0, 7, 10, 3, 12, 5, 15, 7, 2, 10];
const SEQ_B = [0.2, 0.72, 0.35, 0.85, 0.28, 0.65, 0.9, 0.4, 0.55, 0.3];
const SEQ_C = [0.75, 0.25, 0.55, 0.3, 0.85, 0.2, 0.5, 0.35, 0.6, 0.45];

export const MODULES: Record<string, ModuleDef> = {
  // ── 1. ENVOLVEDOR: 2 entradas unidas a 2 perillas mín–máx; 2 salidas en paralelo a la der
  envolvedor: {
    type: 'envolvedor',
    title: 'Envolvedor',
    inputs: [j('entrada', 'Entrada 1'), j('control', 'Entrada 2')],
    outputs: [j('s1', 'Salida 1'), j('s2', 'Salida 2')],
    params: [
      p('nivel', 'Entrada 1', 0, 1, 0, 'pct', { ticks: ['mín.', 'máx.'] }),
      p('mod', 'Entrada 2', 0, 1, 0.9, 'pct', { ticks: ['mín.', 'máx.'] }),
    ],
  },

  // ── 2. ALEATOR: sin perillas; 1 entrada izq, 2 salidas der
  aleator: {
    type: 'aleator',
    title: 'Aleator',
    inputs: [j('pulso', 'Entrada')],
    outputs: [j('esc', 'Salida 1'), j('suave', 'Salida 2')],
    params: [],
  },

  // ── 3. MOD. ANULAR: 3 entradas izq, 1 perilla central mín–máx, 2 salidas der
  anillo: {
    type: 'anillo',
    title: 'Mod. Anular',
    inputs: [j('a', 'Entrada 1'), j('b', 'Entrada 2'), j('mod', 'Entrada 3')],
    outputs: [j('sal', 'Salida 1'), j('sal2', 'Salida 2')],
    params: [p('nivel', 'Nivel', 0, 1, 0.8, 'pct', { ticks: ['mín.', 'máx.'] })],
  },

  // ── 4. RUIDOR: sin perillas; salidas blanco y rosa a la der
  ruidor: {
    type: 'ruidor',
    title: 'Ruidor',
    inputs: [],
    outputs: [j('blanco', 'blanco'), j('rosa', 'rosa')],
    params: [],
  },

  // ── 5. REVERBERAL: 2 entradas izq, 2 perillas verticales (Intensid., tiempo), 2 salidas der
  reverberal: {
    type: 'reverberal',
    title: 'Reverberal',
    inputs: [j('e1', 'Entrada 1'), j('e2', 'Entrada 2')],
    outputs: [j('sal', 'Salida 1'), j('sal2', 'Salida 2')],
    params: [
      p('intensidad', 'Intensid.', 0, 1, 0.42, 'pct', { ticks: ['0', 'máx.'] }),
      p('tiempo', 'tiempo', 0, 1, 0.68, 'pct', { ticks: ['0', 'máx.'] }),
    ],
  },

  // ── 6. INTEGRADOR ENVOLV.: ataque, switch ext/int + jack pulso, duración, decaimiento; salidas env (x2) y pulso
  integrador: {
    type: 'integrador',
    title: 'Integrador Envolv.',
    inputs: [j('pulso', 'pulso')],
    outputs: [j('sal', 'env. 1'), j('sal2', 'env. 2'), j('pulsoSal', 'pulso')],
    params: [
      p('ataque', 'ataque', 0.005, 5, 0.01, 's', { curve: 'log', ticks: ['5ms.', '5seg.'] }),
      p('modo', 'Disparo', 0, 1, 0, 'choice', { control: 'slide-sw', choices: ['ext.', 'int.'] }),
      p('duracion', 'duración', 0.005, 5, 0.09, 's', { curve: 'log', ticks: ['5ms.', '5seg.'] }),
      p('decaimiento', 'decaimiento', 0.005, 5, 0.22, 's', { curve: 'log', ticks: ['5ms.', '5seg.'] }),
    ],
  },

  // ── 7 & 8. OSCILADOR: jack frec + perilla blanca frecuencia + aj. fino; 4 ondas + ancho der; modular en frec. abajo
  oscilador: {
    type: 'oscilador',
    title: 'Oscilador',
    inputs: [j('frec', 'frecuencia'), j('mod', 'modular en frec.')],
    outputs: [j('sen', '~'), j('tri', '∧'), j('rampa', '⩘'), j('cuad', '⊓')],
    params: [
      p('frecuencia', 'frecuencia', 5, 20000, 261.63, 'hz', {
        curve: 'log',
        control: 'knob-white',
        ticks: ['5hz', '20khz.'],
      }),
      p('fino', 'aj. fino', -2, 2, 0, 'st', { ticks: ['', ''] }),
      p('ancho', 'ancho', 0.05, 0.95, 0.5, 'pct', { ticks: ['⊔', '⊓'] }),
      p('modulador', 'modular en frec.', 0, 1, 0, 'pct', {
        control: 'knob-white-sm',
        ticks: ['d.', 'rec.'],
      }),
    ],
  },

  // ── 9. FILTRO-V: Entrada + jack/perilla ancho + slider Corte + perilla blanca Centro + slider modulación
  filtrov: {
    type: 'filtrov',
    title: 'Filtro-V',
    inputs: [
      j('entrada', 'Entrada'),
      j('anchoCv', 'ancho'),
      j('control', 'Centro'),
      j('mod', 'modulación'),
    ],
    outputs: [j('bajos', 'baj.'), j('altos', 'alt.'), j('banda', 'banda')],
    params: [
      p('ancho', 'ancho', 0, 1, 0.35, 'pct', { ticks: ['mín.', 'máx.'] }),
      p('corte', 'Corte', -2, 2, 0, 'oct', { control: 'fader' }),
      p('centro', 'Centro', 5, 15000, 600, 'hz', {
        curve: 'log',
        control: 'knob-white',
        ticks: ['5Hz', '15kHz'],
      }),
      p('modulacion', 'modulación', 0, 5, 2.2, 'oct', { control: 'fader' }),
    ],
  },

  // ── 10. FILTRO-O: Entrada + slider vertical Corte + 10 sliders de banda (25–13k) + slider Suma + 11 salidas
  filtroo: {
    type: 'filtroo',
    title: 'Filtro-O',
    inputs: [j('entrada', 'Entrada')],
    outputs: [j('suma', 'Suma'), ...BANDS.map((f, i) => j(`b${i}`, bandLabel(f)))],
    params: [
      p('corte', 'Corte', 0, 1, 0.85, 'pct', { control: 'fader-v' }),
      ...BANDS.map((f, i) => p(`g${i}`, bandLabel(f), 0, 1, 0.7, 'pct', { control: 'fader' })),
      p('suma', 'Suma', 0, 1, 0.72, 'pct', { control: 'fader' }),
    ],
  },

  // ── 11. PULSADOR: inicio (+ botón), fin (+ botón), Pulsos 0–100, reloj blanco mín–máx; 3 salidas Pulsos der
  pulsador: {
    type: 'pulsador',
    title: 'Pulsador',
    inputs: [j('inicio', 'inicio'), j('fin', 'fin'), j('anchoCv', 'Pulsos'), j('relojCv', 'reloj')],
    outputs: [j('pulsos', 'Pulsos 1'), j('pulsos2', 'Pulsos 2'), j('inv', 'Pulsos 3')],
    params: [
      p('ancho', 'Pulsos', 0.05, 0.95, 0.35, 'pct', { ticks: ['0', '100'] }),
      p('reloj', 'reloj', 0.1, 40, 4.5, 'hz', {
        curve: 'log',
        control: 'knob-white-sm',
        ticks: ['mín.', 'máx.'],
      }),
    ],
  },

  // ── 12. SECUENCIADOR: entradas/salidas a la izq, 10 pasos con LED+jack arriba, 3×10 perillas, 10 switches abajo
  secuenciador: {
    type: 'secuenciador',
    title: 'S E C U E N C I A D O R',
    inputs: [j('pulso', 'pulsos'), j('reinicio', 'reinicio')],
    outputs: [
      j('pulsoSal', 'Salida'),
      j('a', 'Fila 1'),
      j('b', 'Fila 2'),
      j('c', 'Fila 3'),
      j('volt', 'voltaje'),
      ...Array.from({ length: 10 }, (_, i) => j(`st${i}`, `Paso ${i + 1}`)),
    ],
    params: [
      ...Array.from({ length: 30 }, (_, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const def = row === 0 ? SEQ_A[col] / 24 : row === 1 ? SEQ_B[col] : SEQ_C[col];
        return p(`s${i}`, `${'ABC'[row]}${col + 1}`, 0, 1, def, 'pct', { control: 'knob-sm' });
      }),
      ...Array.from({ length: 10 }, (_, i) =>
        p(`sw${i}`, `Paso ${i + 1}`, 0, 1, 1, 'choice', { control: 'step-sw', choices: ['0', '1'] }),
      ),
    ],
  },

  // ── Consola inferior: TECLADO y SALIDA
  teclado: {
    type: 'teclado',
    title: 'Teclado',
    inputs: [],
    outputs: [j('volt', 'Voltaje'), j('pulso', 'Pulso')],
    params: [p('portamento', 'Portamento', 0, 2, 0, 's', { ticks: ['mín.', 'máx.'] })],
  },

  salida: {
    type: 'salida',
    title: 'Salida',
    stereo: true,
    inputs: [j('izq', 'Izquierda'), j('der', 'Derecha')],
    outputs: [],
    params: [p('volumen', 'Volumen', 0, 1, 0.65, 'pct', { ticks: ['mín.', 'máx.'] })],
  },
};

export interface Instance {
  id: string;
  type: string;
  area: string;
}

export const RACK: Instance[] = [
  { id: 'envolvedor', type: 'envolvedor', area: 'env' },
  { id: 'aleator', type: 'aleator', area: 'ale' },
  { id: 'anillo', type: 'anillo', area: 'ani' },
  { id: 'ruidor', type: 'ruidor', area: 'rui' },
  { id: 'reverberal', type: 'reverberal', area: 'rev' },
  { id: 'integrador', type: 'integrador', area: 'int' },
  { id: 'osc1', type: 'oscilador', area: 'os1' },
  { id: 'osc2', type: 'oscilador', area: 'os2' },
  { id: 'filtrov', type: 'filtrov', area: 'fiv' },
  { id: 'filtroo', type: 'filtroo', area: 'fio' },
  { id: 'pulsador', type: 'pulsador', area: 'pul' },
  { id: 'secuenciador', type: 'secuenciador', area: 'seq' },
  { id: 'teclado', type: 'teclado', area: 'tec' },
  { id: 'salida', type: 'salida', area: 'sal' },
];

export function defaults(type: string): Record<string, number> {
  return Object.fromEntries(MODULES[type].params.map((q) => [q.id, q.def]));
}
