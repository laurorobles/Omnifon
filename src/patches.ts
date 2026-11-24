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
      es: 'Recreación del ejemplo de alambrado del libro de Raúl Pavón (1981): puente de 5 pasos en el secuenciador, modulación anular por el banco de octavas y ruido rosa con filtrado programado.',
      en: 'Recreation of Raúl Pavón’s 1981 book patch (Fig. IV.38): 5-step sequencer jumper, ring-modulated voice through the octave bank, and programmed bandpass pink noise.',
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
      },
      osc1: { frecuencia: 196, modulador: 0.12, ancho: 0.5 },
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
      ['integrador.sal2', 'filtrov.mod'],
      ['envolvedor.s1', 'salida.izq'],
    ],
    values: {
      osc1: { frecuencia: 261.63, modulador: 0 },
      filtrov: { centro: 480, corte: 0, ancho: 0.38, modulacion: 2.8 },
      integrador: { ataque: 0.006, modo: 0, duracion: 0.08, decaimiento: 0.38 },
      envolvedor: { nivel: 0, mod: 0.95 },
      salida: { volumen: 0.65 },
    },
  },
  {
    id: 'secuencia',
    name: { es: 'Secuencia', en: 'Sequence' },
    description: {
      es: 'Arpegio de 8 pasos con puente al paso 9, filtro modulado y reverberación.',
      en: '8-step arpeggio using step-9 reset jumper, modulated filter, and reverb.',
    },
    cables: [
      ['pulsador.pulsos', 'secuenciador.pulso'],
      ['secuenciador.st8', 'secuenciador.reinicio'],
      ['secuenciador.a', 'osc1.frec'],
      ['osc1.cuad', 'filtrov.entrada'],
      ['secuenciador.pulsoSal', 'integrador.pulso'],
      ['integrador.sal', 'envolvedor.control'],
      ['integrador.sal2', 'filtrov.mod'],
      ['aleator.suave', 'filtrov.control'],
      ['filtrov.bajos', 'envolvedor.entrada'],
      ['envolvedor.s1', 'reverberal.e1'],
      ['reverberal.sal', 'salida.izq'],
    ],
    values: {
      osc1: { frecuencia: 130.81, ancho: 0.32 },
      pulsador: { reloj: 6, ancho: 0.4 },
      secuenciador: { ...rowA([0, 7, 12, 3, 10, 7, 15, 5, 0, 12]) },
      filtrov: { centro: 650, corte: 0, ancho: 0.3, modulacion: 2.5 },
      integrador: { ataque: 0.005, modo: 0, duracion: 0.04, decaimiento: 0.14 },
      reverberal: { intensidad: 0.32, tiempo: 0.6 },
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
      osc2: { frecuencia: 5.5 },
      anillo: { nivel: 0.7 },
      reverberal: { intensidad: 0.62, tiempo: 0.88 },
      filtroo: { corte: 0.75, g0: 0, g1: 0.1, g2: 0.2, g3: 0.1, g4: 0, g5: 0.6, g6: 0, g7: 0.4, g8: 0, g9: 0.2, suma: 0.55 },
      salida: { volumen: 0.55 },
    },
  },
  {
    id: 'vacio',
    name: { es: 'Vacío', en: 'Empty' },
    description: {
      es: 'Sin cables: arma tu propio parche desde cero tal como aparece en el gabinete limpio.',
      en: 'Unpatched cabinet: build your own patch from scratch.',
    },
    cables: [],
    values: {},
  },
];

export const toCables = (p: Patch): Cable[] => p.cables.map(([from, to]) => ({ from, to }));
