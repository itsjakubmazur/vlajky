import type { CardState } from '../srs/types';

/** Kolik dní zpátky se přehled drží. */
export const HISTORY_DAYS = 120;

/** Stav sbírky na konci jednoho dne. */
export interface DaySnapshot {
  /** Kolik vlajek má aspoň bronz. */
  collected: number;
  /** Kolik jich je ve zlatě. */
  gold: number;
}

export type History = Record<string, DaySnapshot>;

/** Spočítá dnešní stav sbírky ze všech karet v sadě. */
export function snapshotOf(
  cards: Record<string, CardState>,
  codesInSet: readonly string[],
): DaySnapshot {
  let collected = 0;
  let gold = 0;
  for (const code of codesInSet) {
    const card = cards[code];
    if (!card || card.mastery === 'new') continue;
    collected += 1;
    if (card.mastery === 'gold') gold += 1;
  }
  return { collected, gold };
}

/** Zapíše dnešek a zahodí, co je starší než `HISTORY_DAYS`. */
export function withSnapshot(
  history: History,
  day: string,
  snapshot: DaySnapshot,
  days = HISTORY_DAYS,
): History {
  const next: History = { ...history, [day]: snapshot };
  const keys = Object.keys(next).sort();
  if (keys.length <= days) return next;
  for (const key of keys.slice(0, keys.length - days)) delete next[key];
  return next;
}

export interface SeriesPoint {
  day: string;
  collected: number;
  gold: number;
  /** Den, ve kterém se nehrálo – hodnota je přenesená z minula. */
  carried: boolean;
}

/**
 * Řada pro graf: pro každý den v okně jedna hodnota.
 *
 * Ve dnech, kdy se nehrálo, se poslední známý stav přenese dopředu –
 * sbírka se sama nezmenšuje, takže díra v grafu by lhala. Dny před úplně
 * prvním záznamem se vynechají, aby graf nezačínal falešnou nulou.
 */
export function series(history: History, today: string, days: number): SeriesPoint[] {
  const known = Object.keys(history).sort();
  if (known.length === 0) return [];

  const end = new Date(`${today}T00:00:00Z`);
  const out: SeriesPoint[] = [];
  let last: DaySnapshot | null = null;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(end.getTime() - i * 86_400_000);
    const day = date.toISOString().slice(0, 10);
    const found = history[day];
    if (found) last = found;
    if (!last) continue;
    out.push({ day, collected: last.collected, gold: last.gold, carried: !found });
  }
  return out;
}
