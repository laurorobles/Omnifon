import type { Lang } from './i18n';
import type { Cable } from './rack';

export interface Patch {
  id: string;
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
];

export const toCables = (p: Patch): Cable[] => p.cables.map(([from, to]) => ({ from, to }));
