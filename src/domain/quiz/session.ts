import type { Country } from '../types';
import type { CardState } from '../srs/types';
import { dailyBatch, isDue, isNew } from '../srs/scheduler';
import { shuffle, type Rng } from '../rng';
import { twinnableCountries, type QuizModeId } from './modes';

export const SESSION_LENGTH = 12;

export interface SessionOptions {
  mode: QuizModeId;
  pool: readonly Country[];
  cards: Record<string, CardState>;
  now: Date;
  rng: Rng;
  length?: number;
}

/**
 * Vybere vlajky do jedné hry.
 *
 * Pořadí priorit: co je po termínu → co dítě ještě nevidělo → co umí nejhůř.
 * Cíl je, aby se ve hře co nejčastěji potkávalo s tím, co se zrovna učí,
 * a ne pořád dokola s tím, co dávno umí.
 */
export function buildSession({
  mode,
  pool,
  cards,
  now,
  rng,
  length = SESSION_LENGTH,
}: SessionOptions): string[] {
  const candidates = mode === 'twins' ? twinnableCountries(pool) : [...pool];

  if (mode === 'review') {
    return dailyBatch(
      Object.values(cards),
      candidates.map((c) => c.code),
      now,
      (code) => candidates.find((c) => c.code === code)?.difficulty ?? 3,
    );
  }

  const due: string[] = [];
  const fresh: string[] = [];
  const known: string[] = [];

  for (const country of shuffle(candidates, rng)) {
    const card = cards[country.code];
    if (isNew(card)) fresh.push(country.code);
    else if (isDue(card!, now)) due.push(country.code);
    else known.push(country.code);
  }

  // Trocha už zvládnutých vlajek v každé hře je schválně – dítě potřebuje
  // i pocit, že mu to jde, ne jen samé nové.
  const rewardCount = Math.min(2, known.length);
  const selected = [
    ...due.slice(0, length),
    ...fresh.slice(0, Math.max(0, length - due.length - rewardCount)),
    ...known.slice(0, rewardCount),
  ];

  if (selected.length < length) {
    for (const code of [...due, ...fresh, ...known]) {
      if (selected.length >= length) break;
      if (!selected.includes(code)) selected.push(code);
    }
  }

  return shuffle(selected.slice(0, length), rng);
}

/**
 * Rozřazovací test jde přes všechny vlajky v pevném pořadí od nejznámějších,
 * aby dítě nezačalo Tuvalu. Pořadí je stabilní, takže po pauze lze navázat.
 */
export function placementOrder(pool: readonly Country[]): string[] {
  return [...pool]
    .sort((a, b) => {
      if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
      return a.code.localeCompare(b.code);
    })
    .map((c) => c.code);
}
