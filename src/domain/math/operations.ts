import { divisionsInRange, factsInRange, type Fact, type FactRange } from './facts';

/**
 * Co se počítá. Vybírá se na začátku, před řadou.
 *
 * Násobení a dělení stojí na kartách a plánovači (`facts.ts`), sčítání
 * a odčítání se losuje pokaždé znovu (`addsub.ts`) – do sta je přes pět
 * tisíc příkladů a jde v nich o postup (přechod přes desítku), ne
 * o zapamatování jednotlivých dvojic.
 */
export type Operation = 'addsub' | 'mul' | 'div' | 'muldiv';

export const OPERATIONS: readonly Operation[] = ['addsub', 'mul', 'div', 'muldiv'];

/** Do kolika se sčítá a odčítá. */
export type AddSubLimit = 20 | 100;
export const ADD_SUB_LIMITS: readonly AddSubLimit[] = [20, 100];

/** Má tahle operace karty v plánovači? */
export function usesCards(operation: Operation): boolean {
  return operation !== 'addsub';
}

/** Příklady s kartou, ze kterých se kolo skládá. Sčítání žádné nemá. */
export function factsFor(operation: Operation, range: FactRange): Fact[] {
  switch (operation) {
    case 'mul':
      return factsInRange(range);
    case 'div':
      return divisionsInRange(range);
    case 'muldiv':
      return [...factsInRange(range), ...divisionsInRange(range)];
    case 'addsub':
      return [];
  }
}

/**
 * Klíč rekordu. Násobení si nechává staré klíče (`all`, `7`), aby se
 * rekordy nasbírané před přidáním dalších operací neztratily.
 */
export function recordScope(operation: Operation, range: FactRange): string {
  const part = range === null ? 'all' : String(range);
  return operation === 'mul' ? part : `${operation}:${part}`;
}
