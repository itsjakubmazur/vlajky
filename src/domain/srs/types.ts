import type { Card } from 'ts-fsrs';

export const MASTERY_LEVELS = ['new', 'bronze', 'silver', 'gold'] as const;
export type Mastery = (typeof MASTERY_LEVELS)[number];

/** FSRS karta s daty v ISO řetězcích, aby šla uložit do localStorage. */
export interface StoredCard extends Omit<Card, 'due' | 'last_review'> {
  due: string;
  last_review?: string;
}

export interface CardState {
  code: string;
  fsrs: StoredCard;
  mastery: Mastery;
  /** kolikrát byla vlajka položená */
  seen: number;
  /** kolikrát správně */
  correct: number;
  /** aktuální série správných odpovědí */
  streak: number;
  /** kolikrát správně v režimu Napiš – bez toho není zlato */
  typedCorrect: number;
  updatedAt: string;
}

export interface AnswerLog {
  code: string;
  mode: string;
  correct: boolean;
  elapsedMs: number;
  at: string;
}

export function toStored(card: Card): StoredCard {
  const { due, last_review: lastReview, ...rest } = card;
  return {
    ...rest,
    due: due.toISOString(),
    ...(lastReview ? { last_review: lastReview.toISOString() } : {}),
  };
}

export function fromStored(card: StoredCard): Card {
  const { due, last_review: lastReview, ...rest } = card;
  return {
    ...rest,
    due: new Date(due),
    ...(lastReview ? { last_review: new Date(lastReview) } : {}),
  } as Card;
}
