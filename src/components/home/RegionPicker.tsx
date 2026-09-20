'use client';

import { countriesInRegion, type RegionId } from '~data/sets';
import { cs } from '@/i18n/cs';
import { useProgress } from '@/store/StoreProvider';
import { useActivePool } from '@/quiz/useActivePool';
import { Eyebrow } from '@/components/ui';

/**
 * Výběr části světa. Platí pro všechny režimy naráz – je to jedno místo,
 * kde se řekne „teď hrajeme Afriku“, a tím to končí.
 *
 * Denní výzva a souboje ho schválně ignorují; proč, je v useActivePool.
 */
export function RegionPicker() {
  const { setRegion } = useProgress();
  const { set, pool, region, regions } = useActivePool();

  const label = (id: RegionId) => (id === 'all' ? cs.home.regionAll : cs.continents[id]);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <Eyebrow>{cs.home.region}</Eyebrow>
        <span className="text-[0.72rem] font-bold tabular-nums text-faint">
          {cs.home.regionCount(pool.length)}
        </span>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {regions.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => void setRegion(id)}
            className={`touch-target shrink-0 rounded-pill px-4 text-[0.8rem] font-extrabold transition-colors duration-200 ${
              region === id ? 'bg-mint text-abyss' : 'glass-thin text-muted hover:text-ink'
            }`}
          >
            {label(id)}
            {id !== 'all' ? (
              <span className="ml-1.5 tabular-nums opacity-60">
                {countriesInRegion(set, id).length}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
