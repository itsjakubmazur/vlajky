import type { AnswerLog, CardState } from '@/domain/srs/types';
import {
  emptyProgress,
  LOG_LIMIT,
  SCHEMA_VERSION,
  type Meta,
  type Progress,
  type ProgressStore,
} from './ProgressStore';

const KEY = 'vlajky.progress.v1';

/**
 * Úložiště v localStorage. Všechno drží v paměti a po každé změně zapíše
 * celý balík – při dvou stech vlajkách jde o desítky kilobajtů, takže je to
 * levnější než chytré inkrementální zápisy.
 */
export class LocalStorageStore implements ProgressStore {
  private cache: Progress | null = null;
  private listeners = new Set<() => void>();

  async load(): Promise<Progress> {
    if (this.cache) return this.cache;
    this.cache = this.read();
    return this.cache;
  }

  async saveCards(cards: CardState[]): Promise<void> {
    const progress = await this.load();
    for (const card of cards) progress.cards[card.code] = card;
    this.write(progress);
  }

  async setMeta(patch: Partial<Meta>): Promise<void> {
    const progress = await this.load();
    progress.meta = { ...progress.meta, ...patch };
    this.write(progress);
  }

  async logAnswer(entry: AnswerLog): Promise<void> {
    const progress = await this.load();
    progress.log.push(entry);
    if (progress.log.length > LOG_LIMIT) {
      progress.log = progress.log.slice(-LOG_LIMIT);
    }
    progress.meta.totalAnswers += 1;
    this.write(progress);
  }

  async reset(): Promise<void> {
    this.cache = emptyProgress();
    this.write(this.cache);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private read(): Progress {
    if (typeof window === 'undefined') return emptyProgress();
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return emptyProgress();
      const parsed = JSON.parse(raw) as Progress;
      return migrate(parsed);
    } catch {
      // Poškozená data radši zahodíme, než aby spadla celá aplikace.
      return emptyProgress();
    }
  }

  private write(progress: Progress): void {
    this.cache = progress;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(progress));
      } catch {
        // Plné úložiště nebo privátní režim – hra může běžet dál bez ukládání.
      }
    }
    for (const listener of this.listeners) listener();
  }
}

/**
 * Migrace starších uložených dat na aktuální schéma.
 *
 * Schéma 1 → 2 přidalo body, rekordy a souboje, 2 → 3 výsledky
 * rozřazovacího testu. Chybějící pole se doplní z prázdného stavu, takže
 * postup ve vlajkách se nikdy nezahazuje.
 */
export function migrate(input: Progress): Progress {
  const base = emptyProgress();
  if (!input || typeof input !== 'object') return base;
  return {
    schemaVersion: SCHEMA_VERSION,
    cards: input.cards ?? {},
    meta: { ...base.meta, ...(input.meta ?? {}) },
    log: Array.isArray(input.log) ? input.log.slice(-LOG_LIMIT) : [],
  };
}
