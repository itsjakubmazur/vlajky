import type { AnswerLog, CardState } from '../srs/types';
import type { Country } from '../types';
import { dayKey } from './day';
import type { MissionContext } from './missions';

/**
 * Co se stalo dnes. Mise se z toho počítají, takže to musí sedět na místní
 * den, ne na UTC – jinak by se o půlnoci resetovaly v jinou chvíli, než
 * hráč čeká.
 */
export function todayContext(
  log: readonly AnswerLog[],
  cards: Record<string, CardState>,
  countryOf: (code: string) => Country | undefined,
  now: Date,
): MissionContext {
  const today = dayKey(now);

  const entries = log.filter((e) => dayKey(new Date(e.at)) === today);

  let run = 0;
  let bestComboToday = 0;
  for (const entry of entries) {
    run = entry.correct ? run + 1 : 0;
    if (run > bestComboToday) bestComboToday = run;
  }

  const firstSeenToday = Object.values(cards)
    .filter((card) => card.firstSeenAt && dayKey(new Date(card.firstSeenAt)) === today)
    .map((card) => card.code);

  return { today: entries, bestComboToday, firstSeenToday, countryOf };
}
