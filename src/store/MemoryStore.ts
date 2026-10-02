import { BaseProgressStore, emptyProgress, type Progress, type StoreHealth } from './ProgressStore';

/** Úložiště jen v paměti – pro testy a pro vykreslení na serveru. */
export class MemoryStore extends BaseProgressStore {
  private progress: Progress = emptyProgress();

  async load(): Promise<Progress> {
    return this.progress;
  }

  async update(fn: (progress: Progress) => void): Promise<Progress> {
    fn(this.progress);
    this.progress.savedAt = new Date().toISOString();
    this.emit();
    return this.progress;
  }

  async reset(): Promise<void> {
    this.progress = emptyProgress();
    this.emit();
  }

  health(): StoreHealth {
    return { saved: true, lastSavedAt: this.progress.savedAt, recovered: false };
  }
}
