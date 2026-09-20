'use client';

import { useMemo, useState } from 'react';
import { requireCountry } from '@/domain/countries';
import { bandStats, estimateKnown } from '@/domain/srs/placement';
import { fadingSoon, weakest, FORECAST_DAYS } from '@/domain/srs/insight';
import { ROUTES, SLUG_BY_MODE } from '@/config/routes';
import { cs } from '@/i18n/cs';
import { useActivePool } from '@/quiz/useActivePool';
import { useProgress } from '@/store/StoreProvider';
import { FlagImage } from '@/components/FlagImage';
import { CountrySheet } from '@/components/album/CountrySheet';
import { ButtonLink, Eyebrow, Panel } from '@/components/ui';

/** Malá dlaždice s vlajkou, názvem a jedním číslem pod ním. */
function FlagStat({
  code,
  note,
  onOpen,
}: {
  code: string;
  note: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass-thin flex w-[5.25rem] flex-col items-center gap-1.5 rounded-2xl p-2 transition-colors hover:border-white/20"
    >
      <FlagImage code={code} size="sm" glow={false} />
      <span className="text-center text-[0.65rem] font-bold leading-tight text-ink/90">
        {requireCountry(code).nameCs}
      </span>
      <span className="text-center text-[0.6rem] font-semibold leading-tight tabular-nums text-faint">
        {note}
      </span>
    </button>
  );
}

/**
 * Přehled, který ukazuje plánovač.
 *
 * Bez něj je FSRS černá skříňka: dítě nevidí, co se z hlavy vytrácí, ani
 * na čem to láme. „Tyhle ti za tři dny vypadnou z hlavy“ je konkrétní důvod
 * si zahrát – a na rozdíl od série dní se opírá o skutečný stav paměti.
 */
export function InsightScreen() {
  const { ready, progress, masteryOf } = useProgress();
  // Slabiny i předpověď jdou přes celou sadu, ne přes vybranou část světa:
  // vlajka, kterou dítě neumí, se nemá schovat jen proto, že hraje Evropu.
  const { set } = useActivePool();
  const [detail, setDetail] = useState<string | null>(null);

  const inSet = useMemo(() => {
    const codes = new Set(set.map((c) => c.code));
    return (code: string) => codes.has(code);
  }, [set]);

  const cards = useMemo(() => Object.values(progress.cards), [progress.cards]);
  const weak = useMemo(() => weakest(cards, inSet), [cards, inSet]);
  const fading = useMemo(
    () => fadingSoon(cards, inSet, new Date()),
    [cards, inSet],
  );

  const estimate = useMemo(() => {
    if (!progress.meta.placementDone) return null;
    return estimateKnown(bandStats(set, progress.meta.placementResults));
  }, [progress.meta.placementDone, progress.meta.placementResults, set]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-8">
      <h1 className="display mb-6 text-3xl">{cs.insight.title}</h1>

      <div className="stagger flex flex-col gap-3">
        {estimate !== null ? (
          <Panel>
            <Eyebrow>{cs.modes.placement.name}</Eyebrow>
            <p className="mt-1.5 text-sm leading-snug text-muted">
              {cs.insight.estimate(estimate, set.length)}
            </p>
            <p className="mt-1 text-[0.75rem] leading-snug text-faint">
              {cs.insight.estimateHint}
            </p>
          </Panel>
        ) : null}

        <Panel raised>
          <Eyebrow>{cs.insight.weakTitle}</Eyebrow>
          <p className="mt-1.5 text-sm leading-snug text-muted">
            {ready && weak.length === 0 ? cs.insight.weakEmpty : cs.insight.weakDesc}
          </p>
          {weak.length > 0 ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {weak.map((item) => (
                  <FlagStat
                    key={item.code}
                    code={item.code}
                    note={cs.insight.weakStat(item.seen - item.correct, item.seen)}
                    onOpen={() => setDetail(item.code)}
                  />
                ))}
              </div>
              <ButtonLink
                href={ROUTES.play(SLUG_BY_MODE.weak)}
                className="mt-4 w-full"
              >
                {cs.insight.train}
              </ButtonLink>
            </>
          ) : null}
        </Panel>

        <Panel>
          <div className="flex items-baseline justify-between gap-3">
            <Eyebrow>{cs.insight.fadingTitle}</Eyebrow>
            {fading.length > 0 ? (
              <span className="display text-sm tabular-nums text-mint">{fading.length}</span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm leading-snug text-muted">
            {ready && fading.length === 0 ? cs.insight.fadingEmpty : cs.insight.fadingDesc}
          </p>
          {fading.length > 0 ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {fading.map((item) => (
                  <FlagStat
                    key={item.code}
                    code={item.code}
                    note={cs.insight.recall(Math.round(item.recall * 100))}
                    onOpen={() => setDetail(item.code)}
                  />
                ))}
              </div>
              <p className="mt-2 text-[0.72rem] font-semibold text-faint">
                {cs.insight.recallIn(FORECAST_DAYS)}
              </p>
              <ButtonLink
                href={ROUTES.play(SLUG_BY_MODE.review)}
                variant="secondary"
                className="mt-3 w-full"
              >
                {cs.modes.review.name}
              </ButtonLink>
            </>
          ) : null}
        </Panel>
      </div>

      <ButtonLink href={ROUTES.home} variant="ghost" className="mt-6 w-full">
        {cs.common.back}
      </ButtonLink>

      {detail ? (
        <CountrySheet
          code={detail}
          mastery={masteryOf(detail)}
          inSet={inSet}
          onSelect={setDetail}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </div>
  );
}
