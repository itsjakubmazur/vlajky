import type { Difficulty } from '../types';

/**
 * Malá násobilka: činitelé 1 až 10.
 *
 * **Příklad je jedna karta, i když se dá zeptat dvěma způsoby.** 7×8 a 8×7
 * je pro plánovače tatáž znalost, takže má jednu kartu s klíčem `7x8`
 * (menší činitel první) a při otázce se pořadí losuje. Kdyby to byly dvě
 * karty, půlka opakování by byla zbytečná a hra by se ptala dvakrát na
 * totéž hned za sebou.
 */
export const MAX_FACTOR = 10;

export interface Fact {
  /** `a×b`, vždycky menší činitel první – klíč karty. */
  key: string;
  a: number;
  b: number;
  product: number;
  difficulty: Difficulty;
}

export function factKey(a: number, b: number): string {
  return a <= b ? `${a}x${b}` : `${b}x${a}`;
}

export function parseFactKey(key: string): { a: number; b: number } | null {
  const match = /^(\d+)x(\d+)$/.exec(key);
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  if (!inRange(a) || !inRange(b)) return null;
  return { a, b };
}

function inRange(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MAX_FACTOR;
}

/**
 * Jak těžký příklad to je.
 *
 * Není to odhad od stolu, počítá se z činitelů: řady 1 a 10 jsou jen
 * přepsání čísla, 2 a 5 má dítě z počítání po dvou a po pěti, čtverce
 * (7×7) se pamatují jako celek. Co zbyde – 6×7, 7×8, 8×9 – je to, kde se
 * doopravdy chybuje. Obtížnost se pak propisuje do bodů.
 */
export function difficultyOf(a: number, b: number): Difficulty {
  const easy = (n: number) => n === 1 || n === 10;
  const friendly = (n: number) => n === 2 || n === 5;

  if (easy(a) || easy(b)) return 1;
  if (a === b) return 2;
  if (friendly(a) || friendly(b)) return 2;
  if (a === 3 || b === 3 || a === 9 || b === 9) return 3;
  if (a === 4 || b === 4) return 4;
  return 5;
}

/** Všech 55 příkladů malé násobilky (dvojice bez ohledu na pořadí). */
export const ALL_FACTS: readonly Fact[] = buildFacts();

function buildFacts(): Fact[] {
  const facts: Fact[] = [];
  for (let a = 1; a <= MAX_FACTOR; a++) {
    for (let b = a; b <= MAX_FACTOR; b++) {
      facts.push({ key: factKey(a, b), a, b, product: a * b, difficulty: difficultyOf(a, b) });
    }
  }
  return facts;
}

const byKey = new Map(ALL_FACTS.map((fact) => [fact.key, fact]));

export function factOf(key: string): Fact | undefined {
  return byKey.get(key);
}

export function requireFact(key: string): Fact {
  const fact = byKey.get(key);
  if (!fact) throw new Error(`Neznámý příklad: ${key}`);
  return fact;
}

/** Které řady se dají procvičovat zvlášť. `null` = celá násobilka. */
export type FactRange = number | null;

export function factsInRange(range: FactRange): Fact[] {
  if (range === null) return [...ALL_FACTS];
  return ALL_FACTS.filter((fact) => fact.a === range || fact.b === range);
}
