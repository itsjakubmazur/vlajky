'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cs } from '@/i18n/cs';
import { ROUTES } from '@/config/routes';
import { factsInRange, requireFact, type FactRange } from '@/domain/math/facts';
import { masteryRank } from '@/domain/srs/mastery';
import { weakestFacts } from '@/domain/math/session';
import { useProgress } from '@/store/StoreProvider';
import { Button, Eyebrow, Panel, ProgressBar } from '@/components/ui';
import { MathRound } from './MathRound';

/** Řady, které jdou procvičovat zvlášť. Jednička by byla jen přepisování. */
const ROWS: FactRange[] = [null, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function MathScreen() {
  const { ready, progress } = useProgress();
  const [range, setRange] = useState<FactRange>(null);
  const [playing, setPlaying] = useState(false);
  // Kolo se losuje při připojení komponenty, takže „ještě jednou“ musí
  // vyrobit nové – jinak by se opakovalo totéž pořadí příkladů.
  const [round, setRound] = useState(0);

  const cards = progress.math.cards;

  const stats = useMemo(() => {
    const facts = factsInRange(range);
    const done = facts.filter((fact) => masteryRank(cards[fact.key]?.mastery ?? 'new') >= 2).length;
    return { done, total: facts.length };
  }, [cards, range]);

  const weak = useMemo(() => weakestFacts(cards), [cards]);
  const best = progress.math.records[range === null ? 'all' : String(range)];

  if (playing) {
    return (
      <MathRound
        key={`${range ?? 'all'}-${round}`}
        range={range}
        onAgain={() => setRound((value) => value + 1)}
      />
    );
  }

  return (
    <div className="stagger mx-auto w-full max-w-xl px-4 pb-10 pt-4">
      <header className="mb-5 flex items-center gap-3">
        <Link
          href={ROUTES.home}
          className="touch-target inline-flex items-center rounded-pill px-3 text-sm font-extrabold text-muted transition-colors hover:text-ink"
        >
          {cs.common.back}
        </Link>
        <h1 className="display text-3xl">{cs.math.title}</h1>
      </header>

      <Panel raised className="mb-3">
        <p className="text-sm leading-snug text-muted">{cs.math.desc}</p>
        <div className="mt-4">
          <p className="display text-lg tabular-nums">{cs.math.mastered(stats.done, stats.total)}</p>
          <div className="mt-2">
            <ProgressBar value={stats.done} total={stats.total} />
          </div>
        </div>
        <p className="mt-3 text-[0.78rem] font-semibold text-faint">
          {best ? cs.math.record(best.points) : cs.math.noRecord}
        </p>
      </Panel>

      <Panel className="mb-3">
        <Eyebrow>{cs.math.rangeTitle}</Eyebrow>
        <div className="-mx-1 mt-2.5 flex flex-wrap gap-2 px-1">
          {ROWS.map((value) => (
            <button
              key={value ?? 'all'}
              type="button"
              onClick={() => setRange(value)}
              className={`rounded-pill px-4 py-2.5 text-[0.8rem] font-extrabold tabular-nums transition-colors ${
                range === value ? 'bg-ink text-abyss' : 'glass-thin text-muted hover:text-ink'
              }`}
            >
              {value === null ? cs.math.rangeAll : cs.math.rangeRow(value)}
            </button>
          ))}
        </div>
      </Panel>

      {weak.length > 0 ? (
        <Panel className="mb-3">
          <Eyebrow>{cs.math.weakTitle}</Eyebrow>
          <div className="mt-3 flex flex-wrap gap-2">
            {weak.map((entry) => {
              const fact = requireFact(entry.key);
              return (
                <span
                  key={entry.key}
                  className="glass-thin flex flex-col items-center rounded-2xl px-3 py-2"
                >
                  <span className="display text-base tabular-nums">
                    {fact.a} × {fact.b}
                  </span>
                  <span className="text-[0.65rem] font-bold text-coral">
                    {cs.math.wrongCount(entry.wrong)}
                  </span>
                </span>
              );
            })}
          </div>
          <p className="mt-2.5 text-[0.75rem] leading-snug text-faint">{cs.math.weakHint}</p>
        </Panel>
      ) : null}

      <Button className="w-full" disabled={!ready} onClick={() => setPlaying(true)}>
        {cs.math.start}
      </Button>

      {progress.math.totalAnswers > 0 ? (
        <p className="mt-6 text-center text-xs font-bold tabular-nums text-faint">
          {cs.math.answersTotal(progress.math.totalAnswers)}
        </p>
      ) : null}
    </div>
  );
}
