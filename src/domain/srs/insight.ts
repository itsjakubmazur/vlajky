import { fsrs, generatorParameters } from 'ts-fsrs';
import type { CardState } from './types';
import { fromStored } from './types';
import { isDue } from './scheduler';

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

/** Kolik vlajek se ukazuje v přehledu slabin i v předpovědi. */
export const INSIGHT_LIMIT = 10;
/** Jak daleko dopředu se kouká na „tohle ti brzy vypadne z hlavy“. */
export const FORECAST_DAYS = 3;
/** Pod touhle pravděpodobností vybavení už jde o zapomínání. */
export const FADING_THRESHOLD = 0.8;

/**
 * Pravděpodobnost, že si dítě vlajku právě teď vybaví (0–1).
 *
 * Bere se rovnou z FSRS, ne z vlastního vzorce – jinak by se přehled
 * rozcházel s tím, co plánovač doopravdy dělá.
 */
export function recall(card: CardState, now: Date): number {
  if (card.seen === 0) return 0;
  return scheduler.get_retrievability(fromStored(card.fsrs), now, false);
}

export interface WeakFlag {
  code: string;
  /** Podíl chyb 0–1. */
  errorRate: number;
  seen: number;
  correct: number;
}

/**
 * Nejslabší vlajky: nejdřív podle podílu chyb, při shodě podle toho,
 * kolikrát už padly. Vlajky viděné jen jednou se berou až nakonec –
 * jedna chyba ještě nic neznamená.
 */
export function weakest(
  cards: readonly CardState[],
  inPool: (code: string) => boolean,
  limit = INSIGHT_LIMIT,
): WeakFlag[] {
  const scored = cards
    .filter((card) => card.seen > 0 && card.correct < card.seen && inPool(card.code))
    .map((card) => ({
      code: card.code,
      errorRate: 1 - card.correct / card.seen,
      seen: card.seen,
      correct: card.correct,
    }));

  scored.sort((a, b) => {
    const solidA = a.seen >= 2 ? 1 : 0;
    const solidB = b.seen >= 2 ? 1 : 0;
    if (solidA !== solidB) return solidB - solidA;
    if (a.errorRate !== b.errorRate) return b.errorRate - a.errorRate;
    if (a.seen !== b.seen) return b.seen - a.seen;
    return a.code.localeCompare(b.code);
  });

  return scored.slice(0, limit);
}

export interface FadingFlag {
  code: string;
  /** Pravděpodobnost vybavení na konci okna. */
  recall: number;
}

/**
 * Vlajky, které ještě nejsou po termínu, ale během pár dní se z paměti
 * vytratí. Díky tomu jde plánovač ukázat dopředu místo aby jen tiše čekal.
 */
export function fadingSoon(
  cards: readonly CardState[],
  inPool: (code: string) => boolean,
  now: Date,
  days = FORECAST_DAYS,
  limit = INSIGHT_LIMIT,
): FadingFlag[] {
  const horizon = new Date(now.getTime() + days * 86_400_000);

  return cards
    .filter((card) => card.seen > 0 && !isDue(card, now) && inPool(card.code))
    .map((card) => ({ code: card.code, recall: recall(card, horizon) }))
    .filter((item) => item.recall < FADING_THRESHOLD)
    .sort((a, b) => a.recall - b.recall || a.code.localeCompare(b.code))
    .slice(0, limit);
}
