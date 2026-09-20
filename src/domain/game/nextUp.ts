import type { QuizModeId } from '../quiz/modes';

/**
 * Co hrát teď.
 *
 * Domovská obrazovka nabízí devět režimů, denní výzvu, mise a souboje –
 * pro osmiletého je to rozcestník, ne pozvánka. Jedno velké tlačítko
 * rozhodne za něj a zbytek nechá těm, kdo si chtějí vybrat sami.
 */
export type NextUpReason =
  /** Rozřazovací test ještě neproběhl. */
  | 'placement'
  /** Dnešní výzva čeká. */
  | 'daily'
  /** Něco je po termínu k zopakování. */
  | 'review'
  /** Jsou vlajky, na kterých to láme. */
  | 'weak'
  /** Nic nehoří – jen si zahrát. */
  | 'classic';

export interface NextUpInput {
  placementDone: boolean;
  dailyDone: boolean;
  dueCount: number;
  weakCount: number;
}

export interface NextUp {
  reason: NextUpReason;
  mode: QuizModeId;
}

/**
 * Pořadí je schválně takhle: nejdřív zjistit, co dítě umí, pak to, co je
 * jen dnes, pak to, co se vytrácí z hlavy, a teprve nakonec slabiny.
 * Denní výzva je před opakováním proto, že po půlnoci je nenávratně pryč.
 */
export function nextUp({
  placementDone,
  dailyDone,
  dueCount,
  weakCount,
}: NextUpInput): NextUp {
  if (!placementDone) return { reason: 'placement', mode: 'placement' };
  if (!dailyDone) return { reason: 'daily', mode: 'daily' };
  if (dueCount > 0) return { reason: 'review', mode: 'review' };
  if (weakCount > 0) return { reason: 'weak', mode: 'weak' };
  return { reason: 'classic', mode: 'classic' };
}
