'use client';

import { useEffect, useState } from 'react';
import { requireCountry } from '@/domain/countries';
import { FLASH_MS, type QuizModeId } from '@/domain/quiz/modes';
import { cs } from '@/i18n/cs';
import { useQuizSession } from '@/quiz/useQuizSession';
import { useQuizKeyboard } from '@/quiz/useQuizKeyboard';
import { useActivePool } from '@/quiz/useActivePool';
import { FlagImage } from '@/components/FlagImage';
import { QuizShell } from './QuizShell';
import { OptionGrid } from './OptionGrid';
import { TwinsQuestion } from './TwinsQuestion';
import { TypingInput } from './TypingInput';
import { StakePicker } from './StakePicker';
import { FeedbackPanel } from './FeedbackPanel';
import { ResultScreen } from './ResultScreen';

export function QuizScreen({ mode, bossId }: { mode: QuizModeId; bossId?: string }) {
  const session = useQuizSession(mode, { bossId });
  const { set, pool: regionPool } = useActivePool();
  // Denní výzva a souboje jedou přes celou sadu, viz useActivePool.
  const pool = mode === 'daily' || mode === 'boss' ? set : regionPool;

  // Režim Blesk: vlajka po dvou sekundách zmizí a odpovídá se po paměti.
  const [flashHidden, setFlashHidden] = useState(false);
  useEffect(() => {
    if (mode !== 'flash') return;
    setFlashHidden(false);
    const timer = setTimeout(() => setFlashHidden(true), FLASH_MS);
    return () => clearTimeout(timer);
  }, [mode, session.index]);

  // Vabank: sází se naslepo. Vlajka se odhalí teprve po sázce – jinak by
  // dítě vsadilo tři jen tam, kde odpověď zná, a nešlo by o žádné riziko.
  const [staked, setStaked] = useState(false);
  useEffect(() => setStaked(false), [session.index, mode]);

  // Klávesnice: 1–4 vyberou odpověď, Enter posune dál. Hák musí být
  // nad všemi návraty, jinak by se pořadí háků mezi překresleními lišilo.
  const keyboardOptions = session.question?.options ?? [];
  useQuizKeyboard({
    options: keyboardOptions,
    onChoose: session.answerWithCode,
    onNext: session.feedback ? session.next : null,
    enabled: session.phase === 'question' || session.phase === 'feedback',
  });

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
          missed={session.missed}
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
  const awaitingStake = mode === 'risk' && !staked && !session.feedback;
  const flagVisible =
    !(mode === 'flash' && flashHidden && !session.feedback) && !awaitingStake;

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
          {awaitingStake ? (
            <StakePicker
              value={session.stake}
              onChange={(value) => {
                session.setStake(value);
                setStaked(true);
              }}
            />
          ) : null}

          {!awaitingStake && (question.kind === 'pickCountry' || question.kind === 'pickFlag') ? (
            <OptionGrid
              options={question.options}
              asFlags={question.kind === 'pickFlag'}
              correctCode={question.code}
              chosen={chosen}
              onChoose={session.answerWithCode}
            />
          ) : null}

          {!awaitingStake && question.kind === 'twins' ? (
            <TwinsQuestion
              options={question.options}
              correctCode={question.code}
              chosen={chosen}
              onChoose={session.answerWithCode}
            />
          ) : null}

          {!awaitingStake && question.kind === 'type' ? (
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
