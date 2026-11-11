import type { CardState } from '../srs/types';
import { isDue, isNew } from '../srs/scheduler';
import { masteryRank } from '../srs/mastery';
import { shuffle, type Rng } from '../rng';
import { answerOf, factOf, type Fact, type FactRange } from './facts';
import { factsFor, type AddSubLimit, type Operation } from './operations';
import { buildAddSubRound } from './addsub';

/** Kolik příkladů má jedno kolo. */
export const ROUND_LENGTH = 20;

export type MathSign = '+' | '−' | '×' | ':';

export interface MathQuestion {
  /**
   * Klíč příkladu. U násobení a dělení je to zároveň klíč karty (`7x8`,
   * `56:7`), takže nezávisí na pořadí v otázce. U sčítání a odčítání
   * (`23+48`) karta není.
   */
  key: string;
  op: MathSign;
  /** Jak se příklad ukáže: `left op right = answer`. */
  left: number;
  right: number;
  answer: number;
}

export interface RoundOptions {
  cards: Record<string, CardState>;
  now: Date;
  rng: Rng;
  operation?: Operation;
  /** Řada u násobení a dělení, mez (20, 100) u sčítání a odčítání. */
  range?: FactRange;
  length?: number;
}

/**
 * Sestaví kolo příkladů.
 *
 * Celý smysl modulu je, že **řada jde nazpaměť, ale náhodné pořadí ne**.
 * Proto se pořadí nejen zamíchá, ale ještě se po míchání rozhází tak, aby
 * dva příklady po sobě neměly společného činitele. Bez toho se ve výsledku
 * objevily shluky („6×7, 7×8, 3×7“) a z náhodného pořadí se zpátky stala
 * řada.
 *
 * Co se vybere: nejdřív co je po termínu, pak co dítě ještě nevidělo,
 * pak to, co umí nejhůř. Stejné pořadí priorit jako u vlajek.
 */
export function buildRound({
  cards,
  now,
  rng,
  operation = 'mul',
  range = null,
  length = ROUND_LENGTH,
}: RoundOptions): MathQuestion[] {
  if (operation === 'addsub') {
    return buildAddSubRound(rng, (range ?? 100) as AddSubLimit, length);
  }
  const pool = factsFor(operation, range);

  const due: Fact[] = [];
  const fresh: Fact[] = [];
  const rest: Fact[] = [];
  for (const fact of pool) {
    const card = cards[fact.key];
    if (!card || isNew(card)) fresh.push(fact);
    else if (isDue(card, now)) due.push(fact);
    else rest.push(fact);
  }

  // Uvnitř skupiny rozhoduje, jak moc to dítěti jde; při shodě se losuje,
  // aby každé kolo nezačínalo stejnou pěticí.
  const byWeakest = (list: Fact[]) =>
    shuffle(list, rng).sort((x, y) => score(cards[x.key]) - score(cards[y.key]));

  const chosen = [...byWeakest(due), ...byWeakest(fresh), ...byWeakest(rest)].slice(0, length);

  // Kolo musí mít plnou délku i v jedné řadě (těch je jen deset), takže se
  // doplní opakováním – ale až po tom, co se vyčerpalo všechno ostatní.
  while (chosen.length < length && pool.length > 0) {
    chosen.push(...shuffle(pool, rng).slice(0, length - chosen.length));
  }

  return spread(shuffle(chosen, rng), rng).map((fact) => toQuestion(fact, rng));
}

/** Nižší číslo = horší znalost, tedy dřív na řadě. */
function score(card: CardState | undefined): number {
  if (!card) return -1;
  const success = card.seen > 0 ? card.correct / card.seen : 0;
  return masteryRank(card.mastery) * 10 + success * 5 + Math.min(card.streak, 5);
}

/**
 * Rozhází pořadí tak, aby dva příklady po sobě neměly společného činitele.
 *
 * Dvě fáze. Nejdřív se bere vždycky první příklad, který se k předchozímu
 * nehodí – pořadí se tím jinak nemění, takže výběr zůstane náhodný. Na konci
 * ale občas zbydou samé příklady se společným činitelem, takže pak jde druhá
 * fáze: oprava prohozením s někým dřívějším, kde to sedne.
 *
 * Když se ani prohodit nedá (jedna řada má společný činitel ze své podstaty),
 * zůstane to tak. Jedno takové sousedství z dvaceti příkladů z náhodného
 * pořadí ještě řadu neudělá.
 */
function spread(facts: Fact[], rng: Rng): Fact[] {
  const out: Fact[] = [];
  const left = [...facts];
  while (left.length > 0) {
    const previous = out[out.length - 1];
    let index = left.findIndex((fact) => !shares(fact, previous));
    if (index < 0) index = Math.floor(rng() * left.length);
    out.push(left.splice(index, 1)[0]!);
  }

  for (let i = 1; i < out.length; i++) {
    if (!shares(out[i]!, out[i - 1])) continue;
    for (let j = 1; j < out.length; j++) {
      if (j === i || j === i - 1 || j === i + 1) continue;
      if (fits(out, i, out[j]!) && fits(out, j, out[i]!)) {
        const swapped = out[j]!;
        out[j] = out[i]!;
        out[i] = swapped;
        break;
      }
    }
  }
  return out;
}

/** Sedl by `fact` na pozici `index`, aniž by se dotkl svých sousedů? */
function fits(order: Fact[], index: number, fact: Fact): boolean {
  return !shares(fact, order[index - 1]) && !shares(fact, order[index + 1]);
}

function shares(fact: Fact, previous: Fact | undefined): boolean {
  if (!previous) return false;
  return (
    fact.a === previous.a || fact.a === previous.b || fact.b === previous.a || fact.b === previous.b
  );
}

function toQuestion(fact: Fact, rng: Rng): MathQuestion {
  if (fact.kind === 'div') {
    return { key: fact.key, op: ':', left: fact.product, right: fact.b, answer: answerOf(fact) };
  }
  const flipped = rng() < 0.5;
  return {
    key: fact.key,
    op: '×',
    left: flipped ? fact.b : fact.a,
    right: flipped ? fact.a : fact.b,
    answer: fact.product,
  };
}

/** Příklad tak, jak se píše: `7 × 8`, `56 : 7`. */
export function formatFact(fact: Fact): string {
  return fact.kind === 'div' ? `${fact.product} : ${fact.b}` : `${fact.a} × ${fact.b}`;
}

/**
 * Příklady, které jdou nejhůř – pro přehled „co ti nejde“. S `pool` jen
 * z těch příkladů, které se zrovna procvičují (dělení neukazuje násobení).
 */
export function weakestFacts(
  cards: Record<string, CardState>,
  count = 6,
  pool?: readonly Fact[],
): { key: string; wrong: number; seen: number }[] {
  const allowed = pool ? new Set(pool.map((fact) => fact.key)) : null;
  return Object.values(cards)
    .filter((card) => factOf(card.code) !== undefined)
    .filter((card) => !allowed || allowed.has(card.code))
    .filter((card) => card.seen >= 2 && card.correct < card.seen)
    .map((card) => ({ key: card.code, wrong: card.seen - card.correct, seen: card.seen }))
    .sort((x, y) => y.wrong / y.seen - x.wrong / x.seen || y.wrong - x.wrong)
    .slice(0, count);
}

/** Kolik příkladů má dítě zvládnutých (aspoň stříbro). */
export function masteredCount(cards: Record<string, CardState>): number {
  return Object.values(cards).filter((card) => masteryRank(card.mastery) >= 2).length;
}
