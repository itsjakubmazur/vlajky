import type { Country } from '../types';
import type { Mastery } from '../srs/types';
import { buildOptions, challengeFromMastery, pickDistractors } from './distractors';
import { pickMapDistractors, separationFor } from './mapDistractors';
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
  // Druhá osa znalosti: hlavní města. Data v `capitalCs` byla v aplikaci
  // od začátku, ukazovala se ale jen v detailu vlajky.
  'capitals',
  // Třetí osa: kde to na světě vlastně je.
  'map',
  // Pět vlajek najednou na mapu – nápad osmiletého testera.
  'sort',
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
  'capitals',
  'map',
  'sort',
];

/**
 * Posouvá odpověď na takovou otázku plánovač vlajek?
 *
 * Hlavní města se ptají na jinou znalost a vlajku mají přímo v otázce –
 * počítat je jako zopakování vlajky by hlásilo zvládnutí, které dítě
 * neprokázalo.
 */
export function touchesScheduler(kind: QuestionKind): boolean {
  return (
    kind !== 'pickCapital' &&
    kind !== 'pickByCapital' &&
    kind !== 'pickOnMap' &&
    kind !== 'sortToContinent'
  );
}

/** Kolik životů má hráč v daném režimu; `null` = neomezeně. */
export function livesFor(mode: QuizModeId): number | null {
  if (mode === 'marathon') return 3;
  if (mode === 'boss') return 1;
  return null;
}

/**
 * Závodní režimy: hraje se o čas, ne o poučení.
 *
 * Jen v nich se po správné odpovědi posouvá dál samo – jinde má dítě číst
 * zajímavost a rozdíl mezi podobnými vlajkami, a na to potřebuje čas.
 */
export const RACE_MODES: readonly QuizModeId[] = ['marathon', 'flash', 'risk', 'daily', 'boss'];

/** Za jak dlouho po správné odpovědi se jede dál. */
export const AUTO_NEXT_MS = 1400;

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
  | 'twins'
  /** vidí vlajku, vybírá hlavní město */
  | 'pickCapital'
  /** vidí hlavní město, vybírá vlajku */
  | 'pickByCapital'
  /** vidí vlajku, ukazuje místo na mapě */
  | 'pickOnMap'
  /** pět vlajek najednou se rozděluje na světadíly */
  | 'sortToContinent';

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
    case 'map':
      return 'pickOnMap';
    case 'sort':
      return 'sortToContinent';
    case 'capitals':
      // Dvakrát z vlajky na město, jednou obráceně – ať se to nedá odjet
      // jedním směrem.
      return pick(['pickCapital', 'pickCapital', 'pickByCapital'] as const, rng) ?? 'pickCapital';
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

  // Na mapě rozhoduje vzdálenost, ne podobnost vlajek – ta je v otázce vidět.
  if (resolved === 'pickOnMap') {
    const distractors = pickMapDistractors(target, pool, {
      rng,
      challenge: challengeFromMastery(mastery),
      // V malé části světa se na světovou rozteč čtvrtá země nevejde.
      minSeparation: separationFor(pool),
    });
    return {
      code: target.code,
      kind: 'pickOnMap',
      options: buildOptions(target, distractors, rng).map((c) => c.code),
      mode,
    };
  }

  // Hlavní města se ptají na jinou věc než na vlajku, ale nabídka se staví
  // stejně – ze zemí. Rozdíl je jen v tom, co je na tlačítku a co v otázce.
  if (resolved === 'pickCapital' || resolved === 'pickByCapital') {
    const distractors = pickDistractors(target, pool, { rng, challenge: 0.5 });
    return {
      code: target.code,
      kind: resolved,
      options: buildOptions(target, distractors, rng).map((c) => c.code),
      mode,
    };
  }

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
