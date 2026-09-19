import type { SetId } from '~data/sets';
import type { AnswerLog, CardState } from '@/domain/srs/types';

/** Verze schématu – při změně tvaru dat se postup zmigruje, ne zahodí. */
export const SCHEMA_VERSION = 1;

export interface Meta {
  /** Prošel hráč rozřazovacím testem? */
  placementDone: boolean;
  /** Kolik vlajek už v rozřazovacím testu odbavil (kvůli pauze uprostřed). */
  placementIndex: number;
  activeSet: SetId;
  /** Kolik dní po sobě si hrál. */
  streakDays: number;
  /** Poslední den hraní jako YYYY-MM-DD. */
  lastPlayedDay: string | null;
  totalAnswers: number;
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
      activeSet: 'world',
      streakDays: 0,
      lastPlayedDay: null,
      totalAnswers: 0,
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

/** Den v podobě YYYY-MM-DD v místním čase. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Spočítá sérii dní v řadě po odehrání dalšího dne. */
export function nextStreak(meta: Meta, today: string): number {
  if (meta.lastPlayedDay === today) return Math.max(meta.streakDays, 1);
  if (meta.lastPlayedDay === null) return 1;

  const last = new Date(`${meta.lastPlayedDay}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  const days = Math.round((now.getTime() - last.getTime()) / 86_400_000);
  return days === 1 ? meta.streakDays + 1 : 1;
}
