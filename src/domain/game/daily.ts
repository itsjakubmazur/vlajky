import type { Country } from '../types';
import { createRng, seedFromString, shuffle } from '../rng';

/**
 * Denní výzva.
 *
 * Všichni dostanou v daný den stejné vlajky – klíčem je datum, takže to
 * funguje bez jakéhokoli serveru. Výsledek se dá poslat tátovi a ten si
 * zahraje přesně to samé.
 */
export const DAILY_COUNT = 10;

export function dailyCodes(
  dayKey: string,
  pool: readonly Country[],
  count = DAILY_COUNT,
): string[] {
  const rng = createRng(seedFromString(`vlajky-${dayKey}`));
  // Mix obtížností, ať to není deset Tuval za sebou.
  const easy = pool.filter((c) => c.difficulty <= 2);
  const medium = pool.filter((c) => c.difficulty === 3);
  const hard = pool.filter((c) => c.difficulty >= 4);

  const take = (list: readonly Country[], n: number) =>
    shuffle(list, rng)
      .slice(0, n)
      .map((c) => c.code);

  const picked = [
    ...take(easy, Math.round(count * 0.3)),
    ...take(medium, Math.round(count * 0.3)),
    ...take(hard, count - Math.round(count * 0.3) * 2),
  ];

  // Doplnění, kdyby některá skupina byla malá.
  if (picked.length < count) {
    for (const c of shuffle(pool, rng)) {
      if (picked.length >= count) break;
      if (!picked.includes(c.code)) picked.push(c.code);
    }
  }

  return shuffle(picked.slice(0, count), rng);
}

export interface DailyResult {
  dayKey: string;
  correct: number;
  total: number;
  bestCombo: number;
  elapsedMs: number;
  points: number;
}

/** Text ke sdílení – bez odkazů a bez prozrazení odpovědí. */
export function shareText(result: DailyResult, appName: string): string {
  const [year, month, day] = result.dayKey.split('-');
  const date = `${Number(day)}. ${Number(month)}. ${year}`;
  const seconds = Math.round(result.elapsedMs / 1000);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const bolts = '⚡'.repeat(Math.min(5, Math.max(1, Math.round(result.bestCombo / 2))));
  return `${appName} ${date} — ${result.correct}/${result.total}, kombo ${result.bestCombo}, ${time} ${bolts}`;
}
