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

export const PATCHES: Patch[] = [
  {
    id: 'fig-iv-38',
    name: { es: 'Fig. IV.38', en: 'Fig. IV.38' },
    description: {
      es: 'Recreación del ejemplo de alambrado del libro de Raúl Pavón (1981): secuencia melódica con modulación anular + ruido rosa con filtrado programado.',
      en: 'Recreation of the book patch by Raúl Pavón (1981, Fig. IV.38): ring-modulated melodic sequence + programmed bandpass pink noise.',
    },
    cables: [
      ['pulsador.pulsos', 'integrador.pulso'],
      ['pulsador.pulsos2', 'secuenciador.pulso'],
      ['pulsador.inv', 'aleator.pulso'],
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
        pasos: 5,
        cuantizar: 1,
      },
      aleator: { velocidad: 3, nivel: 0.22 },
      osc1: { frecuencia: 196, modulador: 0.12, ancho: 0.5 },
      osc2: { frecuencia: 293.66, modulador: 0 },
      anillo: { portadora: 293.66, nivel: 0.75 },
      integrador: { ataque: 0.008, caida: 0.18, sosten: 0.25, extincion: 0.22 },
      envolvedor: { min: 0, max: 0.9 },
      ruidor: { nivel: 0.75 },
      filtrov: { centro: 520, ancho: 0.28, modulacion: 2.2 },
      filtroo: {
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
  {
    id: 'teclado',
    name: { es: 'Teclado', en: 'Keyboard' },
    description: {
      es: 'Cadena sustractiva clásica (1960–64) lista para tocar con el teclado de 5 octavas o MIDI.',
      en: 'Classic 1960s subtractive voice ready to play from the 5-octave keyboard or MIDI.',
    },
    cables: [
      ['teclado.volt', 'osc1.frec'],
      ['osc1.rampa', 'filtrov.entrada'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['teclado.pulso', 'integrador.pulso'],
      ['integrador.sal', 'envolvedor.control'],
      ['integrador.sal', 'filtrov.mod'],
      ['envolvedor.s1', 'salida.izq'],
    ],
    values: {
      osc1: { frecuencia: 261.63, modulador: 0 },
      filtrov: { centro: 500, ancho: 0.45, modulacion: 3 },
      integrador: { ataque: 0.005, caida: 0.4, sosten: 0.5, extincion: 0.4 },
      envolvedor: { min: 0, max: 0.95 },
      salida: { volumen: 0.6 },
    },
  },
  {
    id: 'secuencia',
    name: { es: 'Secuencia', en: 'Sequence' },
    description: {
      es: 'Arpegio de 8 pasos modulando tono y ancho de pulso, con filtro aleatorio y reverberación.',
      en: '8-step arpeggio modulating pitch and pulse width, with random filter drift and reverb.',
    },
    cables: [
      ['pulsador.pulsos', 'secuenciador.pulso'],
      ['secuenciador.a', 'osc1.frec'],
      ['secuenciador.b', 'osc1.ancho'],
      ['osc1.cuad', 'filtrov.entrada'],
      ['secuenciador.pulsoSal', 'integrador.pulso'],
      ['integrador.sal', 'envolvedor.control'],
      ['integrador.sal', 'filtrov.mod'],
      ['aleator.suave', 'filtrov.control'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['envolvedor.s1', 'reverberal.e1'],
      ['reverberal.sal', 'salida.izq'],
    ],
    values: {
      osc1: { frecuencia: 130.81 },
      pulsador: { reloj: 6, ancho: 0.4 },
      secuenciador: { ...rowA([0, 7, 12, 3, 10, 7, 15, 5, 0, 12]), pasos: 8, cuantizar: 1 },
      filtrov: { centro: 700, ancho: 0.35, modulacion: 2.5 },
      integrador: { ataque: 0.003, caida: 0.15, sosten: 0.15, extincion: 0.15 },
      aleator: { velocidad: 0.4, nivel: 0.6 },
      reverberal: { intensidad: 0.3, tiempo: 0.6 },
    },
  },
  {
    id: 'cosmico',
    name: { es: 'Cósmico', en: 'Cosmic' },
    description: {
      es: 'Paisaje electroacústico generativo: FM lenta, modulador anular y ruido rosa por el banco de octavas.',
      en: 'Generative electroacoustic drone: slow FM, ring modulation, and octave-filtered pink noise.',
    },
    cables: [
      ['osc2.sen', 'osc1.mod'],
      ['aleator.suave', 'osc1.frec'],
      ['osc1.sen', 'anillo.a'],
      ['anillo.sal', 'reverberal.e1'],
      ['reverberal.sal', 'salida.izq'],
      ['ruidor.rosa', 'filtroo.entrada'],
      ['filtroo.suma', 'salida.der'],
    ],
    values: {
      osc1: { frecuencia: 400, modulador: 0.25 },
      osc2: { frecuencia: 0.8 },
      aleator: { velocidad: 0.7, nivel: 0.8 },
      anillo: { portadora: 333, nivel: 0.7 },
      reverberal: { intensidad: 0.6, tiempo: 0.9 },
      ruidor: { nivel: 0.5 },
      filtroo: { g0: 0, g1: 0.1, g2: 0.2, g3: 0.1, g4: 0, g5: 0.6, g6: 0, g7: 0.4, g8: 0, g9: 0.2, suma: 0.6 },
      salida: { volumen: 0.5 },
    },
  },
  {
    id: 'vacio',
    name: { es: 'Vacío', en: 'Empty' },
    description: {
      es: 'Sin cables: arma tu propio parche desde cero.',
      en: 'Unpatched cabinet: build your own patch from scratch.',
    },
    cables: [],
    values: {},
  },
];

export const toCables = (p: Patch): Cable[] => p.cables.map(([from, to]) => ({ from, to }));
