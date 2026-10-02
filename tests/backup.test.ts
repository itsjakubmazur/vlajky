import { describe, expect, it } from 'vitest';
import { backupFileName, decodeBackup, encodeBackup } from '@/store/backup';
import { mergeProgress } from '@/store/merge';
import { emptyProgress, SCHEMA_VERSION, type Progress } from '@/store/ProgressStore';
import { applyAnswer, emptyCardState } from '@/domain/srs/scheduler';

function withCard(code: string, at: string, correct = true): Progress {
  const progress = emptyProgress();
  const now = new Date(at);
  progress.cards[code] = applyAnswer(
    emptyCardState(code, now),
    { correct, elapsedMs: 2000, mode: 'classic' },
    now,
  );
  progress.savedAt = at;
  return progress;
}

describe('záloha do souboru', () => {
  it('projde tam a zpátky bez ztráty', () => {
    const progress = withCard('cz', '2026-05-01T10:00:00.000Z');
    progress.meta.totalPoints = 1234;
    progress.meta.bossesBeaten = ['irsko-pobrezi'];

    const read = decodeBackup(encodeBackup(progress));
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.file.progress.meta.totalPoints).toBe(1234);
    expect(read.file.progress.cards['cz']?.mastery).toBe('bronze');
    expect(read.file.summary).toEqual({ collected: 1, points: 1234, answers: 0 });
  });

  it('odmítne, co není záloha', () => {
    expect(decodeBackup('tohle není json')).toEqual({ ok: false, problem: 'notJson' });
    expect(decodeBackup('{"neco":1}')).toEqual({ ok: false, problem: 'notOurs' });
    expect(decodeBackup('[]')).toEqual({ ok: false, problem: 'notOurs' });
  });

  it('odmítne zálohu z novější verze', () => {
    const file = JSON.parse(encodeBackup(emptyProgress())) as { schemaVersion: number };
    file.schemaVersion = SCHEMA_VERSION + 1;
    expect(decodeBackup(JSON.stringify(file))).toEqual({ ok: false, problem: 'newerSchema' });
  });

  it('starší zálohu zmigruje, nezahodí', () => {
    // Záloha ze schématu 3 neměla `savedAt` ani nová pole v meta.
    const old = {
      kind: 'vlajky-postup',
      schemaVersion: 3,
      at: '2026-01-01T00:00:00.000Z',
      progress: { schemaVersion: 3, cards: {}, meta: { totalPoints: 50 }, log: [] },
    };
    const read = decodeBackup(JSON.stringify(old));
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.file.progress.meta.totalPoints).toBe(50);
    expect(read.file.progress.meta.frame).toBe('frame-classic');
  });

  it('název souboru má v sobě den', () => {
    expect(backupFileName(new Date('2026-07-04T12:00:00Z'))).toBe('vlajky-postup-2026-07-04.json');
  });
});

describe('spojení dvou zařízení', () => {
  it('u vlajky vezme novější stav', () => {
    const tablet = withCard('cz', '2026-05-01T10:00:00.000Z');
    const phone = withCard('cz', '2026-05-03T10:00:00.000Z', false);

    const merged = mergeProgress(tablet, phone);
    expect(merged.cards['cz']?.updatedAt).toBe(phone.cards['cz']?.updatedAt);
    expect(merged.cards['cz']?.mastery).toBe('new');
  });

  it('vlajky z obou zařízení zůstanou', () => {
    const merged = mergeProgress(
      withCard('cz', '2026-05-01T10:00:00.000Z'),
      withCard('sk', '2026-05-02T10:00:00.000Z'),
    );
    expect(Object.keys(merged.cards).sort()).toEqual(['cz', 'sk']);
  });

  it('body a rekordy bere vyšší, ne součet', () => {
    const a = emptyProgress();
    a.meta.totalPoints = 900;
    a.meta.records['marathon'] = {
      points: 900,
      correct: 9,
      total: 10,
      bestCombo: 4,
      elapsedMs: 1,
      at: '2026-05-01T00:00:00.000Z',
    };
    const b = emptyProgress();
    b.meta.totalPoints = 400;
    b.meta.records['marathon'] = {
      points: 1500,
      correct: 10,
      total: 10,
      bestCombo: 9,
      elapsedMs: 1,
      at: '2026-05-02T00:00:00.000Z',
    };

    const merged = mergeProgress(a, b);
    expect(merged.meta.totalPoints).toBe(900);
    expect(merged.meta.records['marathon']?.points).toBe(1500);
  });

  it('dvojí nahrání téže zálohy nic nezdvojnásobí', () => {
    const progress = withCard('cz', '2026-05-01T10:00:00.000Z');
    progress.meta.totalPoints = 777;
    progress.log = [
      { code: 'cz', mode: 'classic', correct: true, elapsedMs: 1000, at: '2026-05-01T10:00:00.000Z' },
    ];

    const once = mergeProgress(progress, progress);
    const twice = mergeProgress(once, progress);
    expect(twice.meta.totalPoints).toBe(777);
    expect(twice.log).toHaveLength(1);
  });

  it('souboje a mise se sjednotí', () => {
    const a = emptyProgress();
    a.meta.bossesBeaten = ['a', 'b'];
    a.meta.missionsClaimed['2026-05-01'] = ['m1'];
    const b = emptyProgress();
    b.meta.bossesBeaten = ['b', 'c'];
    b.meta.missionsClaimed['2026-05-01'] = ['m2'];

    const merged = mergeProgress(a, b);
    expect(merged.meta.bossesBeaten.sort()).toEqual(['a', 'b', 'c']);
    expect(merged.meta.missionsClaimed['2026-05-01']?.sort()).toEqual(['m1', 'm2']);
  });

  it('graf sbírky se nezmenšuje', () => {
    const a = emptyProgress();
    a.meta.history['2026-05-01'] = { collected: 100, gold: 10 };
    const b = emptyProgress();
    b.meta.history['2026-05-01'] = { collected: 80, gold: 25 };
    b.meta.history['2026-05-02'] = { collected: 90, gold: 26 };

    const merged = mergeProgress(a, b);
    expect(merged.meta.history['2026-05-01']).toEqual({ collected: 100, gold: 25 });
    expect(merged.meta.history['2026-05-02']).toEqual({ collected: 90, gold: 26 });
  });

  it('odpovědi z obou stran jsou v logu jen jednou a po sobě', () => {
    const a = emptyProgress();
    a.log = [
      { code: 'cz', mode: 'classic', correct: true, elapsedMs: 1, at: '2026-05-01T10:00:00.000Z' },
      { code: 'sk', mode: 'classic', correct: true, elapsedMs: 1, at: '2026-05-01T12:00:00.000Z' },
    ];
    const b = emptyProgress();
    b.log = [
      { code: 'sk', mode: 'classic', correct: true, elapsedMs: 1, at: '2026-05-01T12:00:00.000Z' },
      { code: 'pl', mode: 'classic', correct: true, elapsedMs: 1, at: '2026-05-01T11:00:00.000Z' },
    ];

    const merged = mergeProgress(a, b);
    expect(merged.log.map((entry) => entry.code)).toEqual(['cz', 'pl', 'sk']);
  });

  it('nastavení bere z toho, co ukládalo později', () => {
    const older = emptyProgress();
    older.savedAt = '2026-05-01T00:00:00.000Z';
    older.meta.theme = 'theme-deep';
    const newer = emptyProgress();
    newer.savedAt = '2026-05-09T00:00:00.000Z';
    newer.meta.theme = 'theme-aurora';

    expect(mergeProgress(older, newer).meta.theme).toBe('theme-aurora');
    expect(mergeProgress(newer, older).meta.theme).toBe('theme-aurora');
  });

  it('rozřazovací test zůstane hotový, i když ho druhé zařízení nezná', () => {
    const done = emptyProgress();
    done.meta.placementDone = true;
    done.meta.placementIndex = 24;
    const fresh = emptyProgress();

    const merged = mergeProgress(fresh, done);
    expect(merged.meta.placementDone).toBe(true);
    expect(merged.meta.placementIndex).toBe(24);
  });
});
