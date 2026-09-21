'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useActivePool } from '@/quiz/useActivePool';
import { isDue } from '@/domain/srs/scheduler';
import { placementPlan } from '@/domain/srs/placement';
import { weakest } from '@/domain/srs/insight';
import { nextUp } from '@/domain/game/nextUp';
import { roundsPlayed } from '@/domain/game/party';
import { rankProgress } from '@/domain/game/ranks';
import { bossesFor } from '@/domain/game/bosses';
import { dayKey } from '@/domain/game/day';
import { APP_NAME } from '@/config/app';
import { ROUTES, SLUG_BY_MODE } from '@/config/routes';
import { cs } from '@/i18n/cs';
import { useProgress } from '@/store/StoreProvider';
import { ButtonLink, Eyebrow, Panel, ProgressBar, ProgressRing } from '@/components/ui';
import { MasteryDot } from '@/components/MasteryBadge';
import { FlagImage } from '@/components/FlagImage';
import { MissionsPanel } from './MissionsPanel';
import { RegionPicker } from './RegionPicker';

/**
 * Každý režim se představí skutečnými vlajkami, ne ikonou – Dvojčata
 * ukazují rovnou Čad a Rumunsko, na kterých je celý režim postavený.
 */
const MODE_CARDS = [
  { mode: 'classic', flags: ['jp'] },
  { mode: 'reverse', flags: ['se', 'br'] },
  { mode: 'typing', flags: ['cz'] },
  { mode: 'twins', flags: ['td', 'ro'] },
  { mode: 'flash', flags: ['np'] },
  { mode: 'risk', flags: ['qa'] },
  { mode: 'capitals', flags: ['fr'] },
  { mode: 'map', flags: ['bt'] },
  { mode: 'sort', flags: ['ke', 'pe', 'th'] },
  { mode: 'marathon', flags: ['us', 'cn', 'in'] },
] as const;

export function HomeScreen() {
  const { ready, progress } = useProgress();
  const today = dayKey(new Date());

  // Domovská ukazuje čísla za vybranou část světa – „12 ze 46“ dává
  // při hraní Evropy větší smysl než „12 ze 197“.
  const { set, pool, region } = useActivePool();

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

  // Jedno velké tlačítko, které rozhodne za dítě. Slabiny se počítají
  // přes celou sadu – stejně jako je ukazuje přehled.
  const weakCount = useMemo(() => {
    const codes = new Set(set.map((c) => c.code));
    return weakest(Object.values(progress.cards), (code) => codes.has(code)).length;
  }, [set, progress.cards]);

  const suggestion = nextUp({
    placementDone: progress.meta.placementDone,
    dailyDone: Boolean(progress.meta.dailyResults[today]),
    dueCount: stats.due,
    weakCount,
  });

  const suggestionHref =
    suggestion.mode === 'placement'
      ? ROUTES.placement
      : ROUTES.play(SLUG_BY_MODE[suggestion.mode]);

  const suggestionLabel =
    suggestion.reason === 'review'
      ? cs.home.nextUp.review(stats.due)
      : cs.home.nextUp[suggestion.reason];

  const rank = rankProgress(progress.meta.totalPoints);
  // Souboje spojují i vlajky z různých světadílů, proto celá sada.
  const bosses = useMemo(() => bossesFor(set), [set]);
  const dailyDone = progress.meta.dailyResults[today];
  const placementTotal = placementPlan(set).length;

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

      {/* Velké „Hrát“ – rozcestník až pod ním. */}
      <Panel raised className="mb-5 border-mint/30">
        <Eyebrow>{cs.home.nextUpTitle}</Eyebrow>
        <p className="mb-4 mt-1.5 text-sm leading-snug text-muted">{suggestionLabel}</p>
        <ButtonLink href={suggestionHref} className="w-full">
          {cs.home.play}
        </ButtonLink>
      </Panel>

      <div className="mb-5">
        <RegionPicker />
      </div>

      <div className="stagger flex flex-col gap-3">
        {/* Hodnost – jediné, co jde pořád dopředu. */}
        <Panel raised>
          <div className="flex items-center gap-5">
            <ProgressRing value={stats.collected} total={pool.length}>
              <span className="display text-2xl leading-none tabular-nums">
                {ready ? stats.collected : '–'}
              </span>
              <span className="text-[0.65rem] font-bold tabular-nums text-faint">
                z {pool.length}
              </span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <Eyebrow>{cs.game.rank}</Eyebrow>
              <p className="display mt-0.5 text-xl">{cs.game.ranks[rank.rank.id]}</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-gold">
                <MasteryDot mastery="gold" />
                <span className="tabular-nums">{stats.gold}</span>
                <span className="font-semibold text-faint">{cs.home.goldCount}</span>
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={rank.ratio * 100} total={100} />
            <p className="mt-1.5 text-[0.75rem] font-semibold text-faint">
              {rank.next
                ? cs.game.toNextRank(rank.pointsToNext, cs.game.ranks[rank.next.id] ?? '')
                : cs.game.maxRank}
            </p>
          </div>
        </Panel>

        {/* Denní výzva – důvod otevřít appku každý den. */}
        <Panel raised className={dailyDone ? '' : 'border-mint/30'}>
          <Eyebrow>{cs.daily.title}</Eyebrow>
          <p className="mb-4 mt-1.5 text-sm leading-snug text-muted">
            {dailyDone
              ? `${cs.daily.done} — ${cs.daily.result(dailyDone.correct, dailyDone.total)}`
              : cs.daily.desc}
          </p>
          <ButtonLink
            href={ROUTES.play(SLUG_BY_MODE.daily)}
            variant={dailyDone ? 'secondary' : 'primary'}
            className="w-full"
          >
            {dailyDone ? cs.result.again : cs.daily.play}
          </ButtonLink>
        </Panel>

        <MissionsPanel />

        {!progress.meta.placementDone ? (
          <Panel>
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

        <Panel>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <Eyebrow>{cs.home.todayLabel}</Eyebrow>
            {stats.due > 0 ? (
              <span className="display text-sm tabular-nums text-mint">{stats.due}</span>
            ) : null}
          </div>
          <p className="display text-xl">{cs.modes.review.name}</p>
          <p className="mb-4 mt-1 text-sm leading-snug text-muted">
            {stats.due > 0 ? cs.home.reviewDue(stats.due) : cs.home.reviewNoneDue}
          </p>
          <ButtonLink
            href={ROUTES.play(SLUG_BY_MODE.review)}
            variant="secondary"
            className="w-full"
          >
            {cs.home.play}
          </ButtonLink>
        </Panel>

        {/* Turnaj u jednoho zařízení – na dovolenou s rodinou. */}
        <Panel className={progress.meta.party ? 'border-mint/30' : ''}>
          <Eyebrow>{cs.party.title}</Eyebrow>
          <p className="mb-4 mt-1.5 text-sm leading-snug text-muted">
            {progress.meta.party
              ? cs.party.resumeHint(roundsPlayed(progress.meta.party))
              : cs.party.desc}
          </p>
          <ButtonLink
            href={ROUTES.party}
            variant={progress.meta.party ? 'primary' : 'secondary'}
            className="w-full"
          >
            {progress.meta.party ? cs.party.resume : cs.party.open}
          </ButtonLink>
        </Panel>

        {/* Souboje se zrádnými dvojicemi. */}
        <Link
          href={ROUTES.bosses}
          className="glass touch-target flex items-center gap-4 rounded-glass px-4 py-3 transition-[border-color,transform] duration-200 hover:border-white/25 active:scale-[0.99]"
        >
          <span className="flex w-[4.5rem] shrink-0 items-center justify-center">
            {['td', 'ro'].map((code, i) => (
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
            <span className="display block text-lg leading-tight">{cs.bosses.title}</span>
            <span className="mt-0.5 block text-[0.78rem] leading-snug text-faint">
              {cs.bosses.progress(progress.meta.bossesBeaten.length, bosses.length)}
            </span>
          </span>
        </Link>
      </div>

      <h2 className="eyebrow mb-3 mt-7">{cs.home.modes}</h2>
      <div className="stagger flex flex-col gap-2.5">
        {MODE_CARDS.map(({ mode, flags }) => {
          const record = progress.meta.records[`${mode}:${region}`];
          return (
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
                    style={{
                      marginLeft: i === 0 ? 0 : -16,
                      transform: `rotate(${(i - 1) * 5}deg)`,
                    }}
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
              {record ? (
                <span className="display shrink-0 text-xs tabular-nums text-mint">
                  {record.points}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col gap-2.5">
        <ButtonLink href={ROUTES.insight} variant="secondary">
          {cs.insight.open}
        </ButtonLink>
        <div className="grid grid-cols-2 gap-2.5">
          <ButtonLink href={ROUTES.album} variant="secondary">
            {cs.home.album}
          </ButtonLink>
          <ButtonLink href={ROUTES.settings} variant="secondary">
            {cs.home.settings}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
