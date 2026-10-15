import type { CardState } from '../srs/types';
import { isDue, isNew } from '../srs/scheduler';
import { masteryRank } from '../srs/mastery';
import { shuffle, type Rng } from '../rng';
import { factsInRange, requireFact, type Fact, type FactRange } from './facts';

/** Kolik příkladů má jedno kolo. */
export const ROUND_LENGTH = 20;

export interface MathQuestion {
  /** Klíč karty – menší činitel první, nezávisle na pořadí v otázce. */
  key: string;
  /** Jak se příklad ukáže. Pořadí se losuje, karta je jedna. */
  left: number;
  right: number;
  product: number;
}

export interface RoundOptions {
  cards: Record<string, CardState>;
  now: Date;
  rng: Rng;
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
  range = null,
  length = ROUND_LENGTH,
}: RoundOptions): MathQuestion[] {
  const pool = factsInRange(range);

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
  const flipped = rng() < 0.5;
  return {
    key: fact.key,
    left: flipped ? fact.b : fact.a,
    right: flipped ? fact.a : fact.b,
    product: fact.product,
  };
}

/** Příklady, které jdou nejhůř – pro přehled „co ti nejde“. */
export function weakestFacts(
  cards: Record<string, CardState>,
  count = 6,
): { key: string; wrong: number; seen: number }[] {
  return Object.values(cards)
    .filter((card) => card.seen >= 2 && card.correct < card.seen)
    .map((card) => ({ key: card.code, wrong: card.seen - card.correct, seen: card.seen }))
    .sort((x, y) => y.wrong / y.seen - x.wrong / x.seen || y.wrong - x.wrong)
    .slice(0, count)
    .filter((entry) => requireFact(entry.key) !== undefined);
}

/** Kolik příkladů má dítě zvládnutých (aspoň stříbro). */
export function masteredCount(cards: Record<string, CardState>): number {
  return Object.values(cards).filter((card) => masteryRank(card.mastery) >= 2).length;
}
