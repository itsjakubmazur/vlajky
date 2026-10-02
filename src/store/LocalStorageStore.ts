import {
  BaseProgressStore,
  emptyProgress,
  migrate,
  type Progress,
  type StoreHealth,
} from './ProgressStore';

const KEY = 'vlajky.progress.v1';
/** Starší kopie postupu. Když se hlavní záznam poškodí, bere se tahle. */
const KEY_BACKUP = 'vlajky.progress.v1.zaloha';
/** Sem se odloží záznam, který se nepodařilo přečíst. Nikdy se nemaže. */
const KEY_BROKEN = 'vlajky.progress.v1.poskozeno';

/** Jak často se obnovuje záloha. Častěji by se zbytečně zapisovalo dvakrát. */
const BACKUP_EVERY_MS = 10 * 60 * 1000;

/**
 * Úložiště v localStorage.
 *
 * Tři věci, které tu nejsou pro parádu, ale protože se bez nich postup
 * ztrácel:
 *
 * 1. **Před každou změnou se čte ze storage, ne z paměti.** Na tabletu bývá
 *    aplikace otevřená ve dvou záložkách a každá by si jinak držela vlastní
 *    kopii; ta starší by při prvním zápisu přepsala práci té druhé.
 * 2. **Poškozený záznam se nepřepíše, odloží se na stranu** (`KEY_BROKEN`).
 *    Dřív se po nepovedeném `JSON.parse` vrátil prázdný postup a první další
 *    zápis ho uložil – jedno chybné načtení tím mazalo celou sbírku.
 * 3. **Záloha.** Když hlavní záznam zmizí nebo se poškodí, načte se kopie
 *    stará nejvýš deset minut místo prázdného postupu.
 *
 * Když zápis selže (plné úložiště, privátní režim), pozná se to z `health()`
 * a aplikace o tom řekne – tiché neukládání je horší než chybová zpráva.
 */
export class LocalStorageStore extends BaseProgressStore {
  private cache: Progress | null = null;
  private saved = true;
  private recovered = false;
  private lastBackupAt = 0;
  private detached: (() => void) | null = null;

  constructor() {
    super();
    this.listenToOtherTabs();
  }

  async load(): Promise<Progress> {
    if (this.cache) return this.cache;
    this.cache = this.read();
    return this.cache;
  }

  async update(fn: (progress: Progress) => void): Promise<Progress> {
    // Čte se tady, ne z `cache`: mezi dvěma změnami mohla zapsat jiná
    // záložka. Mezi čtením a zápisem není `await`, takže se dvě změny
    // nemůžou přebít.
    const progress = this.read();
    fn(progress);
    this.write(progress);
    return progress;
  }

  async reset(): Promise<void> {
    this.write(emptyProgress());
  }

  health(): StoreHealth {
    return {
      saved: this.saved,
      lastSavedAt: this.cache?.savedAt ?? null,
      recovered: this.recovered,
    };
  }

  /** Uvolní posluchač druhé záložky. Používá se v testech. */
  dispose(): void {
    this.detached?.();
    this.detached = null;
  }

  private listenToOtherTabs(): void {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== KEY) return;
      // Zapsala jiná záložka: zahodit kopii v paměti a říct o tom UI.
      this.cache = null;
      this.emit();
    };
    window.addEventListener('storage', onStorage);
    this.detached = () => window.removeEventListener('storage', onStorage);
  }

  private read(): Progress {
    const storage = this.storage();
    if (!storage) return this.cache ?? emptyProgress();

    const raw = storage.getItem(KEY);
    if (raw === null) {
      // Hlavní záznam chybí. Může to být první spuštění, ale taky úklid
      // od někoho jiného – pak je na místě záloha, ne prázdno.
      return this.readBackup() ?? emptyProgress();
    }
    try {
      return migrate(JSON.parse(raw) as Progress);
    } catch {
      this.quarantine(raw);
      this.recovered = true;
      return this.readBackup() ?? emptyProgress();
    }
  }

  private readBackup(): Progress | null {
    const storage = this.storage();
    const raw = storage?.getItem(KEY_BACKUP);
    if (!raw) return null;
    try {
      const restored = migrate(JSON.parse(raw) as Progress);
      this.recovered = true;
      return restored;
    } catch {
      return null;
    }
  }

  /**
   * Odloží nečitelný záznam na stranu. Přepsat ho prázdným postupem by byl
   * ten nejhorší možný konec: data by nešla zachránit ani ručně.
   */
  private quarantine(raw: string): void {
    const storage = this.storage();
    if (!storage || storage.getItem(KEY_BROKEN) !== null) return;
    try {
      storage.setItem(KEY_BROKEN, raw);
    } catch {
      // Na záchranu není místo; zápis hlavního záznamu to nesmí zablokovat.
    }
  }

  private write(progress: Progress): void {
    progress.savedAt = new Date().toISOString();
    this.cache = progress;
    const storage = this.storage();
    if (storage) {
      const json = JSON.stringify(progress);
      try {
        storage.setItem(KEY, json);
        this.saved = true;
        this.backup(json, storage);
      } catch {
        // Plné úložiště nebo privátní režim. Hra běží dál, ale musí to být
        // vidět – proto `saved = false` a ne jen prázdný catch.
        this.saved = false;
      }
    }
    this.emit();
  }

  private backup(json: string, storage: Storage): void {
    const now = Date.now();
    if (storage.getItem(KEY_BACKUP) !== null && now - this.lastBackupAt < BACKUP_EVERY_MS) return;
    try {
      storage.setItem(KEY_BACKUP, json);
      this.lastBackupAt = now;
    } catch {
      // Záloha je bonus; když se nevejde, hlavní záznam už uložený je.
    }
  }

  private storage(): Storage | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage;
    } catch {
      // Zablokované cookies – přístup k localStorage sám hodí výjimku.
      return null;
    }
  }
}

export { migrate } from './ProgressStore';
