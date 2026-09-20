import { createEmptyCard, fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import type { Grade } from 'ts-fsrs';
import { TIMING, DAILY_REVIEW } from '@/config/app';
import { clampElapsed } from '../game/score';
import type { CardState, StoredCard } from './types';
import { fromStored, toStored } from './types';
import { computeMastery } from './mastery';

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

export interface AnswerInput {
  correct: boolean;
  elapsedMs: number;
  /** režim, ve kterém odpověď padla – „typing“ je jediná cesta ke zlatu */
  mode: string;
  /** rozřazovací test se chová jinak: neúspěch kartu nepohřbívá */
  isPlacement?: boolean;
  /**
   * Odpověď vznikla klepnutím na našeptávač.
   *
   * Taková odpověď je fakticky výběr ze seznamu, ne napsaný název – proto
   * se nepočítá do `typedCorrect` a nevede ke zlatu. Jinak by šlo pravidlo
   * „zlato nejde proklikat“ obejít.
   */
  assisted?: boolean;
}

/**
 * Mapování odpovědi na hodnocení FSRS.
 * Rychlá správná odpověď znamená, že to dítě opravdu umí – plánovač pak
 * kartu odloží dál a nebude ho otravovat tím, co zná.
 */
export function ratingFor({ correct, elapsedMs: raw, mode }: AnswerInput): Grade {
  if (!correct) return Rating.Again;
  const elapsedMs = clampElapsed(raw);
  if (elapsedMs > TIMING.slowMs) return Rating.Hard;
  if (elapsedMs < TIMING.fastMs || mode === 'typing') return Rating.Easy;
  return Rating.Good;
}

export function emptyCardState(code: string, now: Date): CardState {
  return {
    code,
    fsrs: toStored(createEmptyCard(now)),
    mastery: 'new',
    seen: 0,
    correct: 0,
    streak: 0,
    typedCorrect: 0,
    updatedAt: now.toISOString(),
  };
}

/** Zpracuje odpověď: posune FSRS kartu i statistiky a přepočítá úroveň. */
export function applyAnswer(card: CardState, input: AnswerInput, now: Date): CardState {
  const rating = ratingFor(input);

  let nextFsrs: StoredCard;
  if (input.isPlacement && !input.correct) {
    // V rozřazovacím testu neznámou vlajku jen necháme novou –
    // trestat dítě za to, co se ještě neučilo, nedává smysl.
    nextFsrs = card.fsrs;
  } else {
    const result = scheduler.next(fromStored(card.fsrs), now, rating);
    nextFsrs = toStored(result.card);
  }

  const next: CardState = {
    ...card,
    fsrs: nextFsrs,
    firstSeenAt: card.firstSeenAt ?? now.toISOString(),
    seen: card.seen + 1,
    correct: card.correct + (input.correct ? 1 : 0),
    streak: input.correct ? card.streak + 1 : 0,
    typedCorrect:
      card.typedCorrect +
      (input.correct && input.mode === 'typing' && !input.assisted ? 1 : 0),
    updatedAt: now.toISOString(),
  };
  next.mastery = computeMastery(next);
  return next;
}

export function isDue(card: CardState, now: Date): boolean {
  return card.seen > 0 && new Date(card.fsrs.due).getTime() <= now.getTime();
}

export function isNew(card: CardState | undefined): boolean {
  return !card || card.seen === 0;
}

/**
 * Denní dávka chytrého opakování: nejdřív karty, které jsou po termínu,
 * pak se doplní novými (od nejsnazších), ať je dávka smysluplně velká.
 */
export function dailyBatch(
  cards: readonly CardState[],
  allCodes: readonly string[],
  now: Date,
  difficultyOf: (code: string) => number,
  limits = DAILY_REVIEW,
): string[] {
  const byCode = new Map(cards.map((c) => [c.code, c]));

  const due = allCodes
    .map((code) => byCode.get(code))
    .filter((c): c is CardState => c !== undefined && isDue(c, now))
    .sort((a, b) => new Date(a.fsrs.due).getTime() - new Date(b.fsrs.due).getTime())
    .map((c) => c.code);

  const batch = due.slice(0, limits.max);
  if (batch.length >= limits.min) return batch;

  const fresh = allCodes
    .filter((code) => isNew(byCode.get(code)))
    .sort((a, b) => difficultyOf(a) - difficultyOf(b));

  for (const code of fresh) {
    if (batch.length >= limits.min) break;
    if (!batch.includes(code)) batch.push(code);
  }
  return batch;
}

export { Rating, State };
