import type { Country } from '../types';
import type { CardState } from '../srs/types';
import { dailyBatch, isDue, isNew } from '../srs/scheduler';
import { shuffle, type Rng } from '../rng';
import { twinnableCountries, type QuizModeId } from './modes';
import { dailyCodes } from '../game/daily';
import { bossById, BOSS_QUESTIONS } from '../game/bosses';

export const SESSION_LENGTH = 12;

export interface SessionOptions {
  mode: QuizModeId;
  pool: readonly Country[];
  cards: Record<string, CardState>;
  now: Date;
  rng: Rng;
  length?: number;
  /** Klíč dne pro denní výzvu. */
  dayKey?: string;
  /** Který souboj se hraje. */
  bossId?: string;
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
  dayKey,
  bossId,
}: SessionOptions): string[] {
  const candidates = mode === 'twins' ? twinnableCountries(pool) : [...pool];

  // Maraton jde přes celou sadu – od nejznámějších, ať se dá vůbec rozjet.
  if (mode === 'marathon') {
    return [...pool]
      .sort((a, b) => a.difficulty - b.difficulty || a.code.localeCompare(b.code))
      .map((c) => c.code);
  }

  if (mode === 'daily') {
    return dayKey ? dailyCodes(dayKey, pool) : [];
  }

  if (mode === 'boss') {
    const boss = bossId ? bossById(pool, bossId) : undefined;
    if (!boss) return [];
    // Pět otázek losovaných z členů skupiny; krátké skupiny se opakují.
    return Array.from(
      { length: BOSS_QUESTIONS },
      (_, i) => boss.codes[Math.floor(rng() * boss.codes.length)] ?? boss.codes[i % boss.codes.length]!,
    );
  }

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
