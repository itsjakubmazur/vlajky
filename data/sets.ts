import { WORLD_SET } from '@/config/app';
import type { Country } from '@/domain/types';

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
