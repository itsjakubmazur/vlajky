/**
 * Hodnosti. Jediná věc v aplikaci, která jde pořád dopředu – body se
 * nikdy neodečítají, takže je to bezpečný dlouhodobý cíl.
 */
export interface Rank {
  id: string;
  minPoints: number;
}

export const RANKS: readonly Rank[] = [
  { id: 'novacek', minPoints: 0 },
  { id: 'pruzkumnik', minPoints: 3_000 },
  { id: 'kartograf', minPoints: 12_000 },
  { id: 'velvyslanec', minPoints: 35_000 },
  { id: 'mistr', minPoints: 80_000 },
  { id: 'legenda', minPoints: 160_000 },
];

export type RankId = (typeof RANKS)[number]['id'];

export function rankFor(totalPoints: number): Rank {
  let current = RANKS[0]!;
  for (const rank of RANKS) {
    if (totalPoints >= rank.minPoints) current = rank;
  }
  return current;
}

export interface RankProgress {
  rank: Rank;
  next: Rank | null;
  /** 0–1 k další hodnosti; u nejvyšší vždy 1. */
  ratio: number;
  pointsToNext: number;
}

export function rankProgress(totalPoints: number): RankProgress {
  const rank = rankFor(totalPoints);
  const index = RANKS.findIndex((r) => r.id === rank.id);
  const next = RANKS[index + 1] ?? null;
  if (!next) return { rank, next: null, ratio: 1, pointsToNext: 0 };

  const span = next.minPoints - rank.minPoints;
  const done = totalPoints - rank.minPoints;
  return {
    rank,
    next,
    ratio: Math.max(0, Math.min(1, done / span)),
    pointsToNext: Math.max(0, next.minPoints - totalPoints),
  };
}
