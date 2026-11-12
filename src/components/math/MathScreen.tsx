'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cs } from '@/i18n/cs';
import { ROUTES } from '@/config/routes';
import { requireFact, type FactRange } from '@/domain/math/facts';
import {
  ADD_SUB_LIMITS,
  factsFor,
  OPERATIONS,
  recordScope,
  usesCards,
  type Operation,
} from '@/domain/math/operations';
import { masteryRank } from '@/domain/srs/mastery';
import { formatFact, weakestFacts } from '@/domain/math/session';
import { useProgress } from '@/store/StoreProvider';
import { Button, Eyebrow, Panel, ProgressBar } from '@/components/ui';
import { MathRound } from './MathRound';

/** Řady, které jdou procvičovat zvlášť. Jednička by byla jen přepisování. */
const ROWS: FactRange[] = [null, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Výchozí řada při přepnutí operace: u sčítání sto, jinde všechno. */
function defaultRange(operation: Operation): FactRange {
  return operation === 'addsub' ? 100 : null;
}

/** Ikonka na tlačítku operace – příklad, ne obrázek. */
const SAMPLE: Record<Operation, string> = {
  addsub: '8+5',
  mul: '7×8',
  div: '56:7',
  muldiv: '×  :',
};

export function MathScreen() {
  const { ready, progress } = useProgress();
  const [operation, setOperation] = useState<Operation>('mul');
  const [range, setRange] = useState<FactRange>(null);
  const [playing, setPlaying] = useState(false);
  // Kolo se losuje při připojení komponenty, takže „ještě jednou“ musí
  // vyrobit nové – jinak by se opakovalo totéž pořadí příkladů.
  const [round, setRound] = useState(0);

  const cards = progress.math.cards;

  const scheduled = usesCards(operation);
  const pool = useMemo(() => factsFor(operation, range), [operation, range]);

  const stats = useMemo(() => {
    const done = pool.filter((fact) => masteryRank(cards[fact.key]?.mastery ?? 'new') >= 2).length;
    return { done, total: pool.length };
  }, [cards, pool]);

  // Slabiny z celé operace, ne jen z vybrané řady – ať je vidět, kam se
  // vyplatí přepnout.
  const weak = useMemo(() => weakestFacts(cards, 6, factsFor(operation, null)), [cards, operation]);
  const best = progress.math.records[recordScope(operation, range)];

  const choose = (value: Operation) => {
    setOperation(value);
    setRange(defaultRange(value));
  };

  const ranges: FactRange[] = operation === 'addsub' ? [...ADD_SUB_LIMITS] : ROWS;
  const rangeLabel = (value: FactRange) => {
    if (operation === 'addsub') return cs.math.rangeLimit(value ?? 100);
    if (value === null) return cs.math.rangeAll;
    return operation === 'div' ? cs.math.rangeDivisor(value) : cs.math.rangeRow(value);
  };

  if (playing) {
    return (
      <MathRound
        key={`${operation}-${range ?? 'all'}-${round}`}
        operation={operation}
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
          className="touch-target inline-flex items-center rounded-pill px-3 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          {cs.common.back}
        </Link>
        <h1 className="display text-3xl">{cs.math.title}</h1>
      </header>

      <Panel className="mb-3">
        <Eyebrow>{cs.math.operationTitle}</Eyebrow>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {OPERATIONS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={operation === value}
              onClick={() => choose(value)}
              className={`touch-target flex flex-col items-start gap-1 rounded-2xl px-3.5 py-3 text-left transition-colors ${
                operation === value ? 'bg-ink text-abyss' : 'surface-thin text-muted hover:text-ink'
              }`}
            >
              <span
                className={`display text-xl leading-none tabular-nums ${
                  operation === value ? '' : 'text-ink'
                }`}
              >
                {SAMPLE[value]}
              </span>
              <span className="text-[0.8rem] font-semibold leading-tight">
                {cs.math.operations[value]}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel raised className="mb-3">
        {scheduled ? (
          <div>
            <p className="display text-lg tabular-nums">{cs.math.mastered(stats.done, stats.total)}</p>
            <div className="mt-2">
              <ProgressBar value={stats.done} total={stats.total} />
            </div>
          </div>
        ) : (
          <p className="text-sm leading-snug text-muted">{cs.math.addSubHint}</p>
        )}
        <p className="mt-3 text-[0.78rem] font-semibold text-faint">
          {best ? cs.math.record(best.points) : cs.math.noRecord}
        </p>
      </Panel>

      <Panel className="mb-3">
        <Eyebrow>{cs.math.rangeTitle}</Eyebrow>
        <div className="-mx-1 mt-2.5 flex flex-wrap gap-2 px-1">
          {ranges.map((value) => (
            <button
              key={value ?? 'all'}
              type="button"
              onClick={() => setRange(value)}
              className={`rounded-pill px-4 py-2.5 text-[0.8rem] font-semibold tabular-nums transition-colors ${
                range === value ? 'bg-ink text-abyss' : 'surface-thin text-muted hover:text-ink'
              }`}
            >
              {rangeLabel(value)}
            </button>
          ))}
        </div>
      </Panel>

      {scheduled && weak.length > 0 ? (
        <Panel className="mb-3">
          <Eyebrow>{cs.math.weakTitle}</Eyebrow>
          <div className="mt-3 flex flex-wrap gap-2">
            {weak.map((entry) => {
              const fact = requireFact(entry.key);
              return (
                <span
                  key={entry.key}
                  className="surface-thin flex flex-col items-center rounded-2xl px-3 py-2"
                >
                  <span className="display text-base tabular-nums">{formatFact(fact)}</span>
                  <span className="text-[0.65rem] font-semibold text-coral">
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
        <p className="mt-6 text-center text-xs font-semibold tabular-nums text-faint">
          {cs.math.answersTotal(progress.math.totalAnswers)}
        </p>
      ) : null}
    </div>
  );
}
