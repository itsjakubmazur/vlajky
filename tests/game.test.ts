import { describe, expect, it } from 'vitest';
import { ALL_COUNTRIES, getCountry, requireCountry } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import {
  BASE_POINTS,
  comboMultiplier,
  nextComboStep,
  pointsFor,
  speedOf,
  stakeLoss,
} from '@/domain/game/score';
import { RANKS, rankFor, rankProgress } from '@/domain/game/ranks';
import { BOSS_QUESTIONS, bossName, bossesFor } from '@/domain/game/bosses';
import { DAILY_COUNT, dailyCodes, shareText } from '@/domain/game/daily';
import { dailyMissions, isComplete, missionProgress } from '@/domain/game/missions';
import { UNLOCKS, unlockedIds } from '@/domain/game/unlocks';
import { buildSession } from '@/domain/quiz/session';
import { livesFor } from '@/domain/quiz/modes';
import { createRng } from '@/domain/rng';

const world = countriesInSet([...ALL_COUNTRIES], 'world');

describe('rychlost a kombo', () => {
  it('rozdělí odpovědi podle času', () => {
    expect(speedOf(900)).toBe('flash');
    expect(speedOf(2500)).toBe('fast');
    expect(speedOf(5000)).toBe('normal');
    expect(speedOf(20000)).toBe('slow');
  });

  it('násobič roste se sérií a zastaví se na stropě', () => {
    expect(comboMultiplier(0)).toBe(0);
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(3)).toBeGreaterThan(comboMultiplier(2));
    expect(comboMultiplier(99)).toBe(comboMultiplier(6));
    expect(nextComboStep(99)).toBeNull();
  });
});

describe('body', () => {
  const base = { correct: true, elapsedMs: 4000, combo: 0, difficulty: 3 as const };

  it('za chybu nejsou body', () => {
    expect(pointsFor({ ...base, correct: false })).toBe(0);
  });

  it('bleskově je víc než pomalu', () => {
    const fast = pointsFor({ ...base, elapsedMs: 800 });
    const slow = pointsFor({ ...base, elapsedMs: 9000 });
    expect(fast).toBeGreaterThan(slow * 2);
  });

  it('série znásobí zisk', () => {
    expect(pointsFor({ ...base, combo: 5 })).toBeGreaterThan(pointsFor({ ...base, combo: 0 }));
  });

  it('vlajka po termínu vynáší víc – učení a zábava táhnou stejně', () => {
    expect(pointsFor({ ...base, isDue: true })).toBeGreaterThan(pointsFor({ ...base, isDue: false }));
  });

  it('těžší vlajka vynáší víc než snadná', () => {
    expect(pointsFor({ ...base, difficulty: 5 })).toBeGreaterThan(
      pointsFor({ ...base, difficulty: 1 }),
    );
  });

  it('sázka zvedne zisk i ztrátu', () => {
    expect(pointsFor({ ...base, stake: 3 })).toBe(pointsFor(base) * 3);
    expect(stakeLoss(1)).toBe(0);
    expect(stakeLoss(3)).toBe(BASE_POINTS * 2);
  });
});

describe('hodnosti', () => {
  it('začíná se na první a body nikdy neubývají', () => {
    expect(rankFor(0).id).toBe(RANKS[0]!.id);
    expect(rankFor(-100).id).toBe(RANKS[0]!.id);
  });

  it('hodnost roste s body', () => {
    const ids = [0, 5_000, 20_000, 50_000, 100_000, 500_000].map((p) => rankFor(p).id);
    expect(new Set(ids).size).toBe(RANKS.length);
  });

  it('postup k další hodnosti je mezi 0 a 1', () => {
    for (const points of [0, 1_500, 12_001, 90_000, 999_999]) {
      const p = rankProgress(points);
      expect(p.ratio).toBeGreaterThanOrEqual(0);
      expect(p.ratio).toBeLessThanOrEqual(1);
    }
    expect(rankProgress(999_999).next).toBeNull();
  });
});

describe('souboje', () => {
  const bosses = bossesFor(world);

  it('vzniknou ze skupin zaměnitelných vlajek', () => {
    expect(bosses.length).toBeGreaterThan(20);
    for (const boss of bosses) {
      expect(boss.codes.length).toBeGreaterThanOrEqual(2);
      for (const code of boss.codes) expect(getCountry(code)).toBeDefined();
    }
  });

  it('nejsou duplicitní a začínají dvojicemi', () => {
    expect(new Set(bosses.map((b) => b.id)).size).toBe(bosses.length);
    expect(bosses[0]!.codes.length).toBe(2);
  });

  it('jméno se skládá ze zemí, nic se nevymýšlí', () => {
    const chad = bosses.find((b) => b.codes.includes('td') && b.codes.length === 2)!;
    const name = bossName(chad, (c) => requireCountry(c).nameCs);
    expect(name).toContain('Čad');
    expect(name).toContain('vs.');
  });

  it('souboj dá pět otázek jen ze své skupiny', () => {
    const boss = bosses[0]!;
    const codes = buildSession({
      mode: 'boss',
      pool: world,
      cards: {},
      now: new Date(),
      rng: createRng(1),
      bossId: boss.id,
    });
    expect(codes).toHaveLength(BOSS_QUESTIONS);
    for (const code of codes) expect(boss.codes).toContain(code);
  });

  it('v souboji se chybovat nesmí', () => {
    expect(livesFor('boss')).toBe(1);
    expect(livesFor('marathon')).toBe(3);
    expect(livesFor('classic')).toBeNull();
  });
});

describe('denní výzva', () => {
  it('stejný den dá stejné vlajky, jiný den jiné', () => {
    const a = dailyCodes('2026-09-19', world);
    const b = dailyCodes('2026-09-19', world);
    const c = dailyCodes('2026-09-20', world);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('má správný počet a neopakuje vlajky', () => {
    const codes = dailyCodes('2026-09-19', world);
    expect(codes).toHaveLength(DAILY_COUNT);
    expect(new Set(codes).size).toBe(DAILY_COUNT);
  });

  it('míchá obtížnosti, není to deset neznámých ostrovů', () => {
    const codes = dailyCodes('2026-09-19', world);
    const levels = codes.map((c) => requireCountry(c).difficulty);
    expect(Math.min(...levels)).toBeLessThanOrEqual(2);
    expect(new Set(levels).size).toBeGreaterThan(2);
  });

  it('text ke sdílení neprozradí odpovědi', () => {
    const text = shareText(
      { dayKey: '2026-09-19', correct: 9, total: 10, bestCombo: 7, elapsedMs: 102_000, points: 4200 },
      'Vlajky',
    );
    expect(text).toContain('19. 9. 2026');
    expect(text).toContain('9/10');
    expect(text).toContain('1:42');
    for (const code of dailyCodes('2026-09-19', world)) {
      expect(text).not.toContain(requireCountry(code).nameCs);
    }
  });
});

describe('mise', () => {
  const ctx = {
    today: [],
    bestComboToday: 0,
    firstSeenToday: [],
    countryOf: getCountry,
  };

  it('jsou tři a stejný den stejné', () => {
    const a = dailyMissions('2026-09-19');
    expect(a).toHaveLength(3);
    expect(a.map((m) => m.id)).toEqual(dailyMissions('2026-09-19').map((m) => m.id));
    expect(new Set(a.map((m) => m.id)).size).toBe(3);
  });

  it('na začátku dne není splněná žádná', () => {
    for (const mission of dailyMissions('2026-09-19')) {
      expect(missionProgress(mission, ctx)).toBe(0);
      expect(isComplete(mission, ctx)).toBe(false);
    }
  });

  it('bleskové odpovědi plní misi na rychlost', () => {
    const mission = { id: 'speed-5', kind: 'speed' as const, target: 5, reward: 300 };
    const today = Array.from({ length: 6 }, () => ({
      code: 'cz',
      mode: 'classic',
      correct: true,
      elapsedMs: 900,
      at: new Date().toISOString(),
    }));
    expect(isComplete(mission, { ...ctx, today })).toBe(true);
  });

  it('pomalé odpovědi misi na rychlost neplní', () => {
    const mission = { id: 'speed-5', kind: 'speed' as const, target: 5, reward: 300 };
    const today = Array.from({ length: 6 }, () => ({
      code: 'cz',
      mode: 'classic',
      correct: true,
      elapsedMs: 5000,
      at: new Date().toISOString(),
    }));
    expect(missionProgress(mission, { ...ctx, today })).toBe(0);
  });
});

describe('odemykání', () => {
  it('na začátku je odemčený základní rámeček a téma', () => {
    const ids = unlockedIds({ totalPoints: 0, golds: 0, bosses: 0 });
    expect(ids).toContain('frame-classic');
    expect(ids).toContain('theme-night');
    expect(ids.length).toBeLessThan(UNLOCKS.length);
  });

  it('zkušený hráč má odemčeno všechno', () => {
    const ids = unlockedIds({ totalPoints: 500_000, golds: 100, bosses: 40 });
    expect(ids).toHaveLength(UNLOCKS.length);
  });

  it('samotné body neodemknou to, co chce zlaté vlajky', () => {
    const ids = unlockedIds({ totalPoints: 500_000, golds: 0, bosses: 0 });
    expect(ids).not.toContain('frame-gold');
  });
});
