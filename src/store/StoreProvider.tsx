'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SetId } from '~data/sets';
import type { AnswerInput } from '@/domain/srs/scheduler';
import { applyAnswer, emptyCardState } from '@/domain/srs/scheduler';
import { isLevelUp } from '@/domain/srs/mastery';
import type { CardState, Mastery } from '@/domain/srs/types';
import type { RoundTally } from '@/domain/game/score';
import type { DailyResult } from '@/domain/game/daily';
import { LocalStorageStore } from './LocalStorageStore';
import {
  dayKey,
  emptyProgress,
  nextStreak,
  type GameRecord,
  type Meta,
  type Progress,
  type ProgressStore,
} from './ProgressStore';

export interface AnswerOutcome {
  before: Mastery;
  after: Mastery;
  levelUp: boolean;
  card: CardState;
}

export interface RoundOutcome {
  /** Překonal hráč svůj rekord v tomhle režimu? */
  isRecord: boolean;
  previous: GameRecord | null;
}

interface ProgressContextValue {
  ready: boolean;
  progress: Progress;
  cardOf: (code: string) => CardState | undefined;
  masteryOf: (code: string) => Mastery;
  recordAnswer: (code: string, input: AnswerInput) => Promise<AnswerOutcome>;
  setMeta: (patch: Partial<Meta>) => Promise<void>;
  setActiveSet: (set: SetId) => Promise<void>;
  reset: () => Promise<void>;
  /** Uzavře kolo: připíše body a případně zapíše rekord. */
  finishRound: (mode: string, tally: RoundTally) => Promise<RoundOutcome>;
  beatBoss: (bossId: string) => Promise<void>;
  saveDaily: (result: DailyResult) => Promise<void>;
  claimMission: (day: string, missionId: string, reward: number) => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({
  children,
  store,
}: {
  children: ReactNode;
  /** Výměna úložiště (Supabase ve fázi 2) se řeší jen tady. */
  store?: ProgressStore;
}) {
  const storeRef = useRef<ProgressStore>(store ?? new LocalStorageStore());
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void storeRef.current.load().then((loaded) => {
      if (!active) return;
      setProgress({ ...loaded });
      setReady(true);
    });
    const unsubscribe = storeRef.current.subscribe(() => {
      void storeRef.current.load().then((loaded) => {
        if (active) setProgress({ ...loaded });
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const cardOf = useCallback((code: string) => progress.cards[code], [progress]);

  const masteryOf = useCallback(
    (code: string): Mastery => progress.cards[code]?.mastery ?? 'new',
    [progress],
  );

  const recordAnswer = useCallback(
    async (code: string, input: AnswerInput): Promise<AnswerOutcome> => {
      const now = new Date();
      const current = progress.cards[code] ?? emptyCardState(code, now);
      const before = current.mastery;
      const card = applyAnswer(current, input, now);

      const today = dayKey(now);
      await storeRef.current.saveCards([card]);
      await storeRef.current.logAnswer({
        code,
        mode: input.mode,
        correct: input.correct,
        elapsedMs: input.elapsedMs,
        at: now.toISOString(),
      });
      await storeRef.current.setMeta({
        lastPlayedDay: today,
        streakDays: nextStreak(progress.meta, today),
      });

      const updated = await storeRef.current.load();
      setProgress({ ...updated });

      return { before, after: card.mastery, levelUp: isLevelUp(before, card.mastery), card };
    },
    [progress],
  );

  const setMeta = useCallback(async (patch: Partial<Meta>) => {
    await storeRef.current.setMeta(patch);
    setProgress({ ...(await storeRef.current.load()) });
  }, []);

  const setActiveSet = useCallback(
    async (set: SetId) => {
      await setMeta({ activeSet: set });
    },
    [setMeta],
  );

  const finishRound = useCallback(
    async (mode: string, tally: RoundTally): Promise<RoundOutcome> => {
      const previous = progress.meta.records[mode] ?? null;
      const isRecord = !previous || tally.points > previous.points;

      const record: GameRecord = {
        points: tally.points,
        correct: tally.correct,
        total: tally.total,
        bestCombo: tally.bestCombo,
        elapsedMs: tally.elapsedMs,
        at: new Date().toISOString(),
      };

      await storeRef.current.setMeta({
        totalPoints: progress.meta.totalPoints + tally.points,
        records: isRecord
          ? { ...progress.meta.records, [mode]: record }
          : progress.meta.records,
      });
      setProgress({ ...(await storeRef.current.load()) });
      return { isRecord, previous };
    },
    [progress],
  );

  const beatBoss = useCallback(
    async (bossId: string) => {
      if (progress.meta.bossesBeaten.includes(bossId)) return;
      await storeRef.current.setMeta({
        bossesBeaten: [...progress.meta.bossesBeaten, bossId],
      });
      setProgress({ ...(await storeRef.current.load()) });
    },
    [progress],
  );

  const saveDaily = useCallback(
    async (result: DailyResult) => {
      await storeRef.current.setMeta({
        dailyResults: { ...progress.meta.dailyResults, [result.dayKey]: result },
      });
      setProgress({ ...(await storeRef.current.load()) });
    },
    [progress],
  );

  const claimMission = useCallback(
    async (day: string, missionId: string, reward: number) => {
      const claimed = progress.meta.missionsClaimed[day] ?? [];
      if (claimed.includes(missionId)) return;
      await storeRef.current.setMeta({
        missionsClaimed: { ...progress.meta.missionsClaimed, [day]: [...claimed, missionId] },
        totalPoints: progress.meta.totalPoints + reward,
      });
      setProgress({ ...(await storeRef.current.load()) });
    },
    [progress],
  );

  const reset = useCallback(async () => {
    await storeRef.current.reset();
    setProgress({ ...(await storeRef.current.load()) });
  }, []);

  const value = useMemo(
    () => ({
      ready,
      progress,
      cardOf,
      masteryOf,
      recordAnswer,
      setMeta,
      setActiveSet,
      reset,
      finishRound,
      beatBoss,
      saveDaily,
      claimMission,
    }),
    [
      ready,
      progress,
      cardOf,
      masteryOf,
      recordAnswer,
      setMeta,
      setActiveSet,
      reset,
      finishRound,
      beatBoss,
      saveDaily,
      claimMission,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress musí být uvnitř ProgressProvider');
  return ctx;
}
