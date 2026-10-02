import type { RegionId, SetId } from '~data/sets';
import type { AnswerLog, CardState } from '@/domain/srs/types';
import type { PlacementResults } from '@/domain/srs/placement';
import type { DailyResult } from '@/domain/game/daily';
import type { History } from '@/domain/game/history';
import type { PartyState } from '@/domain/game/party';

/** Verze schématu – při změně tvaru dat se postup zmigruje, ne zahodí. */
export const SCHEMA_VERSION = 4;

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
  /** Stav sbírky po dnech – z toho se kreslí graf v přehledu. */
  history: History;
  /**
   * Rozehraný turnaj, nebo `null`.
   *
   * Drží se v úložišti schválně: na dovolené se tablet uspí nebo se
   * omylem zavře karta a nikdo nechce přijít o tři odehraná kola.
   */
  party: PartyState | null;
  /** Vybraný rámeček a téma z odemčených. */
  frame: string;
  theme: string;
  soundOn: boolean;
  /** Po správné odpovědi jet v závodních režimech dál samo. */
  autoNext: boolean;
  hapticsOn: boolean;
}

export interface Progress {
  schemaVersion: number;
  cards: Record<string, CardState>;
  meta: Meta;
  /** Posledních pár set odpovědí – na statistiky ve fázi 2. */
  log: AnswerLog[];
  /**
   * Kdy se postup naposledy uložil (ISO). Potřebuje to zálohování,
   * ukazuje se to v Nastavení a ve fázi 2 z toho pozná synchronizace,
   * která strana je novější.
   */
  savedAt: string | null;
}

export const LOG_LIMIT = 500;

/** Stav ukládání. Když se postup neukládá, musí to být vidět. */
export interface StoreHealth {
  /** Povedlo se poslední uložení? */
  saved: boolean;
  /** Kdy se naposledy povedlo uložit. */
  lastSavedAt: string | null;
  /** Našla se poškozená data a odložila se na stranu místo přepsání? */
  recovered: boolean;
}

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
      history: {},
      party: null,
      frame: 'frame-classic',
      theme: 'theme-night',
      soundOn: true,
      autoNext: true,
      hapticsOn: true,
    },
    log: [],
    savedAt: null,
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
  /**
   * Atomická změna: přečte **aktuální** uložený stav, pustí na něj `fn`
   * a zapíše. Všechno, co se počítá ze starého čísla (body, série, index
   * v testu), musí jít tudy – ne přes `setMeta` s hodnotou spočítanou
   * z Reactu. Viz komentář u `BaseProgressStore`.
   */
  update(fn: (progress: Progress) => void): Promise<Progress>;
  saveCards(cards: CardState[]): Promise<void>;
  /** Jen dosazení hotových hodnot. Na přičítání je `update`. */
  setMeta(patch: Partial<Meta>): Promise<void>;
  logAnswer(entry: AnswerLog): Promise<void>;
  reset(): Promise<void>;
  /** Stav ukládání – kvůli upozornění, že se postup neukládá. */
  health(): StoreHealth;
  /** Oznámí změnu z jiného zdroje (jiná záložka, později realtime). */
  subscribe(listener: () => void): () => void;
}

/**
 * Společný základ obou úložišť.
 *
 * Proč vůbec existuje: postup se **ztrácel**. Komponenty počítaly nové
 * hodnoty ze stavu Reactu (`totalPoints: progress.meta.totalPoints + body`)
 * a posílaly výsledek do úložiště. Když mezitím proběhl jiný zápis – dvě
 * akce v jednom tiknutí, nebo druhá otevřená záložka –, druhý zápis počítal
 * ze zastaralého čísla a první přepsal. Body uhnuly dozadu, index
 * v rozřazovacím testu se nepohnul, série dní se rozsypala.
 *
 * Lék je, že se čtení a zápis nesmí rozpojit: `update` si aktuální stav
 * přečte sám, až v okamžiku zápisu, a `fn` běží **synchronně** mezi čtením
 * a zápisem. Nic se mezi to nevejde, takže se dva zápisy nemůžou přebít.
 * Ostatní metody jsou postavené nad ním, aby to platilo i pro ně.
 */
export abstract class BaseProgressStore implements ProgressStore {
  protected readonly listeners = new Set<() => void>();

  abstract load(): Promise<Progress>;
  abstract update(fn: (progress: Progress) => void): Promise<Progress>;
  abstract reset(): Promise<void>;
  abstract health(): StoreHealth;

  async saveCards(cards: CardState[]): Promise<void> {
    await this.update((progress) => {
      for (const card of cards) progress.cards[card.code] = card;
    });
  }

  async setMeta(patch: Partial<Meta>): Promise<void> {
    await this.update((progress) => {
      progress.meta = { ...progress.meta, ...patch };
    });
  }

  async logAnswer(entry: AnswerLog): Promise<void> {
    await this.update((progress) => {
      progress.log.push(entry);
      if (progress.log.length > LOG_LIMIT) progress.log = progress.log.slice(-LOG_LIMIT);
      progress.meta.totalAnswers += 1;
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  protected emit(): void {
    for (const listener of this.listeners) listener();
  }
}

/**
 * Doplní chybějící pole z prázdného stavu a ořeže log.
 *
 * Schéma 1 → 2 přidalo body, rekordy a souboje, 2 → 3 výsledky
 * rozřazovacího testu, 3 → 4 čas posledního uložení. Chybějící pole se
 * doplní, takže postup ve vlajkách se nikdy nezahazuje.
 */
export function migrate(input: Progress | null | undefined): Progress {
  const base = emptyProgress();
  if (!input || typeof input !== 'object') return base;
  return {
    schemaVersion: SCHEMA_VERSION,
    cards: isRecord(input.cards) ? input.cards : {},
    meta: { ...base.meta, ...(isRecord(input.meta) ? input.meta : {}) },
    log: Array.isArray(input.log) ? input.log.slice(-LOG_LIMIT) : [],
    savedAt: typeof input.savedAt === 'string' ? input.savedAt : null,
  };
}

function isRecord(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
