import type { RegionId, SetId } from '~data/sets';
import type { AnswerLog, CardState } from '@/domain/srs/types';
import type { PlacementResults } from '@/domain/srs/placement';
import type { DailyResult } from '@/domain/game/daily';

/** Verze schématu – při změně tvaru dat se postup zmigruje, ne zahodí. */
export const SCHEMA_VERSION = 3;

/** Nejlepší výkon v daném režimu. */
export interface GameRecord {
  points: number;
  correct: number;
  total: number;
  bestCombo: number;
  elapsedMs: number;
  at: string;
}

export interface Meta {
  /** Prošel hráč rozřazovacím testem? */
  placementDone: boolean;
  /** Kolik vlajek už v rozřazovacím testu odbavil (kvůli pauze uprostřed). */
  placementIndex: number;
  /** Jak dopadly jednotlivé otázky testu – z toho se odhadují pásma. */
  placementResults: PlacementResults;
  activeSet: SetId;
  /** Část světa, na kterou se hraje. */
  region: RegionId;
  /** Kolik dní po sobě si hrál. */
  streakDays: number;
  /** Poslední den hraní jako YYYY-MM-DD. */
  lastPlayedDay: string | null;
  totalAnswers: number;

  // --- hra ---------------------------------------------------------------
  /** Body se nikdy neodečítají; drží hodnost. */
  totalPoints: number;
  /** Rekordy podle režimu. */
  records: Record<string, GameRecord>;
  /** Id poražených soubojů. */
  bossesBeaten: string[];
  /** Výsledky denní výzvy podle dne. */
  dailyResults: Record<string, DailyResult>;
  /** Vyzvednuté mise podle dne. */
  missionsClaimed: Record<string, string[]>;
  /** Vybraný rámeček a téma z odemčených. */
  frame: string;
  theme: string;
  soundOn: boolean;
  hapticsOn: boolean;
}

export interface Progress {
  schemaVersion: number;
  cards: Record<string, CardState>;
  meta: Meta;
  /** Posledních pár set odpovědí – na statistiky ve fázi 2. */
  log: AnswerLog[];
}

export const LOG_LIMIT = 500;

export function emptyProgress(): Progress {
  return {
    schemaVersion: SCHEMA_VERSION,
    cards: {},
    meta: {
      placementDone: false,
      placementIndex: 0,
      placementResults: {},
      activeSet: 'world',
      region: 'all',
      streakDays: 0,
      lastPlayedDay: null,
      totalAnswers: 0,
      totalPoints: 0,
      records: {},
      bossesBeaten: [],
      dailyResults: {},
      missionsClaimed: {},
      frame: 'frame-classic',
      theme: 'theme-night',
      soundOn: true,
      hapticsOn: true,
    },
    log: [],
  };
}

/**
 * Úložiště postupu.
 *
 * MVP běží nad localStorage, fáze 2 nad Supabase. UI zná jen tohle rozhraní,
 * takže výměna implementace se ho nedotkne. Metody jsou asynchronní schválně –
 * aby se pozdější přechod na síť obešel bez přepisování komponent.
 */
export interface ProgressStore {
  load(): Promise<Progress>;
  saveCards(cards: CardState[]): Promise<void>;
  setMeta(patch: Partial<Meta>): Promise<void>;
  logAnswer(entry: AnswerLog): Promise<void>;
  reset(): Promise<void>;
  /** Oznámí změnu z jiného zdroje (jiná záložka, později realtime). */
  subscribe(listener: () => void): () => void;
}

export { dayKey } from '@/domain/game/day';

/** Spočítá sérii dní v řadě po odehrání dalšího dne. */
export function nextStreak(meta: Meta, today: string): number {
  if (meta.lastPlayedDay === today) return Math.max(meta.streakDays, 1);
  if (meta.lastPlayedDay === null) return 1;

  const last = new Date(`${meta.lastPlayedDay}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  const days = Math.round((now.getTime() - last.getTime()) / 86_400_000);
  return days === 1 ? meta.streakDays + 1 : 1;
}
