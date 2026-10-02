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
import type { RegionId, SetId } from '~data/sets';
import type { AnswerInput } from '@/domain/srs/scheduler';
import { applyAnswer, emptyCardState } from '@/domain/srs/scheduler';
import { isLevelUp } from '@/domain/srs/mastery';
import type { CardState, Mastery } from '@/domain/srs/types';
import type { RoundTally } from '@/domain/game/score';
import type { DailyResult } from '@/domain/game/daily';
import { snapshotOf, withSnapshot } from '@/domain/game/history';
import { ALL_COUNTRIES } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { LocalStorageStore } from './LocalStorageStore';
import { mergeProgress } from './merge';
import {
  dayKey,
  emptyProgress,
  LOG_LIMIT,
  migrate,
  nextStreak,
  type GameRecord,
  type Meta,
  type Progress,
  type ProgressStore,
  type StoreHealth,
} from './ProgressStore';

export interface AnswerOutcome {
  before: Mastery;
  after: Mastery;
  levelUp: boolean;
  card: CardState;
}

/** Spojit se stávajícím postupem, nebo ho přepsat? */
export type RestoreMode = 'merge' | 'replace';

export interface RoundOutcome {
  /** Překonal hráč svůj rekord v tomhle režimu? */
  isRecord: boolean;
  previous: GameRecord | null;
}

interface ProgressContextValue {
  ready: boolean;
  /** Samo úložiště – potřebuje ho synchronizace, komponenty ne. */
  store: ProgressStore;
  progress: Progress;
  cardOf: (code: string) => CardState | undefined;
  masteryOf: (code: string) => Mastery;
  recordAnswer: (code: string, input: AnswerInput) => Promise<AnswerOutcome>;
  setMeta: (patch: Partial<Meta>) => Promise<void>;
  /**
   * Změna spočítaná z **uloženého** stavu. Všechno, co přičítá nebo navazuje
   * na předchozí hodnotu, musí jít tudy – `setMeta` s číslem spočítaným
   * z `progress` přepíše, co mezitím uložil někdo jiný.
   */
  updateMeta: (fn: (meta: Meta) => void) => Promise<void>;
  /** Stav ukládání – kvůli upozornění, že se postup neukládá. */
  health: StoreHealth;
  setActiveSet: (set: SetId) => Promise<void>;
  setRegion: (region: RegionId) => Promise<void>;
  reset: () => Promise<void>;
  /** Nahraje postup ze zálohy – spojí ho, nebo jím přepíše ten současný. */
  restore: (incoming: Progress, mode: RestoreMode) => Promise<void>;
  /** Uzavře kolo: připíše body a případně zapíše rekord. */
  finishRound: (mode: string, tally: RoundTally) => Promise<RoundOutcome>;
  beatBoss: (bossId: string) => Promise<void>;
  saveDaily: (result: DailyResult) => Promise<void>;
  claimMission: (day: string, missionId: string, reward: number) => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

/** Kódy v sadě se počítají jednou na sadu, ne při každé odpovědi. */
const setCodes = new Map<SetId, string[]>();
function codesInActiveSet(set: SetId): string[] {
  const found = setCodes.get(set);
  if (found) return found;
  const codes = countriesInSet([...ALL_COUNTRIES], set).map((c) => c.code);
  setCodes.set(set, codes);
  return codes;
}

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
  const [health, setHealth] = useState<StoreHealth>(() => ({
    saved: true,
    lastSavedAt: null,
    recovered: false,
  }));

  useEffect(() => {
    let active = true;
    void storeRef.current.load().then((loaded) => {
      if (!active) return;
      setProgress({ ...loaded });
      setHealth(storeRef.current.health());
      setReady(true);
    });
    // Ohlášení přijde i z druhé záložky (událost `storage`), takže se stav
    // přečte znovu a obě okna ukazují totéž.
    const unsubscribe = storeRef.current.subscribe(() => {
      void storeRef.current.load().then((loaded) => {
        if (!active) return;
        setProgress({ ...loaded });
        setHealth(storeRef.current.health());
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

      // Turnaj se nezapisuje vůbec – ani karta, ani log, ani série dní.
      if (input.offTheRecord) {
        return { before, after: before, levelUp: false, card: current };
      }

      const card = input.skipsScheduler ? current : applyAnswer(current, input, now);
      const today = dayKey(now);

      // Karta, log, série i denní snímek jedním zápisem. Dřív to byly tři
      // zápisy a snímek i série se počítaly ze stavu Reactu, takže druhá
      // odpověď ve stejném tiknutí přepsala tu první.
      const updated = await storeRef.current.update((draft) => {
        if (!input.skipsScheduler) draft.cards[code] = card;
        draft.log.push({
          code,
          mode: input.mode,
          correct: input.correct,
          elapsedMs: input.elapsedMs,
          at: now.toISOString(),
          ...(input.given ? { given: input.given } : {}),
        });
        if (draft.log.length > LOG_LIMIT) draft.log = draft.log.slice(-LOG_LIMIT);
        draft.meta.totalAnswers += 1;
        draft.meta.streakDays = nextStreak(draft.meta, today);
        draft.meta.lastPlayedDay = today;
        // Denní snímek sbírky – graf v přehledu se z logu poskládat nedá,
        // ten má strop na 500 odpovědí.
        draft.meta.history = withSnapshot(
          draft.meta.history,
          today,
          snapshotOf(draft.cards, codesInActiveSet(draft.meta.activeSet)),
        );
      });
      setProgress({ ...updated });

      return { before, after: card.mastery, levelUp: isLevelUp(before, card.mastery), card };
    },
    [progress],
  );

  const setMeta = useCallback(async (patch: Partial<Meta>) => {
    await storeRef.current.setMeta(patch);
    setProgress({ ...(await storeRef.current.load()) });
  }, []);

  /** Změna, která se počítá z uložené hodnoty (index v testu a podobně). */
  const updateMeta = useCallback(async (fn: (meta: Meta) => void) => {
    const updated = await storeRef.current.update((draft) => fn(draft.meta));
    setProgress({ ...updated });
  }, []);

  const setActiveSet = useCallback(
    async (set: SetId) => {
      await setMeta({ activeSet: set });
    },
    [setMeta],
  );

  const setRegion = useCallback(
    async (region: RegionId) => {
      await setMeta({ region });
    },
    [setMeta],
  );

  const finishRound = useCallback(
    async (mode: string, tally: RoundTally): Promise<RoundOutcome> => {
      const record: GameRecord = {
        points: tally.points,
        correct: tally.correct,
        total: tally.total,
        bestCombo: tally.bestCombo,
        elapsedMs: tally.elapsedMs,
        at: new Date().toISOString(),
      };

      // Body se přičítají k tomu, co je **uložené**, ne k tomu, co drží
      // React. Jinak dvě kola uzavřená po sobě připsala jen jedno.
      let previous: GameRecord | null = null;
      let isRecord = false;
      const updated = await storeRef.current.update((draft) => {
        previous = draft.meta.records[mode] ?? null;
        isRecord = !previous || tally.points > previous.points;
        draft.meta.totalPoints += tally.points;
        if (isRecord) draft.meta.records = { ...draft.meta.records, [mode]: record };
      });
      setProgress({ ...updated });
      return { isRecord, previous };
    },
    [],
  );

  const beatBoss = useCallback(async (bossId: string) => {
    const updated = await storeRef.current.update((draft) => {
      if (draft.meta.bossesBeaten.includes(bossId)) return;
      draft.meta.bossesBeaten = [...draft.meta.bossesBeaten, bossId];
    });
    setProgress({ ...updated });
  }, []);

  const saveDaily = useCallback(async (result: DailyResult) => {
    const updated = await storeRef.current.update((draft) => {
      draft.meta.dailyResults = { ...draft.meta.dailyResults, [result.dayKey]: result };
    });
    setProgress({ ...updated });
  }, []);

  const claimMission = useCallback(async (day: string, missionId: string, reward: number) => {
    const updated = await storeRef.current.update((draft) => {
      const claimed = draft.meta.missionsClaimed[day] ?? [];
      // Dvojklik na „vyzvednout“ nesmí připsat odměnu dvakrát. Kontrola
      // proto patří sem, k uloženému stavu, ne před zápis.
      if (claimed.includes(missionId)) return;
      draft.meta.missionsClaimed = { ...draft.meta.missionsClaimed, [day]: [...claimed, missionId] };
      draft.meta.totalPoints += reward;
    });
    setProgress({ ...updated });
  }, []);

  const reset = useCallback(async () => {
    await storeRef.current.reset();
    setProgress({ ...(await storeRef.current.load()) });
  }, []);

  const restore = useCallback(async (incoming: Progress, mode: RestoreMode) => {
    const updated = await storeRef.current.update((draft) => {
      const next = mode === 'merge' ? mergeProgress(draft, incoming) : migrate(incoming);
      draft.cards = next.cards;
      draft.meta = next.meta;
      draft.log = next.log;
    });
    setProgress({ ...updated });
  }, []);

  const value = useMemo(
    () => ({
      ready,
      store: storeRef.current,
      progress,
      cardOf,
      masteryOf,
      recordAnswer,
      setMeta,
      updateMeta,
      health,
      setActiveSet,
      setRegion,
      reset,
      restore,
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
      updateMeta,
      health,
      setActiveSet,
      setRegion,
      reset,
      restore,
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
