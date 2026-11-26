import type { Lang } from './i18n';
import type { Cable } from './rack';

export type PatchCategory = 'hist' | 'keys' | 'seq' | 'perc' | 'exp';

export const PATCH_CATEGORIES: Record<PatchCategory, Record<Lang, string>> = {
  hist: { es: 'Históricos', en: 'Historical' },
  keys: { es: 'Teclado y Solistas', en: 'Keys & Leads' },
  seq:  { es: 'Bajos y Secuencias', en: 'Bass & Sequences' },
  perc: { es: 'Metalofonía y Percusión', en: 'Bells & Percussion' },
  exp:  { es: 'Drones, Formantes y Generativos', en: 'Drones, Formants & Generative' },
};

export interface Patch {
  id: string;
  category?: PatchCategory;
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  cables: [string, string][];
  values: Record<string, Record<string, number>>;
}

const rowA = (semitones: number[]) =>
  Object.fromEntries(semitones.map((s, i) => [`s${i}`, s / 24]));
const rowB = (vals: number[]) =>
  Object.fromEntries(vals.map((v, i) => [`s${10 + i}`, v]));
const rowC = (vals: number[]) =>
  Object.fromEntries(vals.map((v, i) => [`s${20 + i}`, v]));
const switches = (onOff: number[]) =>
  Object.fromEntries(onOff.map((v, i) => [`sw${i}`, v]));

export const PATCHES: Patch[] = [
  // ── 1. SIEMPRE AL INICIO: Recreación documental Figura IV.38 (1981)
  {
    id: 'fig-iv-38',
    name: { es: '1 · Fig. IV.38', en: '1 · Fig. IV.38' },
    description: {
      es: 'Alambrado original del libro de Raúl Pavón (1981): ciclo de 5 pasos con modulación anular por el banco de octavas + ruido rosa con filtrado programado.',
      en: 'Raúl Pavón’s original 1981 book patch (Fig. IV.38): 5-step ring-modulated sequence through the octave bank + programmed bandpass pink noise.',
    },
    cables: [
      ['pulsador.pulsos', 'integrador.pulso'],
      ['pulsador.pulsos2', 'secuenciador.pulso'],
      ['pulsador.inv', 'aleator.pulso'],
      ['secuenciador.st5', 'secuenciador.reinicio'],
      ['secuenciador.a', 'osc1.frec'],
      ['aleator.esc', 'osc1.mod'],
      ['osc1.tri', 'envolvedor.entrada'],
      ['integrador.sal', 'envolvedor.control'],
      ['osc1.rampa', 'anillo.b'],
      ['osc2.sen', 'anillo.a'],
      ['anillo.sal', 'filtroo.entrada'],
      ['filtroo.suma', 'reverberal.e2'],
      ['ruidor.rosa', 'filtrov.entrada'],
      ['secuenciador.b', 'filtrov.mod'],
      ['filtrov.banda', 'reverberal.e1'],
      ['envolvedor.s1', 'salida.izq'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      pulsador: { reloj: 4.5, ancho: 0.35 },
      secuenciador: {
        ...rowA([0, 7, 10, 3, 12, 5, 15, 7, 2, 10]),
        ...rowB([0.15, 0.75, 0.35, 0.85, 0.25, 0.65, 0.9, 0.4, 0.55, 0.3]),
        ...switches([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      },
      osc1: { frecuencia: 196, modulador: 0.12, ancho: 0.5, modoMod: 0 },
      osc2: { frecuencia: 293.66, modulador: 0 },
      anillo: { nivel: 0.75 },
      integrador: { ataque: 0.008, modo: 0, duracion: 0.06, decaimiento: 0.18 },
      envolvedor: { nivel: 0, mod: 0.9 },
      filtrov: { centro: 520, corte: 0, ancho: 0.28, modulacion: 2.2 },
      filtroo: {
        corte: 0.85,
        g0: 0.72,
        g1: 0.48,
        g2: 0.75,
        g3: 0.42,
        g4: 0.74,
        g5: 0.64,
        g6: 0.46,
        g7: 0.5,
        g8: 0.35,
        g9: 0.3,
        suma: 0.68,
      },
      reverberal: { intensidad: 0.42, tiempo: 0.68 },
      salida: { volumen: 0.62 },
    },
  },

  // ── 2. Voz sustractiva expresiva para tocar con teclado o MIDI
  {
    id: 'teclado',
    name: { es: '2 · Teclado', en: '2 · Keyboard' },
    description: {
      es: 'Voz solista sustractiva (1960–64) con vibrato sutil y filtro resonante: toca el teclado de 5 octavas, las teclas A–Ñ o un controlador MIDI.',
      en: 'Expressive 1960s subtractive lead with subtle vibrato and resonant filter: play the 5-octave keyboard, keys A–;, or MIDI.',
    },
    cables: [
      ['teclado.volt', 'osc1.frec'],
      ['osc2.sen', 'osc1.mod'],
      ['osc1.rampa', 'filtrov.entrada'],
      ['teclado.pulso', 'integrador.pulso'],
      ['integrador.sal', 'filtrov.mod'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['integrador.sal2', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
      ['envolvedor.s2', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 261.63, modulador: 0.02, fino: 0 },
      osc2: { frecuencia: 5.4, modulador: 0 },
      filtrov: { centro: 420, corte: 0, ancho: 0.26, modulacion: 3.1 },
      integrador: { ataque: 0.006, modo: 0, duracion: 0.12, decaimiento: 0.42 },
      envolvedor: { nivel: 0, mod: 0.92 },
      reverberal: { intensidad: 0.32, tiempo: 0.62 },
      teclado: { portamento: 0.03 },
      salida: { volumen: 0.65 },
    },
  },

  // ── 3. Bajo analógico hipnótico de 8 pasos
  {
    id: 'bajo',
    name: { es: '3 · Bajo 8p', en: '3 · 8-Step Bass' },
    description: {
      es: 'Secuencia rítmica de bajo en 8 pasos (puente al paso 9) con onda rectangular, resonancia modulada por paso y envolvente punzante.',
      en: 'Driving 8-step analog bassline (step-9 reset jumper) with pulse wave, per-step resonance modulation, and punchy envelope.',
    },
    cables: [
      ['pulsador.pulsos', 'secuenciador.pulso'],
      ['secuenciador.st8', 'secuenciador.reinicio'],
      ['secuenciador.a', 'osc1.frec'],
      ['secuenciador.pulsoSal', 'integrador.pulso'],
      ['osc1.cuad', 'filtrov.entrada'],
      ['integrador.sal', 'filtrov.mod'],
      ['secuenciador.b', 'filtrov.anchoCv'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['integrador.sal2', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
      ['envolvedor.s2', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 65.41, ancho: 0.28, modulador: 0 },
      pulsador: { reloj: 7.2, ancho: 0.42 },
      secuenciador: {
        ...rowA([0, 0, 12, 0, 7, 10, 0, 15, 0, 12]),
        ...rowB([0.1, 0.5, 0.05, 0.6, 0.15, 0.08, 0.55, 0.05, 0.3, 0.3]),
        ...switches([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      },
      filtrov: { centro: 210, corte: 0, ancho: 0.16, modulacion: 3.4 },
      integrador: { ataque: 0.005, modo: 0, duracion: 0.03, decaimiento: 0.13 },
      envolvedor: { nivel: 0, mod: 0.95 },
      reverberal: { intensidad: 0.22, tiempo: 0.45 },
      salida: { volumen: 0.68 },
    },
  },

  // ── 4. Metalofonía electroacústica en Modulador Anular (7 pasos)
  {
    id: 'campanas',
    name: { es: '4 · Campanas', en: '4 · Ring Bells' },
    description: {
      es: 'Timbres metálicos e inarmónicos estilo estudio de Colonia: modulación anular en compás de 7 pasos esculpida por el banco Filtro-O.',
      en: 'Cologne-studio metallic timbres: 7-step inharmonic ring modulation sculpted through the 10-octave filter bank.',
    },
    cables: [
      ['pulsador.pulsos', 'secuenciador.pulso'],
      ['secuenciador.st7', 'secuenciador.reinicio'],
      ['secuenciador.a', 'osc1.frec'],
      ['secuenciador.b', 'osc2.frec'],
      ['osc1.sen', 'anillo.a'],
      ['osc2.tri', 'anillo.b'],
      ['secuenciador.c', 'anillo.mod'],
      ['anillo.sal', 'envolvedor.entrada'],
      ['secuenciador.pulsoSal', 'integrador.pulso'],
      ['integrador.sal', 'envolvedor.control'],
      ['envolvedor.s1', 'filtroo.entrada'],
      ['filtroo.suma', 'reverberal.e1'],
      ['envolvedor.s2', 'salida.izq'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      pulsador: { reloj: 3.2, ancho: 0.25 },
      secuenciador: {
        ...rowA([0, 5, 11, 14, 7, 18, 3, 0, 0, 0]),
        ...rowB([0.1, 0.62, 0.34, 0.81, 0.47, 0.22, 0.73, 0.5, 0.5, 0.5]),
        ...rowC([0.4, 0.8, 0.3, 0.9, 0.5, 0.7, 0.6, 0.5, 0.5, 0.5]),
        ...switches([1, 1, 1, 0, 1, 1, 1, 1, 1, 1]),
      },
      osc1: { frecuencia: 310, modulador: 0 },
      osc2: { frecuencia: 447, modulador: 0 },
      anillo: { nivel: 0.9 },
      integrador: { ataque: 0.005, modo: 0, duracion: 0.02, decaimiento: 0.55 },
      envolvedor: { nivel: 0, mod: 0.95 },
      filtroo: {
        corte: 0.95,
        g0: 0.1,
        g1: 0.15,
        g2: 0.3,
        g3: 0.55,
        g4: 0.8,
        g5: 0.9,
        g6: 0.85,
        g7: 0.95,
        g8: 0.75,
        g9: 0.6,
        suma: 0.85,
      },
      reverberal: { intensidad: 0.58, tiempo: 0.82 },
      salida: { volumen: 0.66 },
    },
  },

  // ── 5. Máquina generativa autónoma con Integrador en modo interno (int.)
  {
    id: 'aleatorio',
    name: { es: '5 · Aleatorio', en: '5 · Aleatoric' },
    description: {
      es: 'Estudio generativo años 60: el Integrador en modo interno (int.) autocicla y dispara al Aleator para crear melodías y timbres FM impredecibles.',
      en: '1960s generative lab: the Integrator self-cycles in internal (int.) mode, clocking the Randomizer for unpredictable FM gestures.',
    },
    cables: [
      ['integrador.pulsoSal', 'aleator.pulso'],
      ['aleator.esc', 'osc1.frec'],
      ['osc2.sen', 'osc1.mod'],
      ['aleator.suave', 'osc2.frec'],
      ['osc1.rampa', 'filtrov.entrada'],
      ['integrador.sal', 'filtrov.mod'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['integrador.sal2', 'envolvedor.control'],
      ['envolvedor.s1', 'reverberal.e1'],
      ['filtrov.altos', 'reverberal.e2'],
      ['envolvedor.s2', 'salida.izq'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      integrador: { ataque: 0.015, modo: 1, duracion: 0.05, decaimiento: 0.22 },
      osc1: { frecuencia: 280, modulador: 0.35, modoMod: 1 },
      osc2: { frecuencia: 190, modulador: 0 },
      filtrov: { centro: 620, corte: 0, ancho: 0.2, modulacion: 2.8 },
      envolvedor: { nivel: 0, mod: 0.88 },
      reverberal: { intensidad: 0.48, tiempo: 0.74 },
      salida: { volumen: 0.6 },
    },
  },

  // ── 6. Coro espectral / vocal en el Banco de Octavas (Filtro-O)
  {
    id: 'formantes',
    name: { es: '6 · Formantes', en: '6 · Formants' },
    description: {
      es: 'Canto espectral: armónicos de rampa y aire de ruido rosa esculpidos como formantes vocales en el Filtro-O (también responde al teclado).',
      en: 'Spectral choir: sawtooth harmonics and pink-noise breath sculpted into vowel formants on the O-Filter (also playable on the keyboard).',
    },
    cables: [
      ['teclado.volt', 'osc1.frec'],
      ['osc2.sen', 'osc1.mod'],
      ['osc1.rampa', 'filtroo.entrada'],
      ['filtroo.suma', 'envolvedor.entrada'],
      ['teclado.pulso', 'integrador.pulso'],
      ['integrador.sal', 'envolvedor.control'],
      ['ruidor.rosa', 'filtrov.entrada'],
      ['aleator.suave', 'filtrov.control'],
      ['envolvedor.s1', 'reverberal.e1'],
      ['filtrov.banda', 'reverberal.e2'],
      ['envolvedor.s2', 'salida.izq'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 146.83, modulador: 0.025, fino: 0 },
      osc2: { frecuencia: 5.8, modulador: 0 },
      integrador: { ataque: 0.25, modo: 0, duracion: 0.2, decaimiento: 0.9 },
      envolvedor: { nivel: 0.45, mod: 0.55 },
      filtroo: {
        corte: 0.9,
        g0: 0.15,
        g1: 0.2,
        g2: 0.35,
        g3: 0.2,
        g4: 0.95,
        g5: 0.85,
        g6: 0.15,
        g7: 0.9,
        g8: 0.3,
        g9: 0.1,
        suma: 0.9,
      },
      filtrov: { centro: 1100, corte: 0, ancho: 0.22, modulacion: 1.5 },
      reverberal: { intensidad: 0.62, tiempo: 0.85 },
      teclado: { portamento: 0.08 },
      salida: { volumen: 0.64 },
    },
  },

  // ── 7. Laboratorio de percusión analógica de 10 pasos
  {
    id: 'percusion',
    name: { es: '7 · Percusión', en: '7 · Percussion' },
    description: {
      es: 'Polirritmia analógica de 10 pasos: bombos de barrido exponencial y ráfagas metálicas de ruido blanco con pasos alternados en los switches inferiores.',
      en: '10-step analog drum lab: pitch-swept kicks and metallic white-noise bursts shaped by the bottom step switches.',
    },
    cables: [
      ['pulsador.pulsos', 'secuenciador.pulso'],
      ['secuenciador.pulsoSal', 'integrador.pulso'],
      ['integrador.sal', 'osc1.mod'],
      ['secuenciador.a', 'osc1.frec'],
      ['osc1.sen', 'envolvedor.entrada'],
      ['integrador.sal2', 'envolvedor.control'],
      ['ruidor.blanco', 'filtrov.entrada'],
      ['secuenciador.b', 'filtrov.control'],
      ['filtrov.altos', 'anillo.a'],
      ['secuenciador.c', 'anillo.b'],
      ['anillo.sal', 'reverberal.e2'],
      ['envolvedor.s1', 'salida.izq'],
      ['envolvedor.s2', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      pulsador: { reloj: 6.8, ancho: 0.3 },
      secuenciador: {
        ...rowA([0, 7, 0, 12, 0, 3, 15, 0, 5, 10]),
        ...rowB([0.1, 0.9, 0.3, 0.85, 0.2, 0.95, 0.4, 0.75, 0.2, 0.9]),
        ...rowC([0.8, 0.3, 0.2, 0.9, 0.1, 0.7, 0.4, 0.85, 0.2, 0.95]),
        ...switches([1, 0, 1, 1, 0, 1, 1, 0, 1, 1]),
      },
      osc1: { frecuencia: 55, modulador: 0.65, modoMod: 0 },
      integrador: { ataque: 0.005, modo: 0, duracion: 0.015, decaimiento: 0.11 },
      envolvedor: { nivel: 0, mod: 0.95 },
      filtrov: { centro: 2400, corte: 0.5, ancho: 0.25, modulacion: 1.5 },
      anillo: { nivel: 0.65 },
      reverberal: { intensidad: 0.28, tiempo: 0.5 },
      salida: { volumen: 0.68 },
    },
  },

  // ── 8. Paisaje cósmico contemplativo
  {
    id: 'cosmos',
    name: { es: '8 · Cosmos', en: '8 · Deep Cosmos' },
    description: {
      es: 'Paisaje electroacústico contemplativo: oleadas lentas autocicladas, modulación anular subaudible y viento estelar sobre el banco de octavas.',
      en: 'Contemplative electroacoustic soundscape: slow self-cycling waves, sub-audio ring modulation, and stellar pink noise.',
    },
    cables: [
      ['osc2.sen', 'osc1.mod'],
      ['aleator.suave', 'osc1.frec'],
      ['osc1.sen', 'anillo.a'],
      ['anillo.sal', 'envolvedor.entrada'],
      ['integrador.sal', 'envolvedor.control'],
      ['envolvedor.s1', 'reverberal.e1'],
      ['ruidor.rosa', 'filtroo.entrada'],
      ['filtroo.suma', 'filtrov.entrada'],
      ['integrador.sal2', 'filtrov.mod'],
      ['filtrov.bajos', 'reverberal.e2'],
      ['reverberal.sal', 'salida.izq'],
      ['reverberal.sal2', 'salida.der'],
    ],
    values: {
      integrador: { ataque: 1.6, modo: 1, duracion: 0.8, decaimiento: 2.2 },
      osc1: { frecuencia: 220, modulador: 0.28, modoMod: 0 },
      osc2: { frecuencia: 5.1, modulador: 0 },
      anillo: { nivel: 0.72 },
      envolvedor: { nivel: 0.12, mod: 0.75 },
      filtroo: {
        corte: 0.78,
        g0: 0.3,
        g1: 0.5,
        g2: 0.2,
        g3: 0.7,
        g4: 0.1,
        g5: 0.8,
        g6: 0.2,
        g7: 0.65,
        g8: 0.15,
        g9: 0.35,
        suma: 0.8,
      },
      filtrov: { centro: 340, corte: 0, ancho: 0.22, modulacion: 2.6 },
      reverberal: { intensidad: 0.72, tiempo: 0.92 },
      salida: { volumen: 0.6 },
    },
  },

  // ── 9. Prototipo de los años 60 (c. 1960–64): voz sustractiva pura de laboratorio
  {
    id: 'prototipo-60s',
    category: 'hist',
    name: { es: '9 · Prototipo 60s', en: '9 · 60s Prototype' },
    description: {
      es: 'Evocación del prototipo original (c. 1960–64): un solo oscilador continuo (10 Hz–20 kHz), filtro por voltaje, envolvente trapezoidal y salida directa seca sin reverberación.',
      en: 'Evocation of the original 1960–64 prototype: single continuous oscillator (10 Hz–20 kHz), voltage-controlled filter, trapezoid envelope, and dry direct output with no reverb.',
    },
    cables: [
      ['teclado.volt', 'osc1.frec'],
      ['teclado.pulso', 'integrador.pulso'],
      ['osc1.cuad', 'filtrov.entrada'],
      ['integrador.sal', 'filtrov.mod'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['integrador.sal2', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
    ],
    values: {
      osc1: { frecuencia: 261.63, modulador: 0, fino: 0, ancho: 0.48 },
      filtrov: { centro: 380, corte: 0, ancho: 0.34, modulacion: 2.8 },
      integrador: { ataque: 0.012, modo: 0, duracion: 0.08, decaimiento: 0.32 },
      envolvedor: { nivel: 0, mod: 0.94 },
      teclado: { portamento: 0.015 },
      salida: { volumen: 0.68 },
    },
  },

  // ── 10. Estudio CNM 1970
  {
    id: 'estudio-cnm-1970',
    category: 'hist',
    name: { es: '10 · Estudio CNM 70', en: '10 · CNM Studio 70' },
    description: {
      es: 'Homenaje al Laboratorio de Música Electrónica del CNM (1970): doble oscilador desafinado en modulación anular con reverberación de estudio y barrido lento.',
      en: 'Tribute to Mexico’s 1970 CNM Electronic Music Lab: detuned dual VCOs into ring modulation with studio spring reverb and slow filter drift.',
    },
    cables: [
      ['teclado.volt', 'osc1.frec'],
      ['teclado.volt', 'osc2.frec'],
      ['teclado.pulso', 'integrador.pulso'],
      ['osc1.sen', 'anillo.a'],
      ['osc2.tri', 'anillo.b'],
      ['anillo.sal', 'filtrov.entrada'],
      ['integrador.sal', 'filtrov.mod'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['integrador.sal2', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
      ['envolvedor.s2', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 220, fino: -0.15 },
      osc2: { frecuencia: 330, fino: 0.12 },
      anillo: { nivel: 0.85 },
      filtrov: { centro: 620, ancho: 0.25, modulacion: 2.4 },
      integrador: { ataque: 0.04, modo: 0, duracion: 0.14, decaimiento: 0.65 },
      envolvedor: { nivel: 0, mod: 0.92 },
      reverberal: { intensidad: 0.52, tiempo: 0.78 },
      teclado: { portamento: 0.04 },
      salida: { volumen: 0.64 },
    },
  },

  // ── 11. Solista Bronce
  {
    id: 'solista-bronce',
    category: 'keys',
    name: { es: '11 · Solista Bronce', en: '11 · Brass Lead' },
    description: {
      es: 'Metal analógico expresivo para teclado/MIDI: onda rampa con ataque progresivo de filtro pasa-bajos y reverberación cálida.',
      en: 'Expressive analog brass lead for keyboard/MIDI: sawtooth wave with swelling low-pass filter envelope and warm reverb.',
    },
    cables: [
      ['teclado.volt', 'osc1.frec'],
      ['teclado.pulso', 'integrador.pulso'],
      ['osc1.rampa', 'filtrov.entrada'],
      ['integrador.sal', 'filtrov.mod'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['integrador.sal2', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
      ['envolvedor.s2', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 261.63, modulador: 0 },
      filtrov: { centro: 240, ancho: 0.36, modulacion: 3.8 },
      integrador: { ataque: 0.09, modo: 0, duracion: 0.22, decaimiento: 0.45 },
      envolvedor: { nivel: 0, mod: 0.95 },
      reverberal: { intensidad: 0.34, tiempo: 0.6 },
      teclado: { portamento: 0.025 },
      salida: { volumen: 0.66 },
    },
  },

  // ── 12. Theremin Óptico
  {
    id: 'theremin',
    category: 'keys',
    name: { es: '12 · Theremin', en: '12 · Theremin' },
    description: {
      es: 'Onda senoidal pura con portamento largo y vibrato expresivo desde Oscilador 2, ideal para melodías ligadas en el teclado.',
      en: 'Pure sine wave with long glide portamento and expressive vibrato from Oscillator 2, ideal for legato keyboard melodies.',
    },
    cables: [
      ['teclado.volt', 'osc1.frec'],
      ['osc2.sen', 'osc1.mod'],
      ['teclado.pulso', 'integrador.pulso'],
      ['osc1.sen', 'envolvedor.entrada'],
      ['integrador.sal', 'envolvedor.control'],
      ['envolvedor.s1', 'reverberal.e1'],
      ['reverberal.sal', 'salida.izq'],
      ['reverberal.sal2', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 440, modulador: 0.035 },
      osc2: { frecuencia: 6.2, modulador: 0 },
      integrador: { ataque: 0.16, modo: 0, duracion: 0.18, decaimiento: 0.55 },
      envolvedor: { nivel: 0, mod: 0.9 },
      reverberal: { intensidad: 0.48, tiempo: 0.72 },
      teclado: { portamento: 0.18 },
      salida: { volumen: 0.64 },
    },
  },

  // ── 13. Órgano de Octavas
  {
    id: 'organo-octavas',
    category: 'keys',
    name: { es: '13 · Órgano Octavas', en: '13 · Octave Organ' },
    description: {
      es: 'Órgano electrónico para teclado/MIDI esculpido con los 10 deslizadores del Filtro-O como registros armónicos de tubos.',
      en: 'Electronic organ for keyboard/MIDI sculpted by the 10-band O-Filter sliders acting as harmonic drawbars.',
    },
    cables: [
      ['teclado.volt', 'osc1.frec'],
      ['teclado.pulso', 'integrador.pulso'],
      ['osc1.cuad', 'filtroo.entrada'],
      ['filtroo.suma', 'envolvedor.entrada'],
      ['integrador.sal', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
      ['envolvedor.s2', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 261.63, ancho: 0.5 },
      filtroo: {
        corte: 0.9,
        g0: 0.4, g1: 0.8, g2: 0.95, g3: 0.65, g4: 0.9,
        g5: 0.45, g6: 0.85, g7: 0.35, g8: 0.6, g9: 0.25,
        suma: 0.88,
      },
      integrador: { ataque: 0.008, modo: 0, duracion: 0.2, decaimiento: 0.12 },
      envolvedor: { nivel: 0, mod: 0.95 },
      reverberal: { intensidad: 0.38, tiempo: 0.64 },
      teclado: { portamento: 0 },
      salida: { volumen: 0.68 },
    },
  },

  // ── 14. Flauta Concreta
  {
    id: 'flauta-concreta',
    category: 'keys',
    name: { es: '14 · Flauta Concreta', en: '14 · Breath Flute' },
    description: {
      es: 'Triangular suave mezclada con aliento de ruido rosa a través del Filtro-V pasa-banda para teclado o MIDI.',
      en: 'Soft triangle blended with pink noise breath through resonant bandpass V-Filter for keyboard or MIDI.',
    },
    cables: [
      ['teclado.volt', 'osc1.frec'],
      ['teclado.volt', 'filtrov.control'],
      ['teclado.pulso', 'integrador.pulso'],
      ['osc1.tri', 'envolvedor.entrada'],
      ['integrador.sal', 'envolvedor.control'],
      ['ruidor.rosa', 'filtrov.entrada'],
      ['filtrov.banda', 'reverberal.e2'],
      ['envolvedor.s1', 'reverberal.e1'],
      ['reverberal.sal', 'salida.izq'],
      ['reverberal.sal2', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 523.25, modulador: 0 },
      filtrov: { centro: 920, ancho: 0.16, modulacion: 0 },
      integrador: { ataque: 0.06, modo: 0, duracion: 0.15, decaimiento: 0.35 },
      envolvedor: { nivel: 0, mod: 0.9 },
      reverberal: { intensidad: 0.45, tiempo: 0.68 },
      teclado: { portamento: 0.03 },
      salida: { volumen: 0.66 },
    },
  },

  // ── 15. Secuencia 10p (Escuela de Berlín)
  {
    id: 'secuencia-10p',
    category: 'seq',
    name: { es: '15 · Secuencia 10p', en: '15 · 10-Step Berlin' },
    description: {
      es: 'Secuencia analógica completa de 10 pasos estilo Escuela de Berlín con barrido resonante y eco espacial.',
      en: 'Full 10-step Berlin-school analog sequence with resonant filter sweep and spacious reverb.',
    },
    cables: [
      ['pulsador.pulsos', 'secuenciador.pulso'],
      ['secuenciador.pulsoSal', 'integrador.pulso'],
      ['secuenciador.a', 'osc1.frec'],
      ['osc1.rampa', 'filtrov.entrada'],
      ['integrador.sal', 'filtrov.mod'],
      ['secuenciador.b', 'filtrov.control'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['integrador.sal2', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
      ['envolvedor.s2', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      pulsador: { reloj: 6.4, ancho: 0.4 },
      secuenciador: {
        ...rowA([0, 7, 12, 10, 7, 3, 5, 7, 12, 15]),
        ...rowB([0.2, 0.4, 0.7, 0.5, 0.3, 0.6, 0.8, 0.4, 0.9, 0.3]),
        ...switches([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      },
      osc1: { frecuencia: 130.81, modulador: 0 },
      filtrov: { centro: 300, ancho: 0.24, modulacion: 3.2 },
      integrador: { ataque: 0.006, modo: 0, duracion: 0.04, decaimiento: 0.2 },
      envolvedor: { nivel: 0, mod: 0.92 },
      reverberal: { intensidad: 0.42, tiempo: 0.72 },
      salida: { volumen: 0.64 },
    },
  },

  // ── 16. Polirritmia 6p
  {
    id: 'polirritmia-6p',
    category: 'seq',
    name: { es: '16 · Polirritmia 6p', en: '16 · 6-Step Groove' },
    description: {
      es: 'Bucle hipnótico de 6 pasos (puente al paso 7) con onda rectangular estrecha y silencios rítmicos en los switches.',
      en: 'Hypnotic 6-step loop (step-7 reset jumper) with narrow pulse wave and rhythmic switch rests.',
    },
    cables: [
      ['pulsador.pulsos', 'secuenciador.pulso'],
      ['secuenciador.st6', 'secuenciador.reinicio'],
      ['secuenciador.pulsoSal', 'integrador.pulso'],
      ['secuenciador.a', 'osc1.frec'],
      ['osc1.cuad', 'filtrov.entrada'],
      ['integrador.sal', 'filtrov.mod'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['integrador.sal2', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
      ['envolvedor.s2', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      pulsador: { reloj: 5.8, ancho: 0.35 },
      secuenciador: {
        ...rowA([0, 12, 7, 10, 3, 5, 0, 0, 0, 0]),
        ...switches([1, 1, 0, 1, 1, 1, 1, 1, 1, 1]),
      },
      osc1: { frecuencia: 82.41, ancho: 0.22 },
      filtrov: { centro: 210, ancho: 0.28, modulacion: 3.5 },
      integrador: { ataque: 0.005, modo: 0, duracion: 0.03, decaimiento: 0.14 },
      envolvedor: { nivel: 0, mod: 0.95 },
      reverberal: { intensidad: 0.26, tiempo: 0.5 },
      salida: { volumen: 0.66 },
    },
  },

  // ── 17. Bajo Subarmónico
  {
    id: 'bajo-sub',
    category: 'seq',
    name: { es: '17 · Bajo Subarmónico', en: '17 · Sub Bass' },
    description: {
      es: 'Bajo profundo tocable con teclado/MIDI combinando onda cuadrada filtrada y subgrave senoidal limpio.',
      en: 'Deep playable keyboard/MIDI bass combining filtered square wave with clean sine sub-octave.',
    },
    cables: [
      ['teclado.volt', 'osc1.frec'],
      ['teclado.volt', 'osc2.frec'],
      ['teclado.pulso', 'integrador.pulso'],
      ['osc1.cuad', 'filtrov.entrada'],
      ['integrador.sal', 'filtrov.mod'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['integrador.sal2', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
      ['osc2.sen', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 65.41, ancho: 0.45 },
      osc2: { frecuencia: 32.7, modulador: 0 },
      filtrov: { centro: 140, ancho: 0.42, modulacion: 2.6 },
      integrador: { ataque: 0.006, modo: 0, duracion: 0.09, decaimiento: 0.26 },
      envolvedor: { nivel: 0, mod: 0.96 },
      reverberal: { intensidad: 0.08, tiempo: 0.3 },
      teclado: { portamento: 0.02 },
      salida: { volumen: 0.68 },
    },
  },

  // ── 18. Arpegio Cristal
  {
    id: 'arpegio-cristal',
    category: 'seq',
    name: { es: '18 · Arpegio Cristal', en: '18 · Crystal Arp' },
    description: {
      es: 'Arpegio rápido de 4 pasos (puente al paso 5) esculpido en agudos brillantes por el banco de octavas Filtro-O.',
      en: 'Fast 4-step arpeggio (step-5 reset jumper) sculpted into crystalline highs by the O-Filter bank.',
    },
    cables: [
      ['pulsador.pulsos', 'secuenciador.pulso'],
      ['secuenciador.st4', 'secuenciador.reinicio'],
      ['secuenciador.pulsoSal', 'integrador.pulso'],
      ['secuenciador.a', 'osc1.frec'],
      ['osc1.tri', 'filtroo.entrada'],
      ['filtroo.suma', 'envolvedor.entrada'],
      ['integrador.sal', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
      ['envolvedor.s2', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      pulsador: { reloj: 9.0, ancho: 0.3 },
      secuenciador: {
        ...rowA([0, 4, 7, 12, 0, 0, 0, 0, 0, 0]),
        ...switches([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      },
      osc1: { frecuencia: 329.63 },
      filtroo: {
        corte: 0.95,
        g0: 0.05, g1: 0.1, g2: 0.15, g3: 0.3, g4: 0.55,
        g5: 0.8, g6: 0.95, g7: 0.9, g8: 0.85, g9: 0.7,
        suma: 0.82,
      },
      integrador: { ataque: 0.005, modo: 0, duracion: 0.02, decaimiento: 0.14 },
      envolvedor: { nivel: 0, mod: 0.95 },
      reverberal: { intensidad: 0.55, tiempo: 0.8 },
      salida: { volumen: 0.64 },
    },
  },

  // ── 19. Gamelán Anular
  {
    id: 'gamelan-anular',
    category: 'perc',
    name: { es: '19 · Gamelán Anular', en: '19 · Ring Gamelan' },
    description: {
      es: 'Metalófono inarmónico de 5 pasos mediante modulación en anillo con decaimiento largo y reverberación metálica.',
      en: 'Inharmonic 5-step metallophone via ring modulation with long decay and metallic reverb.',
    },
    cables: [
      ['pulsador.pulsos', 'secuenciador.pulso'],
      ['secuenciador.st5', 'secuenciador.reinicio'],
      ['secuenciador.pulsoSal', 'integrador.pulso'],
      ['secuenciador.a', 'osc1.frec'],
      ['osc1.sen', 'anillo.a'],
      ['osc2.sen', 'anillo.b'],
      ['anillo.sal', 'envolvedor.entrada'],
      ['integrador.sal', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
      ['envolvedor.s2', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      pulsador: { reloj: 3.1, ancho: 0.25 },
      secuenciador: {
        ...rowA([0, 2, 7, 9, 12, 0, 0, 0, 0, 0]),
        ...switches([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      },
      osc1: { frecuencia: 293.66 },
      osc2: { frecuencia: 711.0 },
      anillo: { nivel: 0.9 },
      integrador: { ataque: 0.005, modo: 0, duracion: 0.02, decaimiento: 0.72 },
      envolvedor: { nivel: 0, mod: 0.92 },
      reverberal: { intensidad: 0.62, tiempo: 0.86 },
      salida: { volumen: 0.62 },
    },
  },

  // ── 20. Marimba Madera
  {
    id: 'marimba-madera',
    category: 'perc',
    name: { es: '20 · Marimba Madera', en: '20 · Wood Marimba' },
    description: {
      es: 'Pulsaciones cálidas de madera en 8 pasos usando onda triangular filtrada en pasa-banda y envolvente corta.',
      en: 'Warm woody 8-step plucks using bandpass-filtered triangle wave and snappy decay envelope.',
    },
    cables: [
      ['pulsador.pulsos', 'secuenciador.pulso'],
      ['secuenciador.st8', 'secuenciador.reinicio'],
      ['secuenciador.pulsoSal', 'integrador.pulso'],
      ['secuenciador.a', 'osc1.frec'],
      ['secuenciador.a', 'filtrov.control'],
      ['osc1.tri', 'filtrov.entrada'],
      ['filtrov.banda', 'envolvedor.entrada'],
      ['integrador.sal', 'envolvedor.control'],
      ['envolvedor.s1', 'salida.izq'],
      ['envolvedor.s2', 'reverberal.e1'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      pulsador: { reloj: 5.5, ancho: 0.25 },
      secuenciador: {
        ...rowA([0, 5, 7, 12, 9, 7, 5, 2, 0, 0]),
        ...switches([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      },
      osc1: { frecuencia: 261.63 },
      filtrov: { centro: 520, ancho: 0.22, modulacion: 0 },
      integrador: { ataque: 0.005, modo: 0, duracion: 0.015, decaimiento: 0.13 },
      envolvedor: { nivel: 0, mod: 0.96 },
      reverberal: { intensidad: 0.3, tiempo: 0.55 },
      salida: { volumen: 0.68 },
    },
  },

  // ── 21. Pulso Industrial
  {
    id: 'pulso-industrial',
    category: 'perc',
    name: { es: '21 · Pulso Industrial', en: '21 · Industrial Pulse' },
    description: {
      es: 'Patrón agresivo de 10 pasos combinando modulación anular grave con ráfagas de ruido blanco en pasa-altos.',
      en: 'Aggressive 10-step pattern combining low ring modulation with high-pass white noise bursts.',
    },
    cables: [
      ['pulsador.pulsos', 'secuenciador.pulso'],
      ['secuenciador.pulsoSal', 'integrador.pulso'],
      ['osc1.cuad', 'anillo.a'],
      ['osc2.rampa', 'anillo.b'],
      ['anillo.sal', 'envolvedor.entrada'],
      ['integrador.sal', 'envolvedor.control'],
      ['ruidor.blanco', 'filtrov.entrada'],
      ['secuenciador.b', 'filtrov.mod'],
      ['filtrov.altos', 'reverberal.e2'],
      ['envolvedor.s1', 'salida.izq'],
      ['reverberal.sal', 'salida.der'],
    ],
    values: {
      pulsador: { reloj: 7.4, ancho: 0.3 },
      secuenciador: {
        ...rowB([0.9, 0.1, 0.7, 0.2, 0.85, 0.15, 0.95, 0.3, 0.6, 0.2]),
        ...switches([1, 0, 1, 1, 1, 0, 1, 0, 1, 1]),
      },
      osc1: { frecuencia: 73.42, ancho: 0.35 },
      osc2: { frecuencia: 117.0 },
      anillo: { nivel: 0.92 },
      filtrov: { centro: 1800, ancho: 0.32, modulacion: 2.5 },
      integrador: { ataque: 0.005, modo: 0, duracion: 0.02, decaimiento: 0.1 },
      envolvedor: { nivel: 0, mod: 0.95 },
      reverberal: { intensidad: 0.35, tiempo: 0.48 },
      salida: { volumen: 0.62 },
    },
  },

  // ── 22. Coro Abierto (A-O)
  {
    id: 'coro-abierto',
    category: 'exp',
    name: { es: '22 · Coro Abierto', en: '22 · Open Choir' },
    description: {
      es: 'Drone vocal polifónico de formantes A-O modulados lentamente por la salida suave del Aleator.',
      en: 'Vocal A-O formant drone slowly modulated by the smooth output of the Aleator.',
    },
    cables: [
      ['aleator.suave', 'filtrov.mod'],
      ['osc1.rampa', 'filtroo.entrada'],
      ['filtroo.suma', 'filtrov.entrada'],
      ['filtrov.bajos', 'reverberal.e1'],
      ['ruidor.rosa', 'reverberal.e2'],
      ['reverberal.sal', 'salida.izq'],
      ['reverberal.sal2', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 110.0 },
      filtroo: {
        corte: 0.88,
        g0: 0.15, g1: 0.3, g2: 0.65, g3: 0.95, g4: 0.4,
        g5: 0.9, g6: 0.25, g7: 0.7, g8: 0.15, g9: 0.1,
        suma: 0.85,
      },
      filtrov: { centro: 900, ancho: 0.35, modulacion: 1.4 },
      reverberal: { intensidad: 0.72, tiempo: 0.9 },
      salida: { volumen: 0.58 },
    },
  },

  // ── 23. Viento Estelar
  {
    id: 'viento-estelar',
    category: 'exp',
    name: { es: '23 · Viento Estelar', en: '23 · Solar Wind' },
    description: {
      es: 'Paisaje atmosférico puro de ruido rosa y blanco esculpido en oleadas lentas por el Integrador en modo interno.',
      en: 'Pure atmospheric landscape of pink and white noise sculpted in slow waves by the self-cycling Integrator.',
    },
    cables: [
      ['ruidor.rosa', 'filtrov.entrada'],
      ['integrador.sal', 'filtrov.mod'],
      ['filtrov.banda', 'reverberal.e1'],
      ['ruidor.blanco', 'filtroo.entrada'],
      ['filtroo.suma', 'reverberal.e2'],
      ['reverberal.sal', 'salida.izq'],
      ['reverberal.sal2', 'salida.der'],
    ],
    values: {
      integrador: { ataque: 2.8, modo: 1, duracion: 1.0, decaimiento: 3.4 },
      filtrov: { centro: 260, ancho: 0.14, modulacion: 3.2 },
      filtroo: {
        corte: 0.7,
        g0: 0.2, g1: 0.35, g2: 0.5, g3: 0.3, g4: 0.6,
        g5: 0.2, g6: 0.45, g7: 0.15, g8: 0.3, g9: 0.1,
        suma: 0.4,
      },
      reverberal: { intensidad: 0.76, tiempo: 0.92 },
      salida: { volumen: 0.6 },
    },
  },

  // ── 24. Lluvia Electrónica
  {
    id: 'lluvia-electronica',
    category: 'exp',
    name: { es: '24 · Lluvia Electrónica', en: '24 · Electronic Rain' },
    description: {
      es: 'Gotas generativas de alta resonancia disparadas por el Aleator rápido sobre el Filtro-V autooscilante.',
      en: 'High-resonance generative droplets triggered by fast Aleator voltages pinging a self-oscillating V-Filter.',
    },
    cables: [
      ['pulsador.pulsos', 'aleator.pulso'],
      ['pulsador.pulsos2', 'integrador.pulso'],
      ['aleator.esc', 'filtrov.control'],
      ['ruidor.blanco', 'filtrov.entrada'],
      ['filtrov.banda', 'envolvedor.entrada'],
      ['integrador.sal', 'envolvedor.control'],
      ['envolvedor.s1', 'reverberal.e1'],
      ['reverberal.sal', 'salida.izq'],
      ['reverberal.sal2', 'salida.der'],
    ],
    values: {
      pulsador: { reloj: 11.5, ancho: 0.15 },
      filtrov: { centro: 1400, ancho: 0.06, modulacion: 0 },
      integrador: { ataque: 0.005, modo: 0, duracion: 0.01, decaimiento: 0.09 },
      envolvedor: { nivel: 0, mod: 0.95 },
      reverberal: { intensidad: 0.66, tiempo: 0.84 },
      salida: { volumen: 0.64 },
    },
  },

  // ── 25. Caos FM
  {
    id: 'caos-fm',
    category: 'exp',
    name: { es: '25 · Caos FM', en: '25 · FM Chaos' },
    description: {
      es: 'Modulación cruzada extrema entre ambos osciladores con acoplamiento rectificado (rec.) y barrido aleatorio.',
      en: 'Extreme cross-modulation between both oscillators with rectified FM coupling (rec.) and random sweeps.',
    },
    cables: [
      ['osc2.rampa', 'osc1.mod'],
      ['osc1.cuad', 'osc2.mod'],
      ['aleator.suave', 'osc2.frec'],
      ['osc1.sen', 'filtrov.entrada'],
      ['integrador.sal', 'filtrov.mod'],
      ['filtrov.banda', 'reverberal.e1'],
      ['reverberal.sal', 'salida.izq'],
      ['reverberal.sal2', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 185.0, modulador: 0.68, modoMod: 1 },
      osc2: { frecuencia: 43.0, modulador: 0.42, modoMod: 1 },
      integrador: { ataque: 0.8, modo: 1, duracion: 0.4, decaimiento: 1.2 },
      filtrov: { centro: 680, ancho: 0.2, modulacion: 2.8 },
      reverberal: { intensidad: 0.58, tiempo: 0.82 },
      salida: { volumen: 0.58 },
    },
  },
];

export const toCables = (p: Patch): Cable[] => p.cables.map(([from, to]) => ({ from, to }));
