'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_COUNTRIES, requireCountry } from '@/domain/countries';
import { MIN_REGION_SIZE } from '~data/sets';
import {
  buildQuestion,
  kindForMode,
  livesFor,
  SCORED_MODES,
  type Question,
  type QuizModeId,
} from '@/domain/quiz/modes';
import { buildSession, placementOrder } from '@/domain/quiz/session';
import { buildAnswerIndex, checkAnswer, type AnswerResult } from '@/domain/answer/match';
import { isDue } from '@/domain/srs/scheduler';
import { clampElapsed, pointsFor, speedOf, stakeLoss, type RoundTally } from '@/domain/game/score';
import { createRng } from '@/domain/rng';
import { PLACEMENT_BATCH } from '@/config/app';
import { cs } from '@/i18n/cs';
import { dayKey } from '@/store/ProgressStore';
import { useProgress, type AnswerOutcome, type RoundOutcome } from '@/store/StoreProvider';
import { useActivePool } from './useActivePool';

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
  /** Body za tuhle odpověď. */
  gained: number;
  /** Jak rychle to bylo. */
  speed: ReturnType<typeof speedOf>;
}

export interface QuizSession {
  phase: Phase;
  question: Question | null;
  index: number;
  total: number;
  correctCount: number;
  feedback: Feedback | null;
  hint: string | null;
  goldEarned: string[];
  /** Vlajky, které v tomhle kole utekly – ukazují se na konci. */
  missed: string[];
  /** Série správných odpovědí za sebou. */
  combo: number;
  bestCombo: number;
  points: number;
  /** `null` u režimů bez životů. */
  lives: number | null;
  /** Sázka pro další otázku (režim Vabank). */
  stake: number;
  setStake: (value: number) => void;
  tally: RoundTally;
  roundOutcome: RoundOutcome | null;
  answerWithCode: (code: string) => void;
  answerWithText: (text: string, viaSuggestion?: boolean) => void;
  skip: () => void;
  next: () => void;
  restart: () => void;
}

export interface SessionConfig {
  bossId?: string;
}

export function useQuizSession(mode: QuizModeId, config: SessionConfig = {}): QuizSession {
  const { ready, progress, setMeta, recordAnswer, finishRound, beatBoss, saveDaily } =
    useProgress();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [goldEarned, setGoldEarned] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [points, setPoints] = useState(0);
  const [lives, setLives] = useState<number | null>(livesFor(mode));
  const [stake, setStake] = useState(1);
  const [roundOutcome, setRoundOutcome] = useState<RoundOutcome | null>(null);
  const [nonce, setNonce] = useState(0);

  const askedAt = useRef<number>(Date.now());
  const roundStart = useRef<number>(Date.now());
  const settled = useRef(false);
  /** Čas strávený mimo aplikaci – z měření odpovědi se odečítá. */
  const awayMs = useRef(0);
  const awaySince = useRef<number | null>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        awaySince.current = Date.now();
      } else if (awaySince.current !== null) {
        awayMs.current += Date.now() - awaySince.current;
        awaySince.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /** Kolik času dítě nad otázkou skutečně strávilo. */
  const measureElapsed = useCallback(() => {
    const away = awayMs.current + (awaySince.current ? Date.now() - awaySince.current : 0);
    return clampElapsed(Date.now() - askedAt.current - away);
  }, []);

  const { set, pool: regionPool, region } = useActivePool();

  // Denní výzva musí být pro všechny stejná, souboje spojují vlajky
  // z různých světadílů a chytré opakování musí mít přednost před filtrem –
  // jinak by karty mimo vybranou část světa tiše vypadly z hlavy.
  const ignoresRegion = mode === 'daily' || mode === 'boss' || mode === 'review';
  const pool = ignoresRegion ? set : regionPool;

  // V malé části světa by nešly poskládat čtyři možnosti, tak se na
  // distraktory sáhne do celé sady.
  const distractorPool = pool.length >= MIN_REGION_SIZE ? pool : set;

  /** Rekord se vede zvlášť pro každou část světa – jinak by se mísily. */
  const recordKey = ignoresRegion ? mode : `${mode}:${region}`;

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
        : buildSession({
            mode,
            pool,
            cards: progress.cards,
            now,
            rng,
            dayKey: dayKey(now),
            bossId: config.bossId,
          });

    setQuestions(
      codes.map((code) =>
        buildQuestion({
          mode,
          target: requireCountry(code),
          pool: distractorPool,
          mastery: progress.cards[code]?.mastery ?? 'new',
          rng,
          kind: mode === 'review' ? kindForMode('review', rng) : undefined,
        }),
      ),
    );
    setIndex(0);
    setFeedback(null);
    setHint(null);
    setCorrectCount(0);
    setGoldEarned([]);
    setMissed([]);
    setCombo(0);
    setBestCombo(0);
    setPoints(0);
    setLives(livesFor(mode));
    setStake(1);
    setRoundOutcome(null);
    settled.current = false;
    askedAt.current = Date.now();
    roundStart.current = Date.now();
    awayMs.current = 0;
    awaySince.current = null;
    // Sezení se staví jen při startu (a při restartu přes `nonce`) – záměrně
    // nereagujeme na každou změnu postupu, jinak by se hra přestavěla po
    // každé odpovědi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mode, nonce, config.bossId, region, progress.meta.activeSet]);

  const question = questions[index] ?? null;
  const outOfLives = lives !== null && lives <= 0;
  const finished = questions.length > 0 && (index >= questions.length || outOfLives);

  const tally: RoundTally = useMemo(
    () => ({
      points,
      correct: correctCount,
      total: questions.length,
      bestCombo,
      flashCount: 0,
      elapsedMs: Date.now() - roundStart.current,
    }),
    [points, correctCount, questions.length, bestCombo],
  );

  const submit = useCallback(
    async (result: AnswerResult, given: string | null, typed = false, assisted = false) => {
      if (!question) return;
      const elapsedMs = measureElapsed();
      const card = progress.cards[question.code];
      const due = card ? isDue(card, new Date()) : false;

      const gained = pointsFor({
        correct: result.correct,
        elapsedMs,
        combo,
        isDue: due,
        difficulty: requireCountry(question.code).difficulty,
        stake,
      });
      const lost = result.correct ? 0 : stakeLoss(stake);

      const outcome = await recordAnswer(question.code, {
        correct: result.correct,
        elapsedMs,
        mode: question.kind === 'type' ? 'typing' : question.mode,
        isPlacement: mode === 'placement',
        assisted,
      });

      if (result.correct) {
        setCorrectCount((c) => c + 1);
        setCombo((c) => {
          const next = c + 1;
          setBestCombo((best) => Math.max(best, next));
          return next;
        });
        setPoints((p) => p + gained);
      } else {
        setCombo(0);
        setPoints((p) => Math.max(0, p - lost));
        setLives((l) => (l === null ? null : l - 1));
        setMissed((m) => (m.includes(question.code) ? m : [...m, question.code]));
      }

      if (outcome.after === 'gold' && outcome.before !== 'gold') {
        setGoldEarned((g) => [...g, question.code]);
      }
      setFeedback({
        correct: result.correct,
        result,
        outcome,
        given,
        typed,
        gained: result.correct ? gained : -lost,
        speed: speedOf(elapsedMs),
      });
    },
    [question, recordAnswer, mode, combo, stake, progress.cards, measureElapsed],
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
    (text: string, viaSuggestion = false) => {
      if (!question || feedback) return;
      const result = checkAnswer(text, question.code, answerIndex);
      if (result.verdict === 'ambiguous') {
        // Dvojznačná odpověď se vůbec nezapočítá – jen se doptáme.
        setHint(cs.quiz.ambiguous);
        return;
      }
      setHint(null);
      void submit(result, text, true, viaSuggestion);
    },
    [question, feedback, submit],
  );

  const skip = useCallback(() => {
    if (!question || feedback) return;
    void submit({ verdict: 'unknown', correct: false }, null);
  }, [question, feedback, submit]);

  const next = useCallback(() => {
    setFeedback(null);
    setHint(null);
    setStake(1);
    askedAt.current = Date.now();
    awayMs.current = 0;
    awaySince.current = null;
    setIndex((i) => i + 1);

    if (mode === 'placement') {
      const done = progress.meta.placementIndex + 1;
      const total = placementOrder(pool).length;
      void setMeta({ placementIndex: done, placementDone: done >= total });
    }
  }, [mode, progress.meta.placementIndex, pool, setMeta]);

  // Uzavření kola: body, rekord, souboj, denní výzva. Jen jednou.
  useEffect(() => {
    if (!finished || settled.current) return;
    settled.current = true;

    if (!SCORED_MODES.includes(mode)) return;
    const final = { ...tally, elapsedMs: Date.now() - roundStart.current };

    void (async () => {
      const outcome = await finishRound(recordKey, final);
      setRoundOutcome(outcome);

      if (mode === 'boss' && config.bossId && final.correct === final.total && final.total > 0) {
        await beatBoss(config.bossId);
      }
      if (mode === 'daily') {
        await saveDaily({
          dayKey: dayKey(new Date()),
          correct: final.correct,
          total: final.total,
          bestCombo: final.bestCombo,
          elapsedMs: final.elapsedMs,
          points: final.points,
        });
      }
    })();
  }, [finished, mode, recordKey, tally, finishRound, beatBoss, saveDaily, config.bossId]);

  const restart = useCallback(() => setNonce((n) => n + 1), []);

  const phase: Phase = !ready || questions.length === 0
    ? 'loading'
    : finished
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
    hint,
    goldEarned,
    missed,
    combo,
    bestCombo,
    points,
    lives,
    stake,
    setStake,
    tally,
    roundOutcome,
    answerWithCode,
    answerWithText,
    skip,
    next,
    restart,
  };
}
