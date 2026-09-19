import type { Country } from '../types';
import { normalize } from '../text/normalize';
import { levenshtein, typoTolerance } from '../text/levenshtein';

/**
 * Rejstřík všech přijatelných odpovědí. Staví se nad VŠEMI zeměmi, ne jen nad
 * aktivní sadou – jinak by „Guinea“ mohla projít jako překlep „Guiney-Bissau“
 * jen proto, že Guinea zrovna není ve hře.
 */
export interface AnswerIndex {
  /** normalizovaný tvar → kódy zemí (běžně právě jedna) */
  byLabel: Map<string, string[]>;
  /** kód → jeho normalizované tvary */
  labelsByCode: Map<string, string[]>;
}

export function labelsOf(country: Country): string[] {
  return [country.nameCs, country.nameCsOfficial, ...country.aliases]
    .filter((x): x is string => Boolean(x))
    .map(normalize)
    .filter((x) => x.length > 0);
}

export function buildAnswerIndex(countries: readonly Country[]): AnswerIndex {
  const byLabel = new Map<string, string[]>();
  const labelsByCode = new Map<string, string[]>();

  for (const country of countries) {
    const labels = [...new Set(labelsOf(country))];
    labelsByCode.set(country.code, labels);
    for (const label of labels) {
      const list = byLabel.get(label) ?? [];
      if (!list.includes(country.code)) list.push(country.code);
      byLabel.set(label, list);
    }
  }
  return { byLabel, labelsByCode };
}

export type AnswerVerdict =
  /** přesná shoda */
  | 'correct'
  /** drobný překlep, uznáno */
  | 'typo'
  /** dítě napsalo jinou existující zemi – nikdy se neuznává */
  | 'wrongCountry'
  /** nic, co bychom poznali */
  | 'unknown'
  /** prázdný vstup */
  | 'empty';

export interface AnswerResult {
  verdict: AnswerVerdict;
  correct: boolean;
  /** kód země, kterou dítě omylem napsalo (jen u `wrongCountry`) */
  matchedCode?: string;
  /** vzdálenost k uznanému tvaru (jen u `typo`) */
  distance?: number;
}

interface Closest {
  code: string;
  distance: number;
  tolerance: number;
}

/** Nejbližší tvar mezi zadanými kódy. */
function closestAmong(
  input: string,
  codes: Iterable<string>,
  index: AnswerIndex,
  maxDistance: number,
): Closest | null {
  let best: Closest | null = null;
  for (const code of codes) {
    for (const label of index.labelsByCode.get(code) ?? []) {
      const tolerance = typoTolerance(label.length);
      const cap = Math.min(maxDistance, Math.max(tolerance, maxDistance));
      const distance = levenshtein(input, label, cap);
      if (distance > cap) continue;
      if (!best || distance < best.distance) {
        best = { code, distance, tolerance };
      }
    }
  }
  return best;
}

/**
 * Vyhodnotí napsanou odpověď.
 *
 * Pořadí je schválně takovéhle:
 * 1. přesná shoda na cíl → správně
 * 2. přesná shoda na JINOU zemi → chyba, tolerance překlepu se vůbec nespustí
 * 3. překlep se uzná jen tehdy, je-li cíl jednoznačně bližší než kterákoli
 *    jiná země
 */
export function checkAnswer(input: string, targetCode: string, index: AnswerIndex): AnswerResult {
  const normalized = normalize(input);
  if (!normalized) return { verdict: 'empty', correct: false };

  const exact = index.byLabel.get(normalized);
  if (exact?.includes(targetCode)) {
    return { verdict: 'correct', correct: true, distance: 0 };
  }
  if (exact && exact.length > 0) {
    return { verdict: 'wrongCountry', correct: false, matchedCode: exact[0] };
  }

  const target = closestAmong(normalized, [targetCode], index, 2);
  const otherCodes = [...index.labelsByCode.keys()].filter((c) => c !== targetCode);
  const other = closestAmong(normalized, otherCodes, index, 2);

  const targetAccepted = target !== null && target.distance <= target.tolerance;
  const otherAccepted = other !== null && other.distance <= other.tolerance;

  if (targetAccepted && (!other || target.distance < other.distance)) {
    return { verdict: 'typo', correct: true, distance: target.distance };
  }
  if (otherAccepted && (!target || other.distance < target.distance)) {
    return { verdict: 'wrongCountry', correct: false, matchedCode: other.code };
  }
  return { verdict: 'unknown', correct: false };
}
