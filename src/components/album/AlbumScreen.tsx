'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { ALL_COUNTRIES } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { CONTINENTS, type Continent } from '@/domain/types';
import { cs } from '@/i18n/cs';
import { ROUTES } from '@/config/routes';
import { useProgress } from '@/store/StoreProvider';
import { FlagImage } from '@/components/FlagImage';
import { MasteryDot } from '@/components/MasteryBadge';
import { Panel, ProgressBar } from '@/components/ui';
import { Confetti } from '@/components/Confetti';
import { CountrySheet } from './CountrySheet';

// Mapa s sebou nese geometrii světa – načte se až když ji někdo otevře.
const WorldMap = dynamic(() => import('./WorldMap').then((m) => m.WorldMap), {
  ssr: false,
  loading: () => <div className="aspect-[2/1] w-full animate-pulse rounded-glass bg-white/5" />,
});

type Filter = Continent | 'all';
type Tab = 'stickers' | 'map';

/** Získaná samolepka má prstenec v barvě úrovně, nezískaná je jen obrys. */
const RING = {
  new: 'ring-1 ring-white/8',
  bronze: 'ring-1 ring-bronze/60',
  silver: 'ring-1 ring-silver/60',
  gold: 'ring-1 ring-gold/70 shadow-[0_0_26px_-6px_var(--color-gold)]',
} as const;

export function AlbumScreen() {
  const { progress, masteryOf } = useProgress();
  const [filter, setFilter] = useState<Filter>('all');
  const [tab, setTab] = useState<Tab>('stickers');
  const [selected, setSelected] = useState<string | null>(null);

  const pool = useMemo(
    () => countriesInSet([...ALL_COUNTRIES], progress.meta.activeSet),
    [progress.meta.activeSet],
  );
  const codesInSet = useMemo(() => new Set(pool.map((c) => c.code)), [pool]);

  const shown = useMemo(
    () =>
      (filter === 'all' ? pool : pool.filter((c) => c.continent === filter)).sort((a, b) =>
        a.nameCs.localeCompare(b.nameCs, 'cs'),
      ),
    [pool, filter],
  );

  const collected = shown.filter((c) => masteryOf(c.code) !== 'new').length;
  const allGold = shown.length > 0 && shown.every((c) => masteryOf(c.code) === 'gold');

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-8">
      {allGold && filter !== 'all' ? <Confetti seed={shown.length} /> : null}

      <header className="mb-5 flex items-center gap-4">
        <Link
          href={ROUTES.home}
          className="touch-target -ml-2 inline-flex items-center rounded-pill px-2 text-sm font-extrabold text-muted transition-colors hover:text-ink"
        >
          {cs.common.back}
        </Link>
        <h1 className="display text-3xl">{cs.album.title}</h1>
      </header>

      <Panel className="mb-4">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <p className="display text-lg tabular-nums">
            {cs.album.collected(collected, shown.length)}
          </p>
          {allGold && filter !== 'all' ? (
            <span className="text-xs font-extrabold text-gold">
              {cs.album.continentDone(cs.continents[filter])}
            </span>
          ) : null}
        </div>
        <ProgressBar value={collected} total={shown.length} />
      </Panel>

      <div className="glass-thin mb-4 flex gap-1 rounded-pill p-1" role="tablist">
        {(['stickers', 'map'] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`flex-1 rounded-pill px-4 py-2.5 text-sm font-extrabold transition-colors duration-200 ${
              tab === value ? 'bg-mint text-abyss' : 'text-muted hover:text-ink'
            }`}
          >
            {value === 'stickers' ? cs.album.stickers : cs.album.map}
          </button>
        ))}
      </div>

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {(['all', ...CONTINENTS] as Filter[]).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-pill px-4 py-2 text-[0.8rem] font-extrabold transition-colors duration-200 ${
              filter === value
                ? 'bg-ink text-abyss'
                : 'glass-thin text-muted hover:text-ink'
            }`}
          >
            {value === 'all' ? cs.album.all : cs.continents[value]}
          </button>
        ))}
      </div>

      {tab === 'map' ? (
        <Panel>
          <WorldMap
            masteryOf={masteryOf}
            inSet={(code) => codesInSet.has(code)}
            onSelect={(code) => (codesInSet.has(code) ? setSelected(code) : undefined)}
          />
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[0.7rem] font-bold text-faint">
            {(['new', 'bronze', 'silver', 'gold'] as const).map((level) => (
              <span key={level} className="inline-flex items-center gap-2">
                <MasteryDot mastery={level} />
                {cs.album.mastery[level]}
              </span>
            ))}
          </div>
        </Panel>
      ) : shown.length === 0 ? (
        <p className="py-14 text-center text-sm text-faint">{cs.album.empty}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {shown.map((country) => {
            const mastery = masteryOf(country.code);
            const earned = mastery !== 'new';
            return (
              <li key={country.code}>
                <button
                  type="button"
                  onClick={() => setSelected(country.code)}
                  className={`flex h-full w-full flex-col items-center gap-2 rounded-2xl p-2.5 transition-transform duration-200 active:scale-[0.97] ${RING[mastery]} ${
                    earned ? 'bg-white/[0.07]' : 'bg-white/[0.02]'
                  }`}
                >
                  <FlagImage code={country.code} size="md" glow={earned} muted={!earned} />
                  <span
                    className={`line-clamp-2 text-center text-[0.68rem] font-bold leading-tight ${
                      earned ? 'text-ink' : 'text-faint'
                    }`}
                  >
                    {country.nameCs}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected ? (
        <CountrySheet
          code={selected}
          mastery={masteryOf(selected)}
          inSet={(code) => codesInSet.has(code)}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
