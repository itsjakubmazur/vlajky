import type { AnswerLog, CardState } from '@/domain/srs/types';
import {
  emptyProgress,
  LOG_LIMIT,
  type Meta,
  type Progress,
  type ProgressStore,
} from './ProgressStore';

/** Úložiště jen v paměti – pro testy a pro vykreslení na serveru. */
export class MemoryStore implements ProgressStore {
  private progress: Progress = emptyProgress();
  private listeners = new Set<() => void>();

  async load(): Promise<Progress> {
    return this.progress;
  }

  async saveCards(cards: CardState[]): Promise<void> {
    for (const card of cards) this.progress.cards[card.code] = card;
    this.emit();
  }

  async setMeta(patch: Partial<Meta>): Promise<void> {
    this.progress.meta = { ...this.progress.meta, ...patch };
    this.emit();
  }

  async logAnswer(entry: AnswerLog): Promise<void> {
    this.progress.log.push(entry);
    if (this.progress.log.length > LOG_LIMIT) {
      this.progress.log = this.progress.log.slice(-LOG_LIMIT);
    }
    this.progress.meta.totalAnswers += 1;
    this.emit();
  }

  async reset(): Promise<void> {
    this.progress = emptyProgress();
    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
