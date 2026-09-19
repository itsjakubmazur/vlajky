'use client';

import { useEffect, useState } from 'react';
import { requireCountry } from '@/domain/countries';
import type { QuizModeId } from '@/domain/quiz/modes';
import type { RoundTally } from '@/domain/game/score';
import { shareText } from '@/domain/game/daily';
import { cs } from '@/i18n/cs';
import { APP_NAME } from '@/config/app';
import { ROUTES } from '@/config/routes';
import { useProgress, type RoundOutcome } from '@/store/StoreProvider';
import { useGameFeedback } from '@/components/useGameFeedback';
import { Button, ButtonLink, Eyebrow, Panel, ProgressRing } from '@/components/ui';
import { useCountUp } from '@/components/useCountUp';
import { FlagImage } from '@/components/FlagImage';
import { Confetti } from '@/components/Confetti';

function encouragement(correct: number, total: number): string {
  if (total === 0) return cs.result.encouragement.keepGoing;
  const ratio = correct / total;
  if (ratio === 1) return cs.result.encouragement.perfect;
  if (ratio >= 0.8) return cs.result.encouragement.great;
  if (ratio >= 0.5) return cs.result.encouragement.good;
  return cs.result.encouragement.keepGoing;
}

export function ResultScreen({
  mode,
  tally,
  outcome,
  goldEarned,
  onAgain,
}: {
  mode: QuizModeId;
  tally: RoundTally;
  outcome: RoundOutcome | null;
  goldEarned: string[];
  onAgain: () => void;
}) {
  const { progress } = useProgress();
  const play = useGameFeedback();
  const shownPoints = useCountUp(tally.points, 1100);
  const [copied, setCopied] = useState(false);

  const isRecord = outcome?.isRecord ?? false;
  const best = progress.meta.records[mode];
  const isBoss = mode === 'boss';
  const bossWon = isBoss && tally.correct === tally.total && tally.total > 0;

  useEffect(() => {
    if (isRecord && tally.points > 0) play('record');
  }, [isRecord, tally.points, play]);

  const share = async () => {
    const text = shareText(
      {
        dayKey: Object.keys(progress.meta.dailyResults).sort().pop() ?? '',
        correct: tally.correct,
        total: tally.total,
        bestCombo: tally.bestCombo,
        elapsedMs: tally.elapsedMs,
        points: tally.points,
      },
      APP_NAME,
    );
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Sdílení uživatel zrušil – nic se neděje.
    }
  };

  const celebrate = isRecord || goldEarned.length > 0 || bossWon;

  return (
    <div className="stagger flex flex-col gap-4">
      {celebrate ? <Confetti seed={tally.points || 1} /> : null}

      <Panel raised className="flex items-center gap-5">
        <ProgressRing value={tally.correct} total={tally.total} size={104}>
          <span className="display text-3xl leading-none tabular-nums">{tally.correct}</span>
          <span className="text-xs font-bold tabular-nums text-faint">z {tally.total}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <h1 className="display text-2xl">
            {isBoss ? (bossWon ? cs.bosses.won : cs.bosses.lost) : cs.result.title}
          </h1>
          <p className="display mt-1 text-3xl tabular-nums text-mint">
            {shownPoints}
            <span className="ml-1.5 text-sm font-bold text-faint">{cs.game.points}</span>
          </p>
          <p className="mt-1 text-sm leading-snug text-muted">
            {encouragement(tally.correct, tally.total)}
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-2.5">
        <Panel className={isRecord ? 'border-gold/40' : ''}>
          <Eyebrow>{isRecord ? cs.game.record : cs.records.title}</Eyebrow>
          <p className={`display mt-1 text-lg tabular-nums ${isRecord ? 'text-gold' : ''}`}>
            {isRecord
              ? outcome?.previous
                ? cs.game.recordBefore(outcome.previous.points)
                : cs.game.record
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

      {goldEarned.length > 0 ? (
        <Panel className="border-gold/35">
          <Eyebrow>{cs.result.newGold(goldEarned.length)}</Eyebrow>
          <div className="mt-3 flex flex-wrap items-end justify-center gap-4">
            {goldEarned.map((code) => (
              <span key={code} className="flex w-20 flex-col items-center gap-2">
                <FlagImage code={code} size="md" glow priority pulse />
                <span className="text-center text-[0.7rem] font-bold leading-tight text-gold">
                  {requireCountry(code).nameCs}
                </span>
              </span>
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="flex flex-col gap-2.5">
        {mode === 'daily' ? (
          <Button onClick={() => void share()} variant={copied ? 'secondary' : 'primary'}>
            {copied ? cs.daily.copied : cs.daily.share}
          </Button>
        ) : (
          <Button onClick={onAgain}>{cs.result.again}</Button>
        )}
        <ButtonLink href={ROUTES.album} variant="secondary">
          {cs.result.toAlbum}
        </ButtonLink>
        <ButtonLink href={ROUTES.home} variant="ghost">
          {cs.common.back}
        </ButtonLink>
      </div>
    </div>
  );
}
