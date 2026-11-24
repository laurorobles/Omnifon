import type { Cable } from './rack';

export interface Patch {
  name: string;
  description: string;
  cables: [string, string][];
  values: Record<string, Record<string, number>>;
}

const st = (semitones: number[]) =>
  Object.fromEntries(semitones.map((s, i) => [`s${i}`, s / 24]));

export const PATCHES: Patch[] = [
  {
    name: 'Prototipo',
    description: 'La cadena básica de 1960–64: teclado → oscilador → filtro → envolvedor.',
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
      filtrov: { centro: 500, ancho: 0.45, modulacion: 3 },
      integrador: { ataque: 0.005, caida: 0.4, sosten: 0.5, extincion: 0.4 },
    },
  },
  {
    name: 'Secuencia',
    description: 'Pulsador → secuenciador de 10 pasos, con filtro aleatorio y reverberación.',
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
      ['envolvedor.s1', 'reverberal.entrada'],
      ['reverberal.sal', 'salida.izq'],
    ],
    values: {
      osc1: { frecuencia: 130.81 },
      pulsador: { reloj: 6, ancho: 0.4 },
      secuenciador: { ...st([0, 7, 12, 3, 10, 7, 15, 5, 0, 12]), pasos: 8, cuantizar: 1 },
      filtrov: { centro: 700, ancho: 0.35, modulacion: 2.5 },
      integrador: { ataque: 0.003, caida: 0.15, sosten: 0.15, extincion: 0.15 },
      aleator: { velocidad: 0.4, nivel: 0.6 },
      reverberal: { intensidad: 0.3, tiempo: 0.6 },
    },
  },
  {
    name: 'Cósmico',
    description: 'Drone electroacústico: FM lenta, anillo, ruido rosa por el banco de octavas.',
    cables: [
      ['osc2.sen', 'osc1.mod'],
      ['aleator.suave', 'osc1.frec'],
      ['osc1.sen', 'anillo.a'],
      ['anillo.sal', 'reverberal.entrada'],
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
    name: 'Vacío',
    description: 'Sin cables: arma tu propio parche.',
    cables: [],
    values: {},
  },
];

export const toCables = (p: Patch): Cable[] => p.cables.map(([from, to]) => ({ from, to }));
