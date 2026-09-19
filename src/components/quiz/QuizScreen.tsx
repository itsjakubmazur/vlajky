'use client';

import { useEffect, useMemo, useState } from 'react';
import { ALL_COUNTRIES, requireCountry } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { FLASH_MS, type QuizModeId } from '@/domain/quiz/modes';
import { cs } from '@/i18n/cs';
import { useProgress } from '@/store/StoreProvider';
import { useQuizSession } from '@/quiz/useQuizSession';
import { FlagImage } from '@/components/FlagImage';
import { QuizShell } from './QuizShell';
import { OptionGrid } from './OptionGrid';
import { TwinsQuestion } from './TwinsQuestion';
import { TypingInput } from './TypingInput';
import { StakePicker } from './StakePicker';
import { FeedbackPanel } from './FeedbackPanel';
import { ResultScreen } from './ResultScreen';

export function QuizScreen({ mode, bossId }: { mode: QuizModeId; bossId?: string }) {
  const { progress } = useProgress();
  const session = useQuizSession(mode, { bossId });
  const pool = useMemo(
    () => countriesInSet([...ALL_COUNTRIES], progress.meta.activeSet),
    [progress.meta.activeSet],
  );

  // Režim Blesk: vlajka po dvou sekundách zmizí a odpovídá se po paměti.
  const [flashHidden, setFlashHidden] = useState(false);
  useEffect(() => {
    if (mode !== 'flash') return;
    setFlashHidden(false);
    const timer = setTimeout(() => setFlashHidden(true), FLASH_MS);
    return () => clearTimeout(timer);
  }, [mode, session.index]);

  if (session.phase === 'loading') {
    return (
      <div className="flex min-h-[var(--safe-height)] items-center justify-center text-sm font-bold text-faint">
        {cs.common.loading}
      </div>
    );
  }

  if (session.phase === 'done') {
    return (
      <div className="mx-auto flex min-h-[var(--safe-height)] w-full max-w-xl flex-col justify-center px-4 py-6">
        <ResultScreen
          mode={mode}
          tally={session.tally}
          outcome={session.roundOutcome}
          goldEarned={session.goldEarned}
          onAgain={session.restart}
        />
      </div>
    );
  }

  const question = session.question!;
  const target = requireCountry(question.code);
  const chosen = session.feedback
    ? question.kind === 'type'
      ? question.code
      : (session.feedback.given ?? question.code)
    : null;

  const prompt =
    question.kind === 'pickFlag'
      ? cs.quiz.whichFlag(target.nameCs)
      : question.kind === 'twins'
        ? cs.quiz.whichIs(target.nameCs)
        : question.kind === 'type'
          ? cs.quiz.typeCountry
          : cs.quiz.whichCountry;

  const showsFlagInQuestion = question.kind === 'pickCountry' || question.kind === 'type';
  const flagVisible = !(mode === 'flash' && flashHidden && !session.feedback);

  return (
    <QuizShell
      index={session.index}
      total={session.total}
      combo={session.combo}
      points={session.points}
      lives={session.lives}
    >
      <div
        className={`flex flex-1 flex-col ${showsFlagInQuestion ? '' : 'justify-center gap-6 py-4'}`}
      >
        {showsFlagInQuestion ? (
          <div className="flex flex-1 flex-col justify-center gap-6 py-4">
            <h1 className="display text-center text-xl text-muted">{prompt}</h1>
            <div key={question.code} className="animate-flag-reveal flex justify-center">
              {flagVisible ? (
                <FlagImage code={question.code} size="xl" priority />
              ) : (
                // Prázdné místo si drží velikost, ať obraz neposkočí.
                <span className="glass-thin flex h-[150px] w-[225px] items-center justify-center rounded-glass text-4xl font-black text-faint">
                  ?
                </span>
              )}
            </div>
          </div>
        ) : (
          <h1 className="display text-center text-xl text-muted">{prompt}</h1>
        )}

        <div key={`odpovedi-${session.index}`} className="flex flex-col gap-4">
          {mode === 'risk' && !session.feedback ? (
            <StakePicker value={session.stake} onChange={session.setStake} />
          ) : null}

          {question.kind === 'pickCountry' || question.kind === 'pickFlag' ? (
            <OptionGrid
              options={question.options}
              asFlags={question.kind === 'pickFlag'}
              correctCode={question.code}
              chosen={chosen}
              onChoose={session.answerWithCode}
            />
          ) : null}

          {question.kind === 'twins' ? (
            <TwinsQuestion
              options={question.options}
              correctCode={question.code}
              chosen={chosen}
              onChoose={session.answerWithCode}
            />
          ) : null}

          {question.kind === 'type' ? (
            <TypingInput
              pool={pool}
              disabled={session.phase === 'feedback'}
              hint={session.hint}
              onSubmit={session.answerWithText}
              onSkip={session.skip}
            />
          ) : null}

          {session.feedback ? (
            <FeedbackPanel feedback={session.feedback} onNext={session.next} />
          ) : null}
        </div>
      </div>
    </QuizShell>
  );
}
