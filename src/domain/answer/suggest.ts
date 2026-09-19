import type { Country } from '../types';
import { normalize } from '../text/normalize';
import { levenshtein } from '../text/levenshtein';
import { labelsOf } from './match';

export interface Suggestion {
  country: Country;
  /** tvar, na který se to napojilo (kvůli zvýraznění) */
  label: string;
  rank: number;
}

const RANK_PREFIX = 0;
const RANK_WORD_START = 1;
const RANK_CONTAINS = 2;
const RANK_FUZZY = 3;

/**
 * Našeptávač. Bere se až od dvou znaků, jinak by po prvním písmenu
 * naskočilo půl světa.
 */
export function suggestCountries(
  input: string,
  countries: readonly Country[],
  limit = 6,
): Suggestion[] {
  const query = normalize(input);
  if (query.length < 2) return [];

  const found: Suggestion[] = [];

  for (const country of countries) {
    let best: Suggestion | null = null;
    for (const label of labelsOf(country)) {
      let rank: number | null = null;
      if (label.startsWith(query)) rank = RANK_PREFIX;
      else if (label.split(' ').some((word) => word.startsWith(query))) rank = RANK_WORD_START;
      else if (label.includes(query)) rank = RANK_CONTAINS;
      else if (query.length >= 4 && levenshtein(query, label, 2) <= 2) rank = RANK_FUZZY;

      if (rank !== null && (!best || rank < best.rank)) {
        best = { country, label, rank };
      }
    }
    if (best) found.push(best);
  }

  return found
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      // známější země (nižší obtížnost) napřed – dítě je hledá častěji
      if (a.country.difficulty !== b.country.difficulty) {
        return a.country.difficulty - b.country.difficulty;
      }
      return a.country.nameCs.localeCompare(b.country.nameCs, 'cs');
    })
    .slice(0, limit);
}
