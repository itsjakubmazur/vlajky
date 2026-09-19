'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ALL_COUNTRIES } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { CONTINENTS, type Continent } from '@/domain/types';
import { cs } from '@/i18n/cs';
import { ROUTES } from '@/config/routes';
import { useProgress } from '@/store/StoreProvider';
import { FlagImage } from '@/components/FlagImage';
import { MasteryDot } from '@/components/MasteryBadge';
import { Card, ProgressBar } from '@/components/ui';
import { Confetti } from '@/components/Confetti';
import dynamic from 'next/dynamic';
import { CountrySheet } from './CountrySheet';

// Mapa s sebou nese geometrii světa – načte se až když ji někdo otevře.
const WorldMap = dynamic(() => import('./WorldMap').then((m) => m.WorldMap), {
  ssr: false,
  loading: () => <div className="aspect-[900/440] w-full animate-pulse rounded-2xl bg-bg" />,
});

type Filter = Continent | 'all';
type Tab = 'stickers' | 'map';

const RING = {
  new: 'ring-2 ring-line',
  bronze: 'ring-2 ring-bronze',
  silver: 'ring-2 ring-silver',
  gold: 'ring-2 ring-gold',
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
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      {allGold && filter !== 'all' ? <Confetti seed={shown.length} /> : null}

      <header className="mb-4 flex items-center gap-3">
        <Link href={ROUTES.home} className="touch-target -ml-2 inline-flex items-center px-2 text-sm font-semibold text-muted">
          {cs.common.back}
        </Link>
        <h1 className="text-2xl font-extrabold">{cs.album.title}</h1>
      </header>

      <Card className="mb-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm text-muted">{cs.album.collected(collected, shown.length)}</span>
          {allGold && filter !== 'all' ? (
            <span className="text-sm font-bold text-gold">
              {cs.album.continentDone(cs.continents[filter])}
            </span>
          ) : null}
        </div>
        <ProgressBar value={collected} total={shown.length} />
      </Card>

      <div className="mb-4 flex gap-2" role="tablist">
        {(['stickers', 'map'] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`touch-target flex-1 rounded-2xl border-2 px-4 text-sm font-bold ${
              tab === value ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted'
            }`}
          >
            {value === 'stickers' ? cs.album.stickers : cs.album.map}
          </button>
        ))}
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(['all', ...CONTINENTS] as Filter[]).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`touch-target shrink-0 rounded-full border px-4 text-sm font-semibold ${
              filter === value ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted'
            }`}
          >
            {value === 'all' ? cs.album.all : cs.continents[value]}
          </button>
        ))}
      </div>

      {tab === 'map' ? (
        <Card>
          <WorldMap
            masteryOf={masteryOf}
            inSet={(code) => codesInSet.has(code)}
            onSelect={(code) => (codesInSet.has(code) ? setSelected(code) : undefined)}
          />
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-muted">
            {(['new', 'bronze', 'silver', 'gold'] as const).map((level) => (
              <span key={level} className="inline-flex items-center gap-1.5">
                <MasteryDot mastery={level} />
                {cs.album.mastery[level]}
              </span>
            ))}
          </div>
        </Card>
      ) : shown.length === 0 ? (
        <p className="py-10 text-center text-muted">{cs.album.empty}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {shown.map((country) => {
            const mastery = masteryOf(country.code);
            return (
              <li key={country.code}>
                <button
                  type="button"
                  onClick={() => setSelected(country.code)}
                  className={`flex h-full w-full flex-col items-center gap-1.5 rounded-2xl bg-surface p-2 ${RING[mastery]} ${
                    mastery === 'new' ? 'opacity-45 grayscale' : ''
                  }`}
                >
                  <FlagImage code={country.code} size="md" />
                  <span className="line-clamp-2 text-center text-xs font-semibold leading-tight">
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
