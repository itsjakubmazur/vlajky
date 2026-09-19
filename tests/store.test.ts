import { describe, expect, it } from 'vitest';
import { MemoryStore } from '@/store/MemoryStore';
import { migrate } from '@/store/LocalStorageStore';
import { dayKey, emptyProgress, LOG_LIMIT, nextStreak } from '@/store/ProgressStore';
import { applyAnswer, emptyCardState } from '@/domain/srs/scheduler';

describe('úložiště postupu', () => {
  it('začíná prázdné', async () => {
    const store = new MemoryStore();
    const progress = await store.load();
    expect(Object.keys(progress.cards)).toHaveLength(0);
    expect(progress.meta.placementDone).toBe(false);
  });

  it('uloží a vrátí kartu', async () => {
    const store = new MemoryStore();
    const now = new Date('2026-03-01T10:00:00Z');
    const card = applyAnswer(emptyCardState('td', now), { correct: true, elapsedMs: 4000, mode: 'classic' }, now);
    await store.saveCards([card]);
    expect((await store.load()).cards['td']?.mastery).toBe('bronze');
  });

  it('ořeže historii odpovědí na rozumnou délku', async () => {
    const store = new MemoryStore();
    for (let i = 0; i < LOG_LIMIT + 50; i++) {
      await store.logAnswer({ code: 'td', mode: 'classic', correct: true, elapsedMs: 1000, at: new Date().toISOString() });
    }
    const progress = await store.load();
    expect(progress.log.length).toBe(LOG_LIMIT);
    expect(progress.meta.totalAnswers).toBe(LOG_LIMIT + 50);
  });

  it('smazání postupu vrátí vše na začátek', async () => {
    const store = new MemoryStore();
    await store.setMeta({ placementDone: true });
    await store.reset();
    expect((await store.load()).meta.placementDone).toBe(false);
  });

  it('ohlásí změnu odběratelům', async () => {
    const store = new MemoryStore();
    let calls = 0;
    const off = store.subscribe(() => {
      calls += 1;
    });
    await store.setMeta({ placementDone: true });
    expect(calls).toBe(1);
    off();
    await store.setMeta({ placementDone: false });
    expect(calls).toBe(1);
  });
});

describe('série dní', () => {
  const meta = emptyProgress().meta;

  it('první den hraní je série 1', () => {
    expect(nextStreak(meta, '2026-03-01')).toBe(1);
  });

  it('hraní další den sérii prodlouží', () => {
    expect(nextStreak({ ...meta, lastPlayedDay: '2026-02-28', streakDays: 4 }, '2026-03-01')).toBe(5);
  });

  it('druhé hraní ve stejný den sérii nemění', () => {
    expect(nextStreak({ ...meta, lastPlayedDay: '2026-03-01', streakDays: 4 }, '2026-03-01')).toBe(4);
  });

  it('vynechaný den sérii začne znovu', () => {
    expect(nextStreak({ ...meta, lastPlayedDay: '2026-02-20', streakDays: 9 }, '2026-03-01')).toBe(1);
  });

  it('klíč dne je v místním čase', () => {
    expect(dayKey(new Date(2026, 2, 1, 23, 30))).toBe('2026-03-01');
  });
});

describe('migrace uložených dat', () => {
  it('doplní chybějící pole', () => {
    const migrated = migrate({ cards: { td: {} } } as never);
    expect(migrated.meta.activeSet).toBe('world');
    expect(migrated.log).toEqual([]);
    expect(migrated.schemaVersion).toBe(1);
  });

  it('nespadne na nesmyslném vstupu', () => {
    expect(migrate(null as never).cards).toEqual({});
  });
});
