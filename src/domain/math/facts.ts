import type { Difficulty } from '../types';

/**
 * Malá násobilka a dělení: činitelé 1 až 10.
 *
 * **Násobení je jedna karta, i když se dá zeptat dvěma způsoby.** 7×8 a 8×7
 * je pro plánovače tatáž znalost, takže má jednu kartu s klíčem `7x8`
 * (menší činitel první) a při otázce se pořadí losuje. Kdyby to byly dvě
 * karty, půlka opakování by byla zbytečná a hra by se ptala dvakrát na
 * totéž hned za sebou.
 *
 * **Dělení má karty vlastní.** 56 : 7 a 56 : 8 jsou dvě různé otázky
 * s různým výsledkem a dítě, které umí 7×8, ještě nemusí rychle vidět,
 * kolikrát se sedm vejde do padesáti šesti. Klíč je `56:7` (dělenec:dělitel).
 */
export const MAX_FACTOR = 10;

export type FactKind = 'mul' | 'div';

export interface Fact {
  /** `7x8` u násobení (menší činitel první), `56:7` u dělení. */
  key: string;
  kind: FactKind;
  /**
   * Činitelé. U násobení `a ≤ b`, u dělení `a` je podíl a `b` dělitel –
   * příklad je pak `product : b = a`.
   */
  a: number;
  b: number;
  product: number;
  difficulty: Difficulty;
}

export function factKey(a: number, b: number): string {
  return a <= b ? `${a}x${b}` : `${b}x${a}`;
}

export function divisionKey(dividend: number, divisor: number): string {
  return `${dividend}:${divisor}`;
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
 * doopravdy chybuje. Platí to i pro dělení, které stojí na týchž dvojicích.
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

/** Všech 100 příkladů dělení v oboru malé násobilky (dělitel i podíl 1–10). */
export const ALL_DIVISIONS: readonly Fact[] = buildDivisions();

function buildFacts(): Fact[] {
  const facts: Fact[] = [];
  for (let a = 1; a <= MAX_FACTOR; a++) {
    for (let b = a; b <= MAX_FACTOR; b++) {
      facts.push({ key: factKey(a, b), kind: 'mul', a, b, product: a * b, difficulty: difficultyOf(a, b) });
    }
  }
  return facts;
}

function buildDivisions(): Fact[] {
  const facts: Fact[] = [];
  for (let divisor = 1; divisor <= MAX_FACTOR; divisor++) {
    for (let quotient = 1; quotient <= MAX_FACTOR; quotient++) {
      const product = divisor * quotient;
      facts.push({
        key: divisionKey(product, divisor),
        kind: 'div',
        a: quotient,
        b: divisor,
        product,
        difficulty: difficultyOf(quotient, divisor),
      });
    }
  }
  return facts;
}

const byKey = new Map([...ALL_FACTS, ...ALL_DIVISIONS].map((fact) => [fact.key, fact]));

export function factOf(key: string): Fact | undefined {
  return byKey.get(key);
}

export function requireFact(key: string): Fact {
  const fact = byKey.get(key);
  if (!fact) throw new Error(`Neznámý příklad: ${key}`);
  return fact;
}

/** Výsledek, který se má napsat. */
export function answerOf(fact: Fact): number {
  return fact.kind === 'mul' ? fact.product : fact.a;
}

/** Které řady se dají procvičovat zvlášť. `null` = všechny. */
export type FactRange = number | null;

/** Násobení v řadě `range` – kde je to číslo jedním z činitelů. */
export function factsInRange(range: FactRange): Fact[] {
  if (range === null) return [...ALL_FACTS];
  return ALL_FACTS.filter((fact) => fact.a === range || fact.b === range);
}

/** Dělení v řadě `range` – tím číslem se dělí, jako „dělení sedmi“ ve škole. */
export function divisionsInRange(range: FactRange): Fact[] {
  if (range === null) return [...ALL_DIVISIONS];
  return ALL_DIVISIONS.filter((fact) => fact.b === range);
}
