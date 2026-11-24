/**
 * Catálogo de módulos del Omnifón modular.
 * La misma definición genera los procesadores DSP (AudioWorklet) y los paneles.
 *
 * Convención de señales (todas a frecuencia de audio):
 *   audio      ±1
 *   voltaje    1.0 = 1 octava (equivalente a 1 V/oct)
 *   pulso      0 / 1 (umbral 0.5)
 */
export type Fmt = 'hz' | 's' | 'pct' | 'oct' | 'st' | 'int' | 'choice';
export type Control = 'knob' | 'knob-lg' | 'knob-sm' | 'fader' | 'switch' | 'step';

export interface ParamDef {
  id: string;
  label: string;
  min: number;
  max: number;
  def: number;
  fmt: Fmt;
  curve?: 'lin' | 'log';
  control?: Control;
  choices?: string[];
}

export interface JackDef {
  id: string;
  label: string;
}

export interface ButtonDef {
  id: string;
  label: string;
  /** momentary = mantener presionado (pulso manual); toggle = un clic */
  kind: 'momentary' | 'toggle';
}

export type Layout = 'std' | 'seq' | 'bank' | 'keys' | 'out';

export interface ModuleDef {
  type: string;
  title: string;
  inputs: JackDef[];
  outputs: JackDef[];
  params: ParamDef[];
  buttons?: ButtonDef[];
  layout?: Layout;
  /** canales de la salida (sólo «salida» es estéreo) */
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

export const BANDS = [25, 50, 100, 200, 400, 800, 1600, 3200, 6500, 15000];
const bandLabel = (f: number) => (f >= 1000 ? `${f / 1000}k` : String(f));

/** Secuencia inicial de la fila A (semitonos sobre la nota base). */
const SEQ_A = [0, 7, 12, 3, 10, 7, 15, 5, 0, 12];
const SEQ_B = [0.3, 0.6, 0.2, 0.8, 0.5, 0.4, 0.7, 0.2, 0.5, 0.5];
const SEQ_C = [0.8, 0.2, 0.5, 0.2, 0.9, 0.2, 0.5, 0.2, 0.5, 0.5];

export const MODULES: Record<string, ModuleDef> = {
  envolvedor: {
    type: 'envolvedor',
    title: 'Envolvedor',
    inputs: [j('entrada', 'Entrada'), j('control', 'Control')],
    outputs: [j('s1', 'Salida'), j('s2', 'Salida')],
    params: [
      p('min', 'Mínimo', 0, 1, 0, 'pct'),
      p('max', 'Máximo', 0, 1, 1, 'pct'),
    ],
  },

  aleator: {
    type: 'aleator',
    title: 'Aleator',
    inputs: [j('pulso', 'Entrada')],
    outputs: [j('esc', 'Escalón'), j('suave', 'Suave')],
    params: [
      p('velocidad', 'Velocidad', 0.05, 50, 3, 'hz', { curve: 'log' }),
      p('nivel', 'Nivel', 0, 1, 1, 'pct'),
    ],
  },

  anillo: {
    type: 'anillo',
    title: 'Mod. Anular',
    inputs: [j('a', 'Entrada A'), j('b', 'Entrada B')],
    outputs: [j('sal', 'Salida')],
    params: [
      p('portadora', 'Portadora', 1, 5000, 220, 'hz', { curve: 'log' }),
      p('nivel', 'Nivel', 0, 1, 0.8, 'pct'),
    ],
  },

  ruidor: {
    type: 'ruidor',
    title: 'Ruidor',
    inputs: [],
    outputs: [j('blanco', 'Blanco'), j('rosa', 'Rosa')],
    params: [p('nivel', 'Nivel', 0, 1, 0.8, 'pct')],
  },

  reverberal: {
    type: 'reverberal',
    title: 'Reverberal',
    inputs: [j('e1', 'Entrada 1'), j('e2', 'Entrada 2')],
    outputs: [j('sal', 'Salida')],
    params: [
      p('intensidad', 'Intensidad', 0, 1, 0.35, 'pct'),
      p('tiempo', 'Tiempo', 0, 1, 0.6, 'pct'),
    ],
  },

  integrador: {
    type: 'integrador',
    title: 'Integrador Envolv.',
    inputs: [j('pulso', 'Pulso')],
    outputs: [j('sal', 'Salida'), j('inv', 'Inversa')],
    params: [
      p('ataque', 'Ataque', 0.001, 10, 0.005, 's', { curve: 'log' }),
      p('caida', 'Decaimiento', 0.001, 10, 0.3, 's', { curve: 'log' }),
      p('sosten', 'Sostén', 0, 1, 0.6, 'pct'),
      p('extincion', 'Extinción', 0.001, 10, 0.5, 's', { curve: 'log' }),
    ],
    buttons: [{ id: 'manual', label: 'Pulso', kind: 'momentary' }],
  },

  oscilador: {
    type: 'oscilador',
    title: 'Oscilador',
    inputs: [j('frec', 'Frecuencia'), j('mod', 'Modulador'), j('ancho', 'Ancho')],
    outputs: [j('sen', 'Senoidal'), j('tri', 'Triangular'), j('rampa', 'Rampa'), j('cuad', 'Cuadrada')],
    params: [
      p('frecuencia', 'Frecuencia', 5, 20000, 261.63, 'hz', { curve: 'log', control: 'knob-lg' }),
      p('fino', 'Aj. fino', -2, 2, 0, 'st'),
      p('ancho', 'Ancho', 0.05, 0.95, 0.5, 'pct'),
      p('modulador', 'Modulador', 0, 1, 0, 'pct'),
    ],
  },

  filtrov: {
    type: 'filtrov',
    title: 'Filtro-V',
    inputs: [j('entrada', 'Entrada'), j('control', 'Control'), j('mod', 'Modulación')],
    outputs: [j('bajos', 'Bajos'), j('banda', 'Banda'), j('altos', 'Altos')],
    params: [
      p('centro', 'Centro', 20, 16000, 1200, 'hz', { curve: 'log', control: 'knob-lg' }),
      p('ancho', 'Ancho', 0, 1, 0.6, 'pct'),
      p('modulacion', 'Modulación', -5, 5, 0, 'oct'),
    ],
  },

  filtroo: {
    type: 'filtroo',
    title: 'Filtro-O',
    layout: 'bank',
    inputs: [j('entrada', 'Entrada')],
    outputs: [j('suma', 'Suma'), ...BANDS.map((f, i) => j(`b${i}`, bandLabel(f)))],
    params: [
      ...BANDS.map((f, i) => p(`g${i}`, bandLabel(f), 0, 1, 0.7, 'pct', { control: 'fader' })),
      p('suma', 'Suma', 0, 1, 0.8, 'pct', { control: 'fader' }),
    ],
  },

  pulsador: {
    type: 'pulsador',
    title: 'Pulsador',
    inputs: [j('inicio', 'Inicio'), j('fin', 'Fin')],
    outputs: [j('pulsos', 'Pulsos 1'), j('pulsos2', 'Pulsos 2'), j('inv', 'Inverso')],
    params: [
      p('reloj', 'Reloj', 0.1, 40, 4, 'hz', { curve: 'log' }),
      p('ancho', 'Ancho', 0.05, 0.95, 0.3, 'pct'),
    ],
    buttons: [{ id: 'marcha', label: 'Marcha', kind: 'toggle' }],
  },

  secuenciador: {
    type: 'secuenciador',
    title: 'Secuenciador',
    layout: 'seq',
    inputs: [j('pulso', 'Pulso'), j('reinicio', 'Reinicio')],
    outputs: [j('a', 'Fila A'), j('b', 'Fila B'), j('c', 'Fila C'), j('pulsoSal', 'Pulso')],
    params: [
      ...Array.from({ length: 30 }, (_, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const def = row === 0 ? SEQ_A[col] / 24 : row === 1 ? SEQ_B[col] : SEQ_C[col];
        return p(`s${i}`, `${'ABC'[row]}${col + 1}`, 0, 1, def, 'pct', { control: 'step' });
      }),
      p('pasos', 'Pasos', 1, 10, 8, 'int'),
      p('cuantizar', 'Fila A', 0, 1, 1, 'choice', { control: 'switch', choices: ['Libre', 'Semitono'] }),
    ],
  },

  teclado: {
    type: 'teclado',
    title: 'Teclado',
    layout: 'keys',
    inputs: [],
    outputs: [j('volt', 'Voltaje'), j('pulso', 'Pulso')],
    params: [p('portamento', 'Portamento', 0, 2, 0, 's')],
  },

  salida: {
    type: 'salida',
    title: 'Salida',
    layout: 'out',
    stereo: true,
    inputs: [j('izq', 'Izquierda'), j('der', 'Derecha')],
    outputs: [],
    params: [p('volumen', 'Volumen', 0, 1, 0.6, 'pct')],
  },
};

/** Instancias en el gabinete (en el orden de la imagen de referencia). */
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
