/**
 * Definición única de parámetros del Omnifón virtual.
 * La comparten el procesador DSP (AudioWorklet) y la interfaz.
 */
export type Format = 'hz' | 's' | 'pct' | 'oct' | 'choice';

export interface ParamDef {
  id: string;
  label: string;
  min: number;
  max: number;
  def: number;
  curve?: 'lin' | 'log';
  fmt: Format;
  /** Etiquetas para parámetros discretos (conmutadores). */
  choices?: string[];
}

export const PARAMS: ParamDef[] = [
  // ── GENERACIÓN · Oscilador principal (10 Hz – 20 kHz, barrido continuo)
  { id: 'vcoFreq', label: 'Frecuencia', min: 10, max: 20000, def: 440, curve: 'log', fmt: 'hz' },
  { id: 'vcoTrack', label: 'Teclado', min: 0, max: 1, def: 1, fmt: 'choice', choices: ['Libre', 'Teclado'] },
  { id: 'glide', label: 'Portamento', min: 0, max: 2, def: 0, fmt: 's' },
  { id: 'tolerance', label: 'Tolerancia', min: 0, max: 1, def: 0, fmt: 'pct' },

  // ── GENERACIÓN · Mezcla de formas de onda
  { id: 'lvlSine', label: 'Senoidal', min: 0, max: 1, def: 0.8, fmt: 'pct' },
  { id: 'lvlSquare', label: 'Cuadrada', min: 0, max: 1, def: 0, fmt: 'pct' },
  { id: 'lvlRamp', label: 'Rampa', min: 0, max: 1, def: 0, fmt: 'pct' },
  { id: 'lvlNoise', label: 'Ruido blanco', min: 0, max: 1, def: 0, fmt: 'pct' },

  // ── MODIFICACIÓN · Filtro por voltaje
  { id: 'cutoff', label: 'Corte', min: 20, max: 20000, def: 20000, curve: 'log', fmt: 'hz' },
  { id: 'resonance', label: 'Resonancia', min: 0, max: 1, def: 0.1, fmt: 'pct' },
  { id: 'filterMode', label: 'Modo', min: 0, max: 2, def: 0, fmt: 'choice', choices: ['Bajos', 'Banda', 'Altos'] },
  { id: 'filterSlope', label: 'Pendiente', min: 0, max: 1, def: 0, fmt: 'choice', choices: ['12 dB', '24 dB'] },
  { id: 'filterEnv', label: 'Envolvente', min: -5, max: 5, def: 0, fmt: 'oct' },
  { id: 'filterTrack', label: 'Seguimiento', min: 0, max: 1, def: 0, fmt: 'pct' },

  // ── CONTROL · Generador de envolvente
  { id: 'attack', label: 'Ataque', min: 0.001, max: 10, def: 0.005, curve: 'log', fmt: 's' },
  { id: 'decay', label: 'Caída', min: 0.001, max: 10, def: 0.3, curve: 'log', fmt: 's' },
  { id: 'sustain', label: 'Sostén', min: 0, max: 1, def: 0.7, fmt: 'pct' },
  { id: 'release', label: 'Extinción', min: 0.001, max: 10, def: 0.5, curve: 'log', fmt: 's' },
  { id: 'egMode', label: 'Tipo', min: 0, max: 1, def: 1, fmt: 'choice', choices: ['AR', 'ADSR'] },
  { id: 'egCv', label: 'Control ext.', min: 0, max: 1, def: 1, fmt: 'pct' },

  // ── CONTROL · Amplificador
  { id: 'vcaBias', label: 'Sostenido', min: 0, max: 1, def: 0, fmt: 'pct' },
  { id: 'volume', label: 'Volumen', min: 0, max: 1, def: 0.5, fmt: 'pct' },

  // ── MODO ESTUDIO 1981 · Oscilador 2 / modulador
  { id: 'vco2Freq', label: 'Frecuencia', min: 0.05, max: 20000, def: 5, curve: 'log', fmt: 'hz' },
  { id: 'vco2Wave', label: 'Onda', min: 0, max: 2, def: 0, fmt: 'choice', choices: ['Sen', 'Cuad', 'Rampa'] },
  { id: 'vco2ToPitch', label: '→ Tono', min: 0, max: 4, def: 0, fmt: 'oct' },
  { id: 'vco2ToCutoff', label: '→ Filtro', min: 0, max: 5, def: 0, fmt: 'oct' },
  { id: 'vco2ToAmp', label: '→ Amplitud', min: 0, max: 1, def: 0, fmt: 'pct' },
];

export const PARAM_MAP: Record<string, ParamDef> = Object.fromEntries(PARAMS.map((p) => [p.id, p]));

/** Parámetros que sólo existen en el Modo Estudio (1981). */
export const STUDIO_ONLY = ['vco2ToPitch', 'vco2ToCutoff', 'vco2ToAmp'];
