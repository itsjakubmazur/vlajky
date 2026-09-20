import type { Country } from '../types';
import { createRng, shuffle } from '../rng';

/**
 * Kolik otázek má rozřazovací test.
 *
 * Dřív šel přes všech 197 vlajek v dávkách po dvaceti – deset sezení, než
 * se vůbec dalo začít hrát. Vzorek napříč obtížnostmi řekne skoro totéž
 * za jedno sezení: co dítě umí v pásmu, umí nejspíš i ve zbytku pásma.
 */
export const PLACEMENT_LENGTH = 24;

/** Nejmíň otázek na jedno pásmo obtížnosti, ať je odhad o co opřít. */
const MIN_PER_BAND = 3;

/** Pevné semínko: plán musí vyjít stejně i po přerušení testu. */
const PLACEMENT_SEED = 0x51a6;

export interface BandStat {
  /** Obtížnost 1–5. */
  band: number;
  /** Kolik vlajek v pásmu je celkem. */
  size: number;
  /** Kolik se jich v testu zeptalo. */
  asked: number;
  correct: number;
}

/** Výsledky rozřazovacího testu: kód vlajky → byla odpověď správná. */
export type PlacementResults = Record<string, boolean>;

function bands(pool: readonly Country[]): Map<number, Country[]> {
  const map = new Map<number, Country[]>();
  for (const country of pool) {
    const list = map.get(country.difficulty);
    if (list) list.push(country);
    else map.set(country.difficulty, [country]);
  }
  return map;
}

/**
 * Vzorek do rozřazovacího testu: z každého pásma obtížnosti pár vlajek,
 * počet podle velikosti pásma. Od nejsnazších, aby dítě nezačalo Tuvalu.
 */
export function placementPlan(
  pool: readonly Country[],
  length = PLACEMENT_LENGTH,
): string[] {
  const byBand = bands(pool);
  if (byBand.size === 0) return [];

  const rng = createRng(PLACEMENT_SEED);
  const ordered = [...byBand.entries()].sort(([a], [b]) => a - b);
  const total = pool.length;

  const picked: string[] = [];
  for (const [, list] of ordered) {
    const share = Math.round((list.length / total) * length);
    const take = Math.min(list.length, Math.max(MIN_PER_BAND, share));
    for (const country of shuffle(list, rng).slice(0, take)) {
      picked.push(country.code);
    }
  }
  return picked;
}

/** Sečte, jak test dopadl v jednotlivých pásmech obtížnosti. */
export function bandStats(
  pool: readonly Country[],
  results: PlacementResults,
): BandStat[] {
  const byBand = bands(pool);
  return [...byBand.entries()]
    .sort(([a], [b]) => a - b)
    .map(([band, list]) => {
      let asked = 0;
      let correct = 0;
      for (const country of list) {
        const result = results[country.code];
        if (result === undefined) continue;
        asked += 1;
        if (result) correct += 1;
      }
      return { band, size: list.length, asked, correct };
    });
}

/**
 * Úspěšnost v pásmu, 0–1. Pásmo, na které se test nezeptal, chybí –
 * dosazovat za něj číslo by znamenalo vymýšlet si.
 */
export function bandSkill(stats: readonly BandStat[]): Record<number, number> {
  const map: Record<number, number> = {};
  for (const stat of stats) {
    if (stat.asked > 0) map[stat.band] = stat.correct / stat.asked;
  }
  return map;
}

/**
 * Odhad, kolik vlajek ze sady dítě umí: v každém pásmu se úspěšnost
 * vzorku promítne na celé pásmo. Je to odhad, ne tvrzení – vlajky se
 * stejně všechny znovu ptají, jen v jiném pořadí.
 */
export function estimateKnown(stats: readonly BandStat[]): number {
  let known = 0;
  for (const stat of stats) {
    if (stat.asked === 0) continue;
    known += (stat.correct / stat.asked) * stat.size;
  }
  return Math.round(known);
}
