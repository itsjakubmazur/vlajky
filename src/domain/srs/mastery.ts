import type { CardState, Mastery } from './types';

/**
 * Úroveň zvládnutí vlajky.
 *
 * Zlato se schválně nedá „proklikat“ ze čtyř možností – aspoň jednou musí
 * dítě název napsat. Stabilita je údaj z FSRS: přibližně počet dnů, po které
 * si to má pamatovat.
 */
export const MASTERY_RULES = {
  silverStability: 7,
  silverStreak: 3,
  goldStability: 30,
  goldCorrect: 4,
};

export function computeMastery(card: CardState): Mastery {
  const stability = card.fsrs.stability;

  if (card.seen === 0 || card.correct === 0) return 'new';

  if (
    stability >= MASTERY_RULES.goldStability &&
    card.correct >= MASTERY_RULES.goldCorrect &&
    card.typedCorrect >= 1
  ) {
    return 'gold';
  }

  if (card.streak >= MASTERY_RULES.silverStreak || stability >= MASTERY_RULES.silverStability) {
    return 'silver';
  }

  return 'bronze';
}

export function masteryRank(mastery: Mastery): number {
  switch (mastery) {
    case 'new':
      return 0;
    case 'bronze':
      return 1;
    case 'silver':
      return 2;
    case 'gold':
      return 3;
  }
}

/** Postoupila karta na vyšší úroveň? Kvůli oslavě po odpovědi. */
export function isLevelUp(before: Mastery, after: Mastery): boolean {
  return masteryRank(after) > masteryRank(before);
}
