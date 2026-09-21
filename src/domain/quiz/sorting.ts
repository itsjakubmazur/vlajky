import { CONTINENTS, type Continent } from '../types';

/**
 * Režim Roztřiď: pět vlajek najednou na mapu světa.
 *
 * Nápad osmiletého testera. Proti ostatním režimům se liší tím, že se
 * neodpovídá po jedné otázce, ale **rozdělí se celá sada** – a název země
 * se ukáže až ve vyhodnocení. Dokud se třídí, jsou na obrazovce jen vlajky,
 * takže se nedá jet po jménech („Chile zní jihoamericky“) a musí se poznat
 * vlajka.
 */
export const SORT_BATCH = 5;

/** Kolik vlajek má jedno kolo v osobní hře – tři sady po pěti. */
export const SORT_ROUND = 15;

/** Bonus za sadu, ve které sedí všech pět. */
export const SORT_PERFECT_BONUS = 500;

/** Rozdělí vlajky na sady po pěti; poslední sada může být kratší. */
export function toBatches(codes: readonly string[], size = SORT_BATCH): string[][] {
  const batches: string[][] = [];
  for (let i = 0; i < codes.length; i += size) {
    batches.push([...codes.slice(i, i + size)]);
  }
  return batches;
}

/** Kam hráč vlajku přiřadil; `null` = zatím nikam. */
export type Assignment = Record<string, Continent | null>;

export interface SortResult {
  code: string;
  chosen: Continent | null;
  correct: Continent;
  ok: boolean;
}

/** Vyhodnotí jednu sadu. */
export function gradeBatch(
  batch: readonly string[],
  assignment: Assignment,
  continentOf: (code: string) => Continent,
): SortResult[] {
  return batch.map((code) => {
    const chosen = assignment[code] ?? null;
    const correct = continentOf(code);
    return { code, chosen, correct, ok: chosen === correct };
  });
}

/** Je sada hotová, tj. má každá vlajka svůj světadíl? */
export function isBatchComplete(batch: readonly string[], assignment: Assignment): boolean {
  return batch.every((code) => assignment[code] != null);
}

/**
 * Světadíly, mezi kterými se rozhoduje: vždycky všech šest.
 *
 * Dřív se nabízely jen ty, které sada potřebovala, doplněné na čtyři –
 * jenže doplňovalo se vždy od začátku seznamu, takže Evropa, Asie, Afrika
 * a Severní Amerika byly výplň, kdežto Oceánie a Jižní Amerika nikdy.
 * Objevit se Oceánie, prozradilo to, že jedna z vlajek je odtamtud.
 *
 * Šest zón pokaždé neprozradí nic a mapa navíc vypadá stejně každou sadu,
 * takže se dítě naučí i to, kde který světadíl na mapě je.
 */
export const SORT_ZONES: readonly Continent[] = CONTINENTS;
