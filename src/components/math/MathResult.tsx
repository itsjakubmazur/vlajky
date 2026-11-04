'use client';

import { cs } from '@/i18n/cs';
import type { FactRange, OperationChoice } from '@/domain/math/facts';
import { recordScope, type MathQuestion } from '@/domain/math/session';
import type { RoundTally } from '@/domain/game/score';
import { ROUTES } from '@/config/routes';
import { useProgress, type RoundOutcome } from '@/store/StoreProvider';
import { useCountUp } from '@/components/useCountUp';
import { Button, ButtonLink, Eyebrow, Panel, ProgressRing } from '@/components/ui';
import { Confetti } from '@/components/Confetti';

export function MathResult({
  range,
  operation,
  tally,
  outcome,
  missed,
  onAgain,
}: {
  range: FactRange;
  operation: OperationChoice;
  tally: RoundTally;
  outcome: RoundOutcome | null;
  missed: MathQuestion[];
  onAgain: () => void;
}) {
  const { progress } = useProgress();
  const points = useCountUp(tally.points, 1100);
  const isRecord = outcome?.isRecord ?? false;
  const best = progress.math.records[recordScope(range, operation)];
  const perfect = tally.correct === tally.total && tally.total > 0;

  return (
    <div className="stagger mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
      {isRecord || perfect ? <Confetti seed={tally.points || 1} /> : null}

      <Panel raised className="flex items-center gap-5">
        <ProgressRing value={tally.correct} total={tally.total} size={104}>
          <span className="display text-3xl leading-none tabular-nums">{tally.correct}</span>
          <span className="text-xs font-bold tabular-nums text-faint">z {tally.total}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <h1 className="display text-2xl">{cs.math.resultTitle}</h1>
          <p className="display mt-1 text-3xl tabular-nums text-mint">
            {points}
            <span className="ml-1.5 text-sm font-bold text-faint">{cs.game.points}</span>
          </p>
          {perfect ? (
            <p className="mt-1 text-sm font-bold text-mint">{cs.math.allCorrect}</p>
          ) : null}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-2.5">
        <Panel className={isRecord ? 'border-gold/40' : ''}>
          <Eyebrow>{isRecord ? cs.game.record : cs.records.title}</Eyebrow>
          <p className={`display mt-1 text-lg tabular-nums ${isRecord ? 'text-gold' : ''}`}>
            {/* Nadpis panelu už „Nový rekord!“ říká – tady patří číslo. */}
            {isRecord
              ? outcome?.previous
                ? cs.game.recordBefore(outcome.previous.points)
                : cs.game.bestEver(tally.points)
              : best
                ? cs.game.bestEver(best.points)
                : cs.game.noRecord}
          </p>
        </Panel>
        <Panel>
          <Eyebrow>{cs.game.combo}</Eyebrow>
          <p className="display mt-1 text-lg tabular-nums text-gold">{tally.bestCombo}×</p>
        </Panel>
      </div>

      {missed.length > 0 ? (
        <Panel>
          <Eyebrow>{cs.math.missedTitle}</Eyebrow>
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Ukáže se přesně to, na co se kolo ptalo – 56 : 8, ne 7 × 8. */}
            {unique(missed).map((question) => (
              <span
                key={`${question.left}${question.op}${question.right}`}
                className="glass-thin display rounded-2xl px-3 py-2 text-base tabular-nums"
              >
                {question.left} {cs.math.sign[question.op]} {question.right} ={' '}
                <span className="text-mint">{question.answer}</span>
              </span>
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <Button onClick={onAgain}>{cs.math.again}</Button>
        <ButtonLink href={ROUTES.home} variant="ghost">
          {cs.common.back}
        </ButtonLink>
      </div>
    </div>
  );
}

/** Stejný příklad dvakrát za kolo se v přehledu ukáže jednou. */
function unique(questions: MathQuestion[]): MathQuestion[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    const id = `${question.left}${question.op}${question.right}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
