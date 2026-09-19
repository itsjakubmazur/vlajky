'use client';

import { useMemo } from 'react';
import { ALL_COUNTRIES, requireCountry } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import type { QuizModeId } from '@/domain/quiz/modes';
import { cs } from '@/i18n/cs';
import { useProgress } from '@/store/StoreProvider';
import { useQuizSession } from '@/quiz/useQuizSession';
import { FlagImage } from '@/components/FlagImage';
import { QuizShell } from './QuizShell';
import { OptionGrid } from './OptionGrid';
import { TwinsQuestion } from './TwinsQuestion';
import { TypingInput } from './TypingInput';
import { FeedbackPanel } from './FeedbackPanel';
import { ResultScreen } from './ResultScreen';

export function QuizScreen({ mode }: { mode: QuizModeId }) {
  const { progress } = useProgress();
  const session = useQuizSession(mode);
  const pool = useMemo(
    () => countriesInSet([...ALL_COUNTRIES], progress.meta.activeSet),
    [progress.meta.activeSet],
  );

  if (session.phase === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted">{cs.common.loading}</div>
    );
  }

  if (session.phase === 'done') {
    return (
      <div className="mx-auto w-full max-w-xl px-4">
        <ResultScreen
          correct={session.correctCount}
          total={session.total}
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

  return (
    <QuizShell index={session.index} total={session.total}>
      <div className="flex flex-1 flex-col gap-5">
        <h1 className="text-center text-lg font-bold text-muted">{prompt}</h1>

        {showsFlagInQuestion ? (
          <div key={question.code} className="animate-pop-in flex justify-center py-2">
            <FlagImage code={question.code} size="xl" />
          </div>
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
            onSubmit={session.answerWithText}
            onSkip={session.skip}
          />
        ) : null}

        {session.feedback ? (
          <FeedbackPanel feedback={session.feedback} onNext={session.next} />
        ) : null}
      </div>
    </QuizShell>
  );
}
