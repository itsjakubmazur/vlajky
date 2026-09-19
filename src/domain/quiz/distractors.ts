import type { Country } from '../types';
import { shuffle, type Rng } from '../rng';

export interface DistractorOptions {
  count?: number;
  rng: Rng;
  /**
   * 0 = ať je to snadné (nabídneme vzdálené země),
   * 1 = ať to bolí (nabídneme zaměnitelné vlajky).
   */
  challenge?: number;
}

/**
 * Vybere špatné možnosti k otázce.
 *
 * Postupuje po vrstvách – nejdřív se bere z té, která je pro danou úroveň
 * hráče nejvhodnější, a teprve když nestačí, sáhne se do další.
 */
export function pickDistractors(
  target: Country,
  pool: readonly Country[],
  { count = 3, rng, challenge = 0.5 }: DistractorOptions,
): Country[] {
  const candidates = pool.filter((c) => c.code !== target.code);
  const similarSet = new Set(target.similar);

  const similar = candidates.filter((c) => similarSet.has(c.code));
  const subregion = candidates.filter((c) => !similarSet.has(c.code) && c.subregion === target.subregion);
  const continent = candidates.filter(
    (c) => !similarSet.has(c.code) && c.subregion !== target.subregion && c.continent === target.continent,
  );
  const sameLevel = candidates.filter(
    (c) => c.continent !== target.continent && Math.abs(c.difficulty - target.difficulty) <= 1,
  );
  const rest = candidates.filter(
    (c) => c.continent !== target.continent && Math.abs(c.difficulty - target.difficulty) > 1,
  );

  let tiers: Country[][];
  if (challenge >= 0.6) {
    tiers = [similar, subregion, continent, sameLevel, rest];
  } else if (challenge >= 0.3) {
    tiers = [subregion, similar, continent, sameLevel, rest];
  } else {
    // začátečníkovi nemá smysl podstrkávat Čad k Rumunsku
    tiers = [continent, sameLevel, rest, subregion, similar];
  }

  const chosen: Country[] = [];
  const used = new Set<string>();
  for (const tier of tiers) {
    for (const c of shuffle(tier, rng)) {
      if (chosen.length >= count) return chosen;
      if (used.has(c.code)) continue;
      used.add(c.code);
      chosen.push(c);
    }
  }
  return chosen;
}

/** Převede úroveň zvládnutí na míru obtížnosti nabízených možností. */
export function challengeFromMastery(mastery: 'new' | 'bronze' | 'silver' | 'gold'): number {
  switch (mastery) {
    case 'new':
      return 0.2;
    case 'bronze':
      return 0.45;
    case 'silver':
      return 0.7;
    case 'gold':
      return 0.9;
  }
}

/** Sestaví zamíchané možnosti pro otázku se čtyřmi tlačítky. */
export function buildOptions(target: Country, distractors: Country[], rng: Rng): Country[] {
  return shuffle([target, ...distractors], rng);
}
