import type { Country } from '../types';
import type { Mastery } from '../srs/types';
import { buildOptions, challengeFromMastery, pickDistractors } from './distractors';
import { pick, shuffle, type Rng } from '../rng';

export const QUIZ_MODES = [
  'classic',
  'reverse',
  'typing',
  'twins',
  'review',
  // Režimy s napětím: rychlost, životy, sázka, denní výzva.
  'marathon',
  'flash',
  'risk',
  'daily',
] as const;
export type QuizModeId = (typeof QUIZ_MODES)[number] | 'placement' | 'boss' | 'weak';

/** Režimy, ve kterých se hraje o rekord a počítají se body. */
export const SCORED_MODES: readonly QuizModeId[] = [
  'classic',
  'reverse',
  'typing',
  'twins',
  'marathon',
  'flash',
  'risk',
  'daily',
  'boss',
  'weak',
];

/** Kolik životů má hráč v daném režimu; `null` = neomezeně. */
export function livesFor(mode: QuizModeId): number | null {
  if (mode === 'marathon') return 3;
  if (mode === 'boss') return 1;
  return null;
}

/** Režim, kde se vlajka po chvíli schová. */
export const FLASH_MS = 2000;

/** Jak vypadá otázka na obrazovce. */
export type QuestionKind =
  /** vidí vlajku, vybírá název ze čtyř */
  | 'pickCountry'
  /** vidí název, vybírá vlajku ze čtyř */
  | 'pickFlag'
  /** vidí vlajku, píše název */
  | 'type'
  /** vidí dvě zaměnitelné vlajky vedle sebe */
  | 'twins';

export interface Question {
  /** kód správné odpovědi */
  code: string;
  kind: QuestionKind;
  /** nabídnuté kódy (u psaní prázdné) */
  options: string[];
  /** ve kterém režimu otázka vznikla – kvůli hodnocení FSRS */
  mode: QuizModeId;
}

export function kindForMode(mode: QuizModeId, rng: Rng): QuestionKind {
  switch (mode) {
    case 'classic':
    case 'placement':
    case 'marathon':
    case 'flash':
    case 'risk':
    case 'daily':
      return 'pickCountry';
    case 'boss':
      // Souboj střídá směry: dvě vlajky vedle sebe a občas obráceně
      // vlajka a jména ze skupiny. Pořád dokola „která je Čad“ se dá
      // uhádnout ze zvyku, ne ze znalosti.
      return pick(['twins', 'twins', 'pickCountry'] as const, rng) ?? 'twins';
    case 'reverse':
      return 'pickFlag';
    case 'typing':
      return 'type';
    case 'twins':
      return 'twins';
    case 'review':
    case 'weak':
      // Chytré opakování i trénink slabin střídají způsoby, ať to není
      // stereotyp – a hlavně ať se vlajka pozná i z druhé strany.
      return pick(['pickCountry', 'pickFlag', 'type'] as const, rng) ?? 'pickCountry';
  }
}

export interface BuildQuestionOptions {
  mode: QuizModeId;
  target: Country;
  pool: readonly Country[];
  mastery: Mastery;
  rng: Rng;
  /** Vynucený typ otázky (chytré opakování si ho losuje předem). */
  kind?: QuestionKind;
}

export function buildQuestion({
  mode,
  target,
  pool,
  mastery,
  rng,
  kind,
}: BuildQuestionOptions): Question {
  const resolved = kind ?? kindForMode(mode, rng);

  if (resolved === 'type') {
    return { code: target.code, kind: 'type', options: [], mode };
  }

  if (resolved === 'twins') {
    const twin = pickTwin(target, pool, rng);
    const options = twin ? shuffle([target.code, twin.code], rng) : [target.code];
    return { code: target.code, kind: 'twins', options, mode };
  }

  const distractors = pickDistractors(target, pool, {
    rng,
    challenge: challengeFromMastery(mastery),
  });
  return {
    code: target.code,
    kind: resolved,
    options: buildOptions(target, distractors, rng).map((c) => c.code),
    mode,
  };
}

/** Pro režim Dvojčata: vybere zaměnitelnou vlajku, která je v aktivní sadě. */
export function pickTwin(
  target: Country,
  pool: readonly Country[],
  rng: Rng,
): Country | undefined {
  const inPool = pool.filter((c) => target.similar.includes(c.code));
  return pick(inPool, rng);
}

/** Vlajky, které mají dvojče – jen ty mají v režimu Dvojčata smysl. */
export function twinnableCountries(pool: readonly Country[]): Country[] {
  const codes = new Set(pool.map((c) => c.code));
  return pool.filter((c) => c.similar.some((s) => codes.has(s)));
}
