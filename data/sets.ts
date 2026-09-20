import { WORLD_SET } from '@/config/app';
import { CONTINENTS, type Continent, type Country } from '@/domain/types';

export type SetId = 'world' | 'territories';

export interface FlagSet {
  id: SetId;
  /** Klíč do `cs.sets` – název se nikdy nepíše natvrdo. */
  filter: (c: Country) => boolean;
}

const worldExtra: readonly string[] = WORLD_SET.extra;
const worldInclude: readonly string[] = WORLD_SET.include;

export const SETS: Record<SetId, FlagSet> = {
  world: {
    id: 'world',
    filter: (c) => worldInclude.includes(c.sovereignty) || worldExtra.includes(c.code),
  },
  territories: {
    id: 'territories',
    filter: (c) => c.sovereignty === 'territory',
  },
};

export function countriesInSet(all: Country[], set: SetId): Country[] {
  return all.filter(SETS[set].filter);
}

/** Část světa, na kterou se zrovna hraje. */
export type RegionId = Continent | 'all';

export const REGIONS: readonly RegionId[] = ['all', ...CONTINENTS];

export function countriesInRegion(pool: readonly Country[], region: RegionId): Country[] {
  return region === 'all' ? [...pool] : pool.filter((c) => c.continent === region);
}

/**
 * Nejmenší rozumná velikost části světa.
 *
 * Pod touhle hranicí by nešly poskládat ani čtyři možnosti, takže se taková
 * část vůbec nenabízí. Týká se to hlavně bonusové sady území.
 */
export const MIN_REGION_SIZE = 8;

export function playableRegions(pool: readonly Country[]): RegionId[] {
  return REGIONS.filter(
    (region) => region === 'all' || countriesInRegion(pool, region).length >= MIN_REGION_SIZE,
  );
}
