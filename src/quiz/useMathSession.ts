'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildRound, ROUND_LENGTH, type MathQuestion } from '@/domain/math/session';
import type { FactRange } from '@/domain/math/facts';
import { clampElapsed, pointsFor, speedOf, type RoundTally } from '@/domain/game/score';
import { isDue } from '@/domain/srs/scheduler';
import { createRng } from '@/domain/rng';
import { useProgress, type RoundOutcome } from '@/store/StoreProvider';

/** Jak dlouho svítí „správně“, než naskočí další příklad. */
export const NEXT_DELAY_MS = 800;

export interface MathFeedback {
  correct: boolean;
  /** Co dítě napsalo – u chyby se to ukáže vedle správného výsledku. */
  given: number;
  product: number;
}

/**
 * Jedno kolo malé násobilky.
 *
 * Záměrně se nepoužívá `useQuizSession`: ta stojí na vlajkách, nabídkách
 * odpovědí a na sadě × části světa. Tady je otázka jen dvě čísla a odpověď
 * se píše, takže sdílet se vyplatí bodování a plánovač, ne celá smyčka.
 */
export function useMathSession(range: FactRange) {
  const { ready, progress, recordMathAnswer, finishMathRound } = useProgress();
  const [index, setIndex] = useState(0);
  const [entry, setEntry] = useState('');
  const [feedback, setFeedback] = useState<MathFeedback | null>(null);
  const [tally, setTally] = useState<RoundTally>({
    points: 0,
    correct: 0,
    total: 0,
    bestCombo: 0,
    flashCount: 0,
    elapsedMs: 0,
  });
  const [combo, setCombo] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null);

  const askedAt = useRef(Date.now());
  const awayMs = useRef(0);
  const awaySince = useRef<number | null>(null);
  const roundStart = useRef(Date.now());
  const settled = useRef(false);

  // Stopky se zastaví, když dítě odejde jinam – jinak by z otázky udělalo
  // „pomalou“ jen to, že se mezitím někam přepnulo.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') awaySince.current = Date.now();
      else if (awaySince.current !== null) {
        awayMs.current += Date.now() - awaySince.current;
        awaySince.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Kolo se losuje jednou. `ready` čeká na načtení postupu, aby se nesestavilo
  // z prázdných karet a nezačínalo pokaždé od jedniček.
  const questions = useMemo<MathQuestion[]>(() => {
    if (!ready) return [];
    return buildRound({
      cards: progress.math.cards,
      now: new Date(),
      rng: createRng(Date.now()),
      range,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, range]);

  const question = questions[index] ?? null;
  const finished = questions.length > 0 && index >= questions.length;

  const measureElapsed = useCallback(() => {
    const away = awayMs.current + (awaySince.current ? Date.now() - awaySince.current : 0);
    return clampElapsed(Date.now() - askedAt.current - away);
  }, []);

  const press = useCallback(
    (digit: string) => {
      if (feedback) return;
      // Tři číslice stačí: největší výsledek je 100.
      setEntry((value) => (value.length >= 3 ? value : (value + digit).replace(/^0+(?=\d)/, '')));
    },
    [feedback],
  );

  const backspace = useCallback(() => {
    if (feedback) return;
    setEntry((value) => value.slice(0, -1));
  }, [feedback]);

  const submit = useCallback(() => {
    if (!question || feedback || entry === '') return;
    const given = Number(entry);
    const correct = given === question.product;
    const elapsedMs = measureElapsed();
    const card = progress.math.cards[question.key];

    const gained = pointsFor({
      correct,
      elapsedMs,
      combo,
      isDue: card ? isDue(card, new Date()) : false,
      difficulty: 3,
    });

    setFeedback({ correct, given, product: question.product });
    setCombo((value) => (correct ? value + 1 : 0));
    setTally((value) => ({
      points: value.points + gained,
      correct: value.correct + (correct ? 1 : 0),
      total: value.total + 1,
      bestCombo: Math.max(value.bestCombo, correct ? combo + 1 : 0),
      flashCount: value.flashCount + (correct && speedOf(elapsedMs) === 'flash' ? 1 : 0),
      elapsedMs: 0,
    }));
    if (!correct) setMissed((value) => [...value, question.key]);

    void recordMathAnswer(question.key, {
      correct,
      elapsedMs,
      // Výsledek se píše, nevybírá – proto `typing`, a zlato se dá získat.
      mode: 'typing',
      ...(correct ? {} : { given: String(given) }),
    });
  }, [question, feedback, entry, measureElapsed, progress.math.cards, combo, recordMathAnswer]);

  const next = useCallback(() => {
    setFeedback(null);
    setEntry('');
    askedAt.current = Date.now();
    awayMs.current = 0;
    awaySince.current = null;
    setIndex((value) => value + 1);
  }, []);

  // Po správné odpovědi se jede dál samo – u počítání není co číst a čekání
  // by rytmus jen brzdilo. Po chybě nikdy: tam si má dítě přečíst výsledek.
  useEffect(() => {
    if (!feedback?.correct) return;
    const timer = setTimeout(next, NEXT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [feedback, next]);

  // Uzavření kola, právě jednou.
  useEffect(() => {
    if (!finished || settled.current) return;
    settled.current = true;
    const final = { ...tally, elapsedMs: Date.now() - roundStart.current };
    void finishMathRound(range === null ? 'all' : String(range), final).then(setOutcome);
    setTally(final);
  }, [finished, tally, finishMathRound, range]);

  return {
    ready,
    question,
    index,
    total: questions.length || ROUND_LENGTH,
    entry,
    feedback,
    combo,
    tally,
    missed,
    outcome,
    finished,
    press,
    backspace,
    submit,
    next,
  };
}
