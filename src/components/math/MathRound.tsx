'use client';

import { useEffect } from 'react';
import { cs } from '@/i18n/cs';
import type { FactRange } from '@/domain/math/facts';
import { useMathSession } from '@/quiz/useMathSession';
import { useGameFeedback } from '@/components/useGameFeedback';
import { QuizShell } from '@/components/quiz/QuizShell';
import { Button } from '@/components/ui';
import { Keypad } from './Keypad';
import { MathResult } from './MathResult';

/** Jedno kolo: nahoře příklad, dole klávesnice u palce. */
export function MathRound({ range, onAgain }: { range: FactRange; onAgain: () => void }) {
  const session = useMathSession(range);
  const play = useGameFeedback();

  // Hardware klávesnice na tabletu s pouzdrem i na počítači – stejná
  // obrazovka, jen jiný způsob zadání.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key >= '0' && event.key <= '9') session.press(event.key);
      else if (event.key === 'Backspace') session.backspace();
      else if (event.key === 'Enter') {
        if (session.feedback && !session.feedback.correct) session.next();
        else session.submit();
      } else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session]);

  const { feedback } = session;
  useEffect(() => {
    if (feedback) play(feedback.correct ? 'correct' : 'wrong');
  }, [feedback, play]);

  if (session.finished) {
    return (
      <MathResult
        range={range}
        tally={session.tally}
        outcome={session.outcome}
        missed={session.missed}
        onAgain={onAgain}
      />
    );
  }

  const question = session.question;
  if (!question) return null;

  // I po chybě je v rámečku **správný** výsledek, takže svítí mátově jako
  // každá správná odpověď. Že se dítě spletlo, říká roztřesení příkladu
  // a korálová věta „Napsal jsi…“ – obarvit správný výsledek na červeno by
  // tvrdilo, že je špatný.
  const tone = feedback ? 'text-mint' : '';

  return (
    <QuizShell
      index={session.index}
      total={session.total}
      combo={session.combo}
      points={session.tally.points}
      lives={null}
    >
      <div className="flex flex-1 flex-col justify-center py-4">
        <p
          className={`display text-center text-5xl leading-none tabular-nums transition-colors duration-200 ${
            feedback && !feedback.correct ? 'animate-shake' : ''
          }`}
        >
          {question.left} × {question.right}
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <span className="display text-4xl leading-none text-faint">=</span>
          <span
            className={`glass-raised display flex h-16 min-w-[6rem] items-center justify-center rounded-2xl px-5 text-4xl leading-none tabular-nums transition-colors duration-200 ${tone}`}
          >
            {feedback && !feedback.correct ? question.product : session.entry || ' '}
          </span>
        </div>

        <p className="mt-4 h-10 text-center text-sm font-bold leading-snug">
          {feedback ? (
            feedback.correct ? (
              <span className="text-mint">{cs.math.correct}</span>
            ) : (
              <span className="text-coral">{cs.math.youWrote(feedback.given)}</span>
            )
          ) : (
            <span className="text-faint">{cs.math.keypadHint}</span>
          )}
        </p>
      </div>

      {/*
        Spodek má pevnou výšku v obou stavech. Kdyby se klávesnice vyměnila
        za nižší tlačítko, příklad nad ní by poskočil – a to je přesně to,
        čemu se celé rozvržení kvízu vyhýbá.
      */}
      <div className="flex h-[42svh] min-h-[15rem] max-h-[26rem] shrink-0 flex-col justify-end">
        {feedback && !feedback.correct ? (
          <Button className="w-full" onClick={session.next}>
            {cs.math.continue}
          </Button>
        ) : (
          <Keypad
            onDigit={session.press}
            onErase={session.backspace}
            onSubmit={session.submit}
            canSubmit={session.entry !== ''}
            disabled={feedback !== null}
          />
        )}
      </div>
    </QuizShell>
  );
}
