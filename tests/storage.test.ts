import { afterEach, describe, expect, it } from 'vitest';
import { LocalStorageStore } from '@/store/LocalStorageStore';
import { MemoryStore } from '@/store/MemoryStore';
import { emptyProgress } from '@/store/ProgressStore';

const KEY = 'vlajky.progress.v1';
const KEY_BACKUP = 'vlajky.progress.v1.zaloha';
const KEY_BROKEN = 'vlajky.progress.v1.poskozeno';

/** Nejmenší možný localStorage. Testy běží v Node, kde žádný není. */
class FakeStorage {
  private data = new Map<string, string>();
  /** Zápis tohoto klíče selže – plné úložiště nebo privátní režim. */
  full = false;

  get length(): number {
    return this.data.size;
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.full) throw new Error('QuotaExceededError');
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  clear(): void {
    this.data.clear();
  }
  key(i: number): string | null {
    return [...this.data.keys()][i] ?? null;
  }
}

interface FakeWindow {
  localStorage: FakeStorage;
  addEventListener: (type: string, fn: (event: { key: string | null }) => void) => void;
  removeEventListener: (type: string, fn: (event: { key: string | null }) => void) => void;
}

function installWindow(): {
  storage: FakeStorage;
  /** Oznámí změnu „z jiné záložky“, jak to dělá prohlížeč. */
  notifyOtherTab: (key: string) => void;
} {
  const storage = new FakeStorage();
  const listeners = new Set<(event: { key: string | null }) => void>();
  const fake: FakeWindow = {
    localStorage: storage,
    addEventListener: (type, fn) => {
      if (type === 'storage') listeners.add(fn);
    },
    removeEventListener: (_type, fn) => {
      listeners.delete(fn);
    },
  };
  (globalThis as unknown as { window?: FakeWindow }).window = fake;
  return {
    storage,
    notifyOtherTab: (key) => {
      for (const fn of listeners) fn({ key });
    },
  };
}

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe('postup se neztrácí', () => {
  it('dvě změny v jednom tiknutí se nepřebijí', async () => {
    // Takhle se ztrácely body: obě kola počítala z téhož výchozího čísla.
    const store = new MemoryStore();
    await Promise.all([
      store.update((p) => {
        p.meta.totalPoints += 100;
      }),
      store.update((p) => {
        p.meta.totalPoints += 30;
      }),
    ]);
    expect((await store.load()).meta.totalPoints).toBe(130);
  });

  it('zápis z druhé záložky se nepřepíše', async () => {
    const { storage, notifyOtherTab } = installWindow();
    const tabA = new LocalStorageStore();
    const tabB = new LocalStorageStore();
    await tabA.load();
    await tabB.load();

    await tabA.update((p) => {
      p.meta.totalPoints += 500;
    });
    // Záložka B si načetla postup ještě před tím zápisem. Dřív by ho přepsala.
    await tabB.update((p) => {
      p.meta.totalPoints += 7;
    });

    const stored = JSON.parse(storage.getItem(KEY) ?? '{}') as { meta: { totalPoints: number } };
    expect(stored.meta.totalPoints).toBe(507);

    // Prohlížeč to druhé záložce oznámí; po oznámení vidí obě totéž.
    notifyOtherTab(KEY);
    expect((await tabA.load()).meta.totalPoints).toBe(507);
    expect((await tabB.load()).meta.totalPoints).toBe(507);
    tabA.dispose();
    tabB.dispose();
  });

  it('po zápisu z druhé záložky se načte znovu', async () => {
    const { storage, notifyOtherTab } = installWindow();
    const store = new LocalStorageStore();
    await store.load();

    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });

    const other = { ...emptyProgress(), savedAt: null };
    other.meta.totalPoints = 900;
    storage.setItem(KEY, JSON.stringify(other));
    notifyOtherTab(KEY);

    expect(notified).toBe(1);
    expect((await store.load()).meta.totalPoints).toBe(900);
    store.dispose();
  });

  it('poškozený záznam se odloží na stranu, ne přepíše', async () => {
    const { storage } = installWindow();
    storage.setItem(KEY, '{tohle rozhodně není JSON');

    const store = new LocalStorageStore();
    const loaded = await store.load();
    expect(loaded.meta.totalPoints).toBe(0);
    expect(store.health().recovered).toBe(true);

    // Hra běží dál a zapíše – ale původní data musí zůstat k záchraně.
    await store.update((p) => {
      p.meta.totalPoints += 1;
    });
    expect(storage.getItem(KEY_BROKEN)).toBe('{tohle rozhodně není JSON');
    store.dispose();
  });

  it('poškozený záznam se nahradí zálohou', async () => {
    const { storage } = installWindow();
    const backup = emptyProgress();
    backup.meta.totalPoints = 4200;
    backup.cards['cz'] = { code: 'cz', mastery: 'gold' } as never;
    storage.setItem(KEY_BACKUP, JSON.stringify(backup));
    storage.setItem(KEY, 'rozbité');

    const store = new LocalStorageStore();
    const loaded = await store.load();
    expect(loaded.meta.totalPoints).toBe(4200);
    expect(loaded.cards['cz']?.mastery).toBe('gold');
    store.dispose();
  });

  it('zmizelý hlavní záznam se nahradí zálohou', async () => {
    const { storage } = installWindow();
    const backup = emptyProgress();
    backup.meta.totalPoints = 77;
    storage.setItem(KEY_BACKUP, JSON.stringify(backup));

    const store = new LocalStorageStore();
    expect((await store.load()).meta.totalPoints).toBe(77);
    store.dispose();
  });

  it('první spuštění není záchrana', async () => {
    installWindow();
    const store = new LocalStorageStore();
    expect((await store.load()).meta.totalPoints).toBe(0);
    expect(store.health().recovered).toBe(false);
    store.dispose();
  });

  it('neúspěšné uložení je vidět', async () => {
    const { storage } = installWindow();
    const store = new LocalStorageStore();
    await store.load();
    storage.full = true;

    await store.update((p) => {
      p.meta.totalPoints += 10;
    });
    expect(store.health().saved).toBe(false);
    // Rozehrané kolo se nesmí zahodit, i když se neuložilo.
    expect((await store.load()).meta.totalPoints).toBe(10);

    storage.full = false;
    await store.update((p) => {
      p.meta.totalPoints += 1;
    });
    expect(store.health().saved).toBe(true);
    store.dispose();
  });

  it('uloží čas posledního zápisu', async () => {
    installWindow();
    const store = new LocalStorageStore();
    await store.update((p) => {
      p.meta.totalPoints += 1;
    });
    expect(store.health().lastSavedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    store.dispose();
  });
});
