'use client';

import { useMemo } from 'react';
import { ALL_COUNTRIES } from '@/domain/countries';
import { countriesInRegion, countriesInSet, playableRegions } from '~data/sets';
import { useProgress } from '@/store/StoreProvider';

/**
 * Vlajky, na které se zrovna hraje.
 *
 * `set` je celá sada (Svět / Území), `pool` je z ní vybraná část světa.
 * Denní výzva a souboje schválně berou `set`: denní výzva musí být pro
 * všechny stejná, jinak by nešla porovnat, a souboje spojují i vlajky
 * z různých světadílů (Irsko a Pobřeží slonoviny).
 */
export function useActivePool() {
  const { progress } = useProgress();
  const { activeSet, region } = progress.meta;

  const set = useMemo(() => countriesInSet([...ALL_COUNTRIES], activeSet), [activeSet]);
  const pool = useMemo(() => countriesInRegion(set, region), [set, region]);
  const regions = useMemo(() => playableRegions(set), [set]);

  return { set, pool, region, regions };
}
