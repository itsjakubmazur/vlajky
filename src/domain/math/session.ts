import type { CardState } from '../srs/types';
import { isDue, isNew } from '../srs/scheduler';
import { masteryRank } from '../srs/mastery';
import { shuffle, type Rng } from '../rng';
import {
  cardKey,
  factsInRange,
  operationsOf,
  parseCardKey,
  type Fact,
  type FactRange,
  type Operation,
  type OperationChoice,
} from './facts';

/** Kolik příkladů má jedno kolo. */
export const ROUND_LENGTH = 20;

export interface MathQuestion {
  /** Klíč karty – menší činitel první, nezávisle na pořadí v otázce. */
  key: string;
  op: Operation;
  /**
   * Jak se příklad ukáže: `left × right` nebo `left : right`. U násobení se
   * losuje pořadí činitelů, u dělení dělitel – karta je pokaždé jedna.
   */
  left: number;
  right: number;
  /** Co má dítě napsat. */
  answer: number;
}

export interface RoundOptions {
  cards: Record<string, CardState>;
  now: Date;
  rng: Rng;
  range?: FactRange;
  /** Násobení, dělení, nebo obojí namíchané. Výchozí je násobení. */
  operation?: OperationChoice;
  length?: number;
}

/** Jedna karta v kole: příklad a operace, kterou se na něj ptá. */
interface Item {
  fact: Fact;
  op: Operation;
  key: string;
}

/** Pod jakým klíčem se vede rekord. Násobení má staré klíče kvůli postupu. */
export function recordScope(range: FactRange, operation: OperationChoice): string {
  const base = range === null ? 'all' : String(range);
  return operation === 'mul' ? base : `${operation}:${base}`;
}

/** Všechny karty, které do výběru patří (pro „x z y zvládnutých“). */
export function cardKeysFor(range: FactRange, operation: OperationChoice): string[] {
  const ops = operationsOf(operation);
  return factsInRange(range).flatMap((fact) => ops.map((op) => cardKey(fact, op)));
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
  operation = 'mul',
  length = ROUND_LENGTH,
}: RoundOptions): MathQuestion[] {
  const ops = operationsOf(operation);
  const pool: Item[] = factsInRange(range).flatMap((fact) =>
    ops.map((op) => ({ fact, op, key: cardKey(fact, op) })),
  );

  const due: Item[] = [];
  const fresh: Item[] = [];
  const rest: Item[] = [];
  for (const item of pool) {
    const card = cards[item.key];
    if (!card || isNew(card)) fresh.push(item);
    else if (isDue(card, now)) due.push(item);
    else rest.push(item);
  }

  // Uvnitř skupiny rozhoduje, jak moc to dítěti jde; při shodě se losuje,
  // aby každé kolo nezačínalo stejnou pěticí.
  const byWeakest = (list: Item[]) =>
    shuffle(list, rng).sort((x, y) => score(cards[x.key]) - score(cards[y.key]));

  const chosen = [...byWeakest(due), ...byWeakest(fresh), ...byWeakest(rest)].slice(0, length);

  // Kolo musí mít plnou délku i v jedné řadě (těch je jen deset), takže se
  // doplní opakováním – ale až po tom, co se vyčerpalo všechno ostatní.
  while (chosen.length < length && pool.length > 0) {
    chosen.push(...shuffle(pool, rng).slice(0, length - chosen.length));
  }

  return spread(shuffle(chosen, rng), rng).map((item) => toQuestion(item, rng));
}

/** Nižší číslo = horší znalost, tedy dřív na řadě. */
function score(card: CardState | undefined): number {
  if (!card) return -1;
  const success = card.seen > 0 ? card.correct / card.seen : 0;
  return masteryRank(card.mastery) * 10 + success * 5 + Math.min(card.streak, 5);
}

/**
 * Rozhází pořadí tak, aby dva příklady po sobě neměly společného činitele.
 * U dělení se počítá s činiteli, ze kterých vzniklo: 56 : 7 hned po 7 × 8
 * by byl tentýž příklad podruhé, jen pozpátku.
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
function spread(facts: Item[], rng: Rng): Item[] {
  const out: Item[] = [];
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
function fits(order: Item[], index: number, fact: Item): boolean {
  return !shares(fact, order[index - 1]) && !shares(fact, order[index + 1]);
}

function shares(item: Item, before: Item | undefined): boolean {
  if (!before) return false;
  const fact = item.fact;
  const previous = before.fact;
  return (
    fact.a === previous.a || fact.a === previous.b || fact.b === previous.a || fact.b === previous.b
  );
}

function toQuestion({ fact, op, key }: Item, rng: Rng): MathQuestion {
  const flipped = rng() < 0.5;
  if (op === 'div') {
    // 56 : 7 nebo 56 : 8 – dělitel se losuje, výsledek je ten druhý činitel.
    const divisor = flipped ? fact.b : fact.a;
    return { key, op, left: fact.product, right: divisor, answer: fact.product / divisor };
  }
  return {
    key,
    op,
    left: flipped ? fact.b : fact.a,
    right: flipped ? fact.a : fact.b,
    answer: fact.product,
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
    // Karta s klíčem, který neznáme (třeba ze starší verze), se vynechá.
    .filter((entry) => parseCardKey(entry.key) !== null)
    .slice(0, count);
}

/** Kolik příkladů má dítě zvládnutých (aspoň stříbro). */
export function masteredCount(cards: Record<string, CardState>): number {
  return Object.values(cards).filter((card) => masteryRank(card.mastery) >= 2).length;
}
