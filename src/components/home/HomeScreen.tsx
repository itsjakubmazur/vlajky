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
import { ButtonLink, Eyebrow, Panel, ProgressRing } from '@/components/ui';
import { MasteryDot } from '@/components/MasteryBadge';
import { FlagImage } from '@/components/FlagImage';

/**
 * Každý režim se představí skutečnými vlajkami, ne ikonou – Dvojčata
 * ukazují rovnou Čad a Rumunsko, na kterých je celý režim postavený.
 */
const MODE_CARDS = [
  { mode: 'classic', flags: ['jp'] },
  { mode: 'reverse', flags: ['se', 'br'] },
  { mode: 'typing', flags: ['cz'] },
  { mode: 'twins', flags: ['td', 'ro'] },
] as const;

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
    <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-8">
      <header className="mb-6 flex items-baseline justify-between gap-3">
        <h1 className="display text-4xl">{APP_NAME}</h1>
        {progress.meta.streakDays > 1 ? (
          <span className="glass-thin rounded-pill px-3 py-1.5 text-xs font-extrabold text-gold">
            {cs.home.streak(progress.meta.streakDays)}
          </span>
        ) : null}
      </header>

      <div className="stagger flex flex-col gap-3">
        <Panel raised className="flex items-center gap-5">
          <ProgressRing value={stats.collected} total={pool.length}>
            <span className="display text-2xl leading-none tabular-nums">
              {ready ? stats.collected : '–'}
            </span>
            <span className="text-[0.65rem] font-bold tabular-nums text-faint">
              z {pool.length}
            </span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <Eyebrow>{cs.home.collectedLabel}</Eyebrow>
            <p className="display mt-0.5 text-xl">{cs.album.title}</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-gold">
              <MasteryDot mastery="gold" />
              <span className="tabular-nums">{stats.gold}</span>
              <span className="font-semibold text-faint">{cs.home.goldCount}</span>
            </p>
          </div>
        </Panel>

        {!progress.meta.placementDone ? (
          <Panel className="border-mint/25">
            <Eyebrow>{cs.modes.placement.name}</Eyebrow>
            <p className="mb-4 mt-1.5 text-sm leading-snug text-muted">
              {progress.meta.placementIndex > 0
                ? cs.placement.batchDone(progress.meta.placementIndex, placementTotal)
                : cs.home.placementHint}
            </p>
            <ButtonLink href={ROUTES.placement} variant="secondary" className="w-full">
              {progress.meta.placementIndex > 0 ? cs.placement.resume : cs.common.continue}
            </ButtonLink>
          </Panel>
        ) : null}

        <Panel raised>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <Eyebrow>{cs.home.todayLabel}</Eyebrow>
            {stats.due > 0 ? (
              <span className="display text-sm text-mint tabular-nums">{stats.due}</span>
            ) : null}
          </div>
          <p className="display text-xl">{cs.modes.review.name}</p>
          <p className="mb-4 mt-1 text-sm leading-snug text-muted">
            {stats.due > 0 ? cs.home.reviewDue(stats.due) : cs.home.reviewNoneDue}
          </p>
          <ButtonLink href={ROUTES.play(SLUG_BY_MODE.review)} className="w-full">
            {cs.home.play}
          </ButtonLink>
        </Panel>
      </div>

      <h2 className="eyebrow mb-3 mt-7">{cs.home.modes}</h2>
      <div className="stagger flex flex-col gap-2.5">
        {MODE_CARDS.map(({ mode, flags }) => (
          <Link
            key={mode}
            href={ROUTES.play(SLUG_BY_MODE[mode])}
            className="glass touch-target flex items-center gap-4 rounded-glass px-4 py-3 transition-[border-color,transform] duration-200 hover:border-white/25 active:scale-[0.99]"
          >
            <span className="flex h-11 w-[4.5rem] shrink-0 items-center justify-center">
              {flags.map((code, i) => (
                <span
                  key={code}
                  className="block"
                  style={{ marginLeft: i === 0 ? 0 : -14, transform: `rotate(${i === 0 ? -4 : 5}deg)` }}
                >
                  <FlagImage code={code} size="xs" glow={false} />
                </span>
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="display block text-lg leading-tight">{cs.modes[mode].name}</span>
              <span className="mt-0.5 block text-[0.78rem] leading-snug text-faint">
                {cs.modes[mode].desc}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-2.5">
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
