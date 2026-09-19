import type { Difficulty } from '../types';

/**
 * Bodování.
 *
 * Osmiletý tester zná skoro všechny vlajky, takže „uhodl jsem to“ pro něj
 * není výzva. Napětí musí přinést rychlost a série – teprve tím se ze
 * znalosti stane dovednost.
 */

/** Hranice rychlosti v milisekundách. */
export const SPEED_MS = {
  flash: 1500,
  fast: 3000,
  normal: 6000,
};

export type Speed = 'flash' | 'fast' | 'normal' | 'slow';

export function speedOf(elapsedMs: number): Speed {
  if (elapsedMs < SPEED_MS.flash) return 'flash';
  if (elapsedMs < SPEED_MS.fast) return 'fast';
  if (elapsedMs < SPEED_MS.normal) return 'normal';
  return 'slow';
}

export const SPEED_MULTIPLIER: Record<Speed, number> = {
  flash: 3,
  fast: 2,
  normal: 1,
  slow: 1,
};

/**
 * Násobič za sérii. Roste pomalu, aby na osmém komba za sebou byla radost,
 * ale nedal se uhrát jediným šťastným během.
 */
export const COMBO_LADDER = [1, 1, 1.2, 1.5, 2, 2.5, 3];

export function comboMultiplier(combo: number): number {
  if (combo <= 0) return 0;
  return COMBO_LADDER[Math.min(combo, COMBO_LADDER.length - 1)] ?? 1;
}

/** Kolik správných odpovědí v řadě je ještě potřeba k dalšímu stupni. */
export function nextComboStep(combo: number): number | null {
  return combo >= COMBO_LADDER.length - 1 ? null : combo + 1;
}

export const BASE_POINTS = 100;

/** Vlajka, kterou plánovač zrovna chce procvičit, vynáší víc. */
export const DUE_BONUS = 1.25;

export interface PointsInput {
  correct: boolean;
  elapsedMs: number;
  /** Série SPRÁVNÝCH odpovědí PŘED touhle odpovědí. */
  combo: number;
  /** Je karta po termínu podle plánovače? */
  isDue?: boolean;
  difficulty?: Difficulty;
  /** Sázka v režimu Vabank (1 = bez sázky). */
  stake?: number;
}

/**
 * Body za jednu odpověď.
 *
 * Bonus za kartu po termínu je schválně: zábava a učení pak táhnou stejným
 * směrem místo aby si konkurovaly.
 */
export function pointsFor({
  correct,
  elapsedMs,
  combo,
  isDue = false,
  difficulty = 3,
  stake = 1,
}: PointsInput): number {
  if (!correct) return 0;
  const speed = SPEED_MULTIPLIER[speedOf(elapsedMs)];
  const chain = comboMultiplier(combo + 1);
  const due = isDue ? DUE_BONUS : 1;
  const hard = 1 + (difficulty - 1) * 0.1;
  return Math.round(BASE_POINTS * speed * chain * due * hard * stake);
}

/** Kolik bodů se ztratí při prohrané sázce. */
export function stakeLoss(stake: number): number {
  return stake <= 1 ? 0 : Math.round(BASE_POINTS * (stake - 1));
}

export interface RoundTally {
  points: number;
  correct: number;
  total: number;
  bestCombo: number;
  flashCount: number;
  elapsedMs: number;
}
