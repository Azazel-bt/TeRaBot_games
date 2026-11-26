export type ArmHand = 'left' | 'right';

export interface ArmPowerDef {
  hand: ArmHand;
  name: string;
  elementLabel: string;
  keyHint: string;
  cvHint: string;
  description: string;
  color: string;
  hex: number;
  baseDamage: number;
  projectileSpeed: number;
  powerGain: number;
}

export interface BoxingComboDef {
  id: 'one_two' | 'demolisher' | 'shield_breaker' | 'champion_flurry';
  name: string;
  subtitle: string;
  sequence: ArmHand[];
  description: string;
  breaksObstacles: boolean;
  shattersShield: boolean;
  multiLane: boolean;
  damage: number;
  powerCharge: number;
  bonusScore: number;
  color: string;
  hex: number;
}

export const POWER_METER_MAX = 1000;

export const ARM_POWERS: Record<ArmHand, ArmPowerDef> = {
  left: {
    hand: 'left',
    name: 'Bola de Nieve Crio',
    elementLabel: 'Brazo Izquierdo · Ataque de Nieve',
    keyHint: 'K / Q',
    cvHint: 'Lanza tu brazo izquierdo hacia la cámara',
    description:
      'Lanza Bolas de Nieve heladas que frenan al Jefe 2s y derriten al Monstruo de Fuego (+5 Poder).',
    color: '#38bdf8',
    hex: 0x38bdf8,
    baseDamage: 1,
    projectileSpeed: 86,
    powerGain: 5,
  },
  right: {
    hand: 'right',
    name: 'Bola de Fuego Solar',
    elementLabel: 'Brazo Derecho · Ataque de Fuego',
    keyHint: 'J / E / Enter',
    cvHint: 'Lanza tu brazo derecho hacia la cámara',
    description:
      'Lanza Bolas de Fuego explosivas de doble daño base que derriten al Monstruo de Nieve (+8 Poder).',
    color: '#f97316',
    hex: 0xf97316,
    baseDamage: 2,
    projectileSpeed: 74,
    powerGain: 8,
  },
};

export const BOXING_COMBOS: BoxingComboDef[] = [
  {
    id: 'one_two',
    name: '1-2 Clásico',
    subtitle: 'Jab + Recto',
    sequence: ['left', 'right'],
    description:
      'Golpe combinado rápido (3 daño). Rompe la Furia Mutante y carga +35 Poder.',
    breaksObstacles: false,
    shattersShield: false,
    multiLane: false,
    damage: 3,
    powerCharge: 35,
    bonusScore: 250,
    color: '#facc15',
    hex: 0xfacc15,
  },
  {
    id: 'demolisher',
    name: 'Demoledor Rompe-Muros',
    subtitle: 'Doble Jab + Gancho Derecho',
    sequence: ['left', 'left', 'right'],
    description:
      'Lanza una Onda Demoledora que DESTRUYE obstáculos y trenes en tu carril (+65 Poder).',
    breaksObstacles: true,
    shattersShield: false,
    multiLane: false,
    damage: 4,
    powerCharge: 65,
    bonusScore: 420,
    color: '#38bdf8',
    hex: 0x38bdf8,
  },
  {
    id: 'shield_breaker',
    name: 'Martillo Rompe-Escudos',
    subtitle: 'Doble Derechazo + Gancho Izq.',
    sequence: ['right', 'right', 'left'],
    description:
      'Destroza escudos de Jefes al instante y pulveriza obstáculos cercanos (+75 Poder).',
    breaksObstacles: true,
    shattersShield: true,
    multiLane: false,
    damage: 4,
    powerCharge: 75,
    bonusScore: 460,
    color: '#fb7185',
    hex: 0xfb7185,
  },
  {
    id: 'champion_flurry',
    name: 'Ráfaga Campeón',
    subtitle: 'Cuatro Golpes Alternados',
    sequence: ['left', 'right', 'left', 'right'],
    description:
      '¡Onda total en los 3 carriles! Rompe todos los obstáculos, quita escudos y hace 6 daño (+120 Poder).',
    breaksObstacles: true,
    shattersShield: true,
    multiLane: true,
    damage: 6,
    powerCharge: 120,
    bonusScore: 700,
    color: '#4ade80',
    hex: 0x4ade80,
  },
];

export const OVERDRIVE_CONFIG = {
  durationSec: 10.0,
  damageMultiplier: 10,
  title: 'PODER SUPREMO x10',
  description:
    'Inmortal contra todo choque, rompe cualquier obstáculo al correr o golpear y multiplica tu daño x10 contra Jefes (1,000 Poder).',
};

/**
 * Matches boxing combos deterministically:
 * - 4-hit and 3-hit combos match exact suffix and reset the sequence buffer.
 * - 2-hit '1-2 Clásico' (L -> R) only matches when the chain explicitly starts with L -> R,
 *   preserving the buffer so extending with L -> R can complete the 4-hit 'Ráfaga Campeón'.
 */
export function matchBoxingCombo(history: ArmHand[]): {
  combo: BoxingComboDef | null;
  shouldResetBuffer: boolean;
} {
  const ordered = [...BOXING_COMBOS].sort((a, b) => b.sequence.length - a.sequence.length);
  for (const combo of ordered) {
    const len = combo.sequence.length;
    if (len === 2) {
      if (
        history.length === 2 &&
        history[0] === combo.sequence[0] &&
        history[1] === combo.sequence[1]
      ) {
        return { combo, shouldResetBuffer: false };
      }
      continue;
    }
    if (history.length >= len) {
      const tail = history.slice(history.length - len);
      const matches = tail.every((hand, i) => hand === combo.sequence[i]);
      if (matches) {
        return {
          combo,
          shouldResetBuffer: true,
        };
      }
    }
  }
  return { combo: null, shouldResetBuffer: false };
}
