'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_COUNTRIES, requireCountry } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { buildQuestion, kindForMode, type Question, type QuizModeId } from '@/domain/quiz/modes';
import { buildSession, placementOrder } from '@/domain/quiz/session';
import { buildAnswerIndex, checkAnswer, type AnswerResult } from '@/domain/answer/match';
import { createRng } from '@/domain/rng';
import { PLACEMENT_BATCH } from '@/config/app';
import { useProgress, type AnswerOutcome } from '@/store/StoreProvider';

/** Rejstřík se staví jednou nad všemi zeměmi – viz komentář v match.ts. */
const answerIndex = buildAnswerIndex(ALL_COUNTRIES);

export type Phase = 'loading' | 'question' | 'feedback' | 'done';

export interface Feedback {
  correct: boolean;
  result: AnswerResult;
  outcome: AnswerOutcome;
  /** Co dítě odpovědělo – kód země u tlačítek, text u psaní. */
  given: string | null;
  /** Psalo se, nebo klikalo? Podle toho vypadá zpětná vazba. */
  typed: boolean;
}

export interface QuizSession {
  phase: Phase;
  question: Question | null;
  index: number;
  total: number;
  correctCount: number;
  feedback: Feedback | null;
  goldEarned: string[];
  answerWithCode: (code: string) => void;
  answerWithText: (text: string) => void;
  skip: () => void;
  next: () => void;
  restart: () => void;
}

export function useQuizSession(mode: QuizModeId): QuizSession {
  const { ready, progress, setMeta } = useProgress();
  const recordAnswer = useProgress().recordAnswer;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [goldEarned, setGoldEarned] = useState<string[]>([]);
  const [nonce, setNonce] = useState(0);
  const askedAt = useRef<number>(Date.now());

  const pool = useMemo(
    () => countriesInSet([...ALL_COUNTRIES], progress.meta.activeSet),
    [progress.meta.activeSet],
  );

  // Otázky se sestaví jednou na začátku hry, ne při každém překreslení.
  useEffect(() => {
    if (!ready) return;
    const rng = createRng(Date.now() ^ nonce);
    const now = new Date();

    const codes =
      mode === 'placement'
        ? placementOrder(pool).slice(
            progress.meta.placementIndex,
            progress.meta.placementIndex + PLACEMENT_BATCH,
          )
        : buildSession({ mode, pool, cards: progress.cards, now, rng });

    setQuestions(
      codes.map((code) =>
        buildQuestion({
          mode,
          target: requireCountry(code),
          pool,
          mastery: progress.cards[code]?.mastery ?? 'new',
          rng,
          kind: mode === 'review' ? kindForMode('review', rng) : undefined,
        }),
      ),
    );
    setIndex(0);
    setFeedback(null);
    setCorrectCount(0);
    setGoldEarned([]);
    askedAt.current = Date.now();
    // Sezení se staví jen při startu (a při restartu přes `nonce`) – záměrně
    // nereagujeme na každou změnu postupu, jinak by se hra přestavěla po
    // každé odpovědi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mode, nonce]);

  const question = questions[index] ?? null;

  const submit = useCallback(
    async (result: AnswerResult, given: string | null, typed = false) => {
      if (!question) return;
      const elapsedMs = Date.now() - askedAt.current;
      const outcome = await recordAnswer(question.code, {
        correct: result.correct,
        elapsedMs,
        mode: question.kind === 'type' ? 'typing' : question.mode,
        isPlacement: mode === 'placement',
      });

      if (result.correct) setCorrectCount((c) => c + 1);
      if (outcome.after === 'gold' && outcome.before !== 'gold') {
        setGoldEarned((g) => [...g, question.code]);
      }
      setFeedback({ correct: result.correct, result, outcome, given, typed });
    },
    [question, recordAnswer, mode],
  );

  const answerWithCode = useCallback(
    (code: string) => {
      if (!question || feedback) return;
      const correct = code === question.code;
      void submit({ verdict: correct ? 'correct' : 'wrongCountry', correct, matchedCode: code }, code);
    },
    [question, feedback, submit],
  );

  const answerWithText = useCallback(
    (text: string) => {
      if (!question || feedback) return;
      void submit(checkAnswer(text, question.code, answerIndex), text, true);
    },
    [question, feedback, submit],
  );

  const skip = useCallback(() => {
    if (!question || feedback) return;
    void submit({ verdict: 'unknown', correct: false }, null);
  }, [question, feedback, submit]);

  const next = useCallback(() => {
    setFeedback(null);
    askedAt.current = Date.now();
    setIndex((i) => i + 1);

    if (mode === 'placement') {
      const done = progress.meta.placementIndex + 1;
      const total = placementOrder(pool).length;
      void setMeta({ placementIndex: done, placementDone: done >= total });
    }
  }, [mode, progress.meta.placementIndex, pool, setMeta]);

  const restart = useCallback(() => setNonce((n) => n + 1), []);

  const phase: Phase = !ready || questions.length === 0
    ? 'loading'
    : index >= questions.length
      ? 'done'
      : feedback
        ? 'feedback'
        : 'question';

  return {
    phase,
    question,
    index,
    total: questions.length,
    correctCount,
    feedback,
    goldEarned,
    answerWithCode,
    answerWithText,
    skip,
    next,
    restart,
  };
}
