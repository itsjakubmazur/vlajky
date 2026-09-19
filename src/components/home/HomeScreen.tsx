'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ALL_COUNTRIES } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { isDue } from '@/domain/srs/scheduler';
import { placementOrder } from '@/domain/quiz/session';
import { APP_NAME } from '@/config/app';
import { ROUTES, SLUG_BY_MODE } from '@/config/routes';
import { cs } from '@/i18n/cs';
import { useProgress } from '@/store/StoreProvider';
import { ButtonLink, Card, ProgressBar } from '@/components/ui';
import { MasteryDot } from '@/components/MasteryBadge';

const MODE_ORDER = ['classic', 'reverse', 'typing', 'twins'] as const;

export function HomeScreen() {
  const { ready, progress } = useProgress();

  const pool = useMemo(
    () => countriesInSet([...ALL_COUNTRIES], progress.meta.activeSet),
    [progress.meta.activeSet],
  );

  const stats = useMemo(() => {
    const now = new Date();
    let due = 0;
    let collected = 0;
    let gold = 0;
    for (const country of pool) {
      const card = progress.cards[country.code];
      if (!card) continue;
      if (card.mastery !== 'new') collected += 1;
      if (card.mastery === 'gold') gold += 1;
      if (isDue(card, now)) due += 1;
    }
    return { due, collected, gold };
  }, [pool, progress.cards]);

  const placementTotal = placementOrder(pool).length;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted">{cs.sets.worldDesc}</p>
      </header>

      {ready ? (
        <Card className="mb-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-semibold">{cs.album.title}</span>
            <span className="text-sm text-muted">
              {cs.album.collected(stats.collected, pool.length)}
            </span>
          </div>
          <ProgressBar value={stats.collected} total={pool.length} />
          <div className="mt-3 flex items-center gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <MasteryDot mastery="gold" />
              {stats.gold}
            </span>
            {progress.meta.streakDays > 1 ? (
              <span className="ml-auto font-semibold text-brand">
                {progress.meta.streakDays}&nbsp;🔥
              </span>
            ) : null}
          </div>
        </Card>
      ) : null}

      {!progress.meta.placementDone ? (
        <Card className="mb-4 border-brand/30 bg-brand-soft">
          <h2 className="font-bold">{cs.modes.placement.name}</h2>
          <p className="mb-3 mt-1 text-sm text-muted">
            {progress.meta.placementIndex > 0
              ? cs.placement.batchDone(progress.meta.placementIndex, placementTotal)
              : cs.home.placementHint}
          </p>
          <ButtonLink href={ROUTES.placement} className="w-full">
            {progress.meta.placementIndex > 0 ? cs.placement.resume : cs.common.continue}
          </ButtonLink>
        </Card>
      ) : null}

      <Card className="mb-6 border-brand/25">
        <h2 className="font-bold">{cs.modes.review.name}</h2>
        <p className="mb-3 mt-1 text-sm text-muted">
          {stats.due > 0 ? cs.home.reviewDue(stats.due) : cs.home.reviewNoneDue}
        </p>
        <ButtonLink href={ROUTES.play(SLUG_BY_MODE.review)} className="w-full">
          {cs.home.play}
        </ButtonLink>
      </Card>

      <h2 className="mb-3 font-bold text-muted">{cs.home.modes}</h2>
      <div className="mb-6 grid gap-3">
        {MODE_ORDER.map((mode) => (
          <Link
            key={mode}
            href={ROUTES.play(SLUG_BY_MODE[mode])}
            className="touch-target flex flex-col justify-center rounded-xl2 border border-line bg-surface px-4 py-3 transition-colors hover:border-brand/40"
          >
            <span className="text-lg font-bold">{cs.modes[mode].name}</span>
            <span className="text-sm text-muted">{cs.modes[mode].desc}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href={ROUTES.album} variant="secondary">
          {cs.home.album}
        </ButtonLink>
        <ButtonLink href={ROUTES.settings} variant="secondary">
          {cs.home.settings}
        </ButtonLink>
      </div>
    </div>
  );
}
