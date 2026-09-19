import type { AnswerLog } from '../srs/types';
import type { Continent, Country } from '../types';
import { CONTINENTS } from '../types';
import { createRng, seedFromString, shuffle } from '../rng';
import { speedOf } from './score';

/**
 * Denní mise. Tři úkoly na den, stejné pro celý den (klíč je datum),
 * aby se daly splnit napříč několika hrami.
 */
export type MissionKind = 'continent' | 'speed' | 'typed' | 'combo' | 'newFlags';

export interface Mission {
  id: string;
  kind: MissionKind;
  target: number;
  /** Jen u `continent`. */
  continent?: Continent;
  reward: number;
}

const POOL: Array<(rng: () => number) => Mission> = [
  (rng) => {
    const continent = shuffle(CONTINENTS, rng)[0]!;
    return {
      id: `continent-${continent}`,
      kind: 'continent',
      target: 5,
      continent,
      reward: 300,
    };
  },
  () => ({ id: 'speed-5', kind: 'speed', target: 5, reward: 300 }),
  () => ({ id: 'typed-3', kind: 'typed', target: 3, reward: 400 }),
  () => ({ id: 'combo-6', kind: 'combo', target: 6, reward: 500 }),
  () => ({ id: 'new-3', kind: 'newFlags', target: 3, reward: 400 }),
];

export function dailyMissions(dayKey: string): Mission[] {
  const rng = createRng(seedFromString(`mise-${dayKey}`));
  return shuffle(POOL, rng)
    .slice(0, 3)
    .map((build) => build(rng));
}

export interface MissionContext {
  /** Odpovědi z dnešního dne. */
  today: readonly AnswerLog[];
  /** Nejdelší dnešní série správných odpovědí. */
  bestComboToday: number;
  /** Kódy vlajek, které dnes hráč viděl úplně poprvé. */
  firstSeenToday: readonly string[];
  countryOf: (code: string) => Country | undefined;
}

export function missionProgress(mission: Mission, ctx: MissionContext): number {
  switch (mission.kind) {
    case 'continent': {
      const codes = new Set(
        ctx.today
          .filter((e) => e.correct && ctx.countryOf(e.code)?.continent === mission.continent)
          .map((e) => e.code),
      );
      return Math.min(mission.target, codes.size);
    }
    case 'speed':
      return Math.min(
        mission.target,
        ctx.today.filter((e) => e.correct && speedOf(e.elapsedMs) === 'flash').length,
      );
    case 'typed':
      return Math.min(
        mission.target,
        ctx.today.filter((e) => e.correct && e.mode === 'typing').length,
      );
    case 'combo':
      return Math.min(mission.target, ctx.bestComboToday);
    case 'newFlags':
      return Math.min(mission.target, ctx.firstSeenToday.length);
  }
}

export function isComplete(mission: Mission, ctx: MissionContext): boolean {
  return missionProgress(mission, ctx) >= mission.target;
}
