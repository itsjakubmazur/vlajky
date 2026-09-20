import { describe, expect, it } from 'vitest';
import { ALL_COUNTRIES, getCountry, requireCountry } from '@/domain/countries';
import {
  countriesInRegion,
  countriesInSet,
  MIN_REGION_SIZE,
  playableRegions,
  REGIONS,
} from '~data/sets';
import {
  BASE_POINTS,
  comboMultiplier,
  nextComboStep,
  pointsFor,
  speedOf,
  clampElapsed,
  MAX_ANSWER_MS,
  stakeLoss,
} from '@/domain/game/score';
import { RANKS, rankFor, rankProgress } from '@/domain/game/ranks';
import { BOSS_QUESTIONS, bossName, bossesFor } from '@/domain/game/bosses';
import { DAILY_COUNT, dailyCodes, shareText } from '@/domain/game/daily';
import { dailyMissions, isComplete, missionProgress } from '@/domain/game/missions';
import { UNLOCKS, unlockedIds } from '@/domain/game/unlocks';
import { nextUp } from '@/domain/game/nextUp';
import { buildSession } from '@/domain/quiz/session';
import { confusions, fadingSoon, weakest } from '@/domain/srs/insight';
import { applyAnswer, emptyCardState } from '@/domain/srs/scheduler';
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

  it('odložený čas se ořízne a nesmyslný vstup nespadne', () => {
    expect(clampElapsed(-5)).toBe(0);
    expect(clampElapsed(Number.NaN)).toBe(0);
    expect(clampElapsed(10 * 60 * 1000)).toBe(MAX_ANSWER_MS);
    expect(speedOf(10 * 60 * 1000)).toBe('slow');
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

describe('část světa', () => {
  it('„celý svět“ nic neodfiltruje', () => {
    expect(countriesInRegion(world, 'all')).toHaveLength(world.length);
  });

  it('světadíl vybere jen své vlajky', () => {
    const europe = countriesInRegion(world, 'europe');
    expect(europe.length).toBeGreaterThan(40);
    for (const c of europe) expect(c.continent).toBe('europe');
    expect(europe.length).toBeLessThan(world.length);
  });

  it('součet světadílů dá celou sadu', () => {
    const sum = REGIONS.filter((r) => r !== 'all').reduce(
      (n, r) => n + countriesInRegion(world, r).length,
      0,
    );
    expect(sum).toBe(world.length);
  });

  it('ve světě jsou hratelné všechny světadíly', () => {
    expect(playableRegions(world)).toEqual(REGIONS);
    for (const region of REGIONS) {
      if (region === 'all') continue;
      expect(countriesInRegion(world, region).length).toBeGreaterThanOrEqual(MIN_REGION_SIZE);
    }
  });

  it('v bonusové sadě se moc malé světadíly vůbec nenabízejí', () => {
    const territories = countriesInSet([...ALL_COUNTRIES], 'territories');
    const offered = playableRegions(territories);
    expect(offered).toContain('all');
    for (const region of offered) {
      if (region === 'all') continue;
      expect(countriesInRegion(territories, region).length).toBeGreaterThanOrEqual(
        MIN_REGION_SIZE,
      );
    }
    expect(offered.length).toBeLessThan(REGIONS.length);
  });

  it('hra ve světadílu se drží svého světadílu', () => {
    const africa = countriesInRegion(world, 'africa');
    const codes = buildSession({
      mode: 'classic',
      pool: africa,
      cards: {},
      now: new Date(),
      rng: createRng(4),
    });
    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) expect(requireCountry(code).continent).toBe('africa');
  });

  it('maraton po světadílu projde všechny jeho vlajky', () => {
    const oceania = countriesInRegion(world, 'oceania');
    const codes = buildSession({
      mode: 'marathon',
      pool: oceania,
      cards: {},
      now: new Date(),
      rng: createRng(5),
    });
    expect(codes).toHaveLength(oceania.length);
    expect(new Set(codes).size).toBe(oceania.length);
  });

  it('denní výzva se částí světa neřídí – jinak by nešla porovnat', () => {
    const fromWorld = dailyCodes('2026-09-20', world);
    const fromEurope = dailyCodes('2026-09-20', countriesInRegion(world, 'europe'));
    expect(fromWorld).not.toEqual(fromEurope);
    // proto se v aplikaci denní výzvě předává vždy celá sada
    expect(dailyCodes('2026-09-20', world)).toEqual(fromWorld);
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

describe('přehled slabin a předpověď', () => {
  const now = new Date('2026-03-01T10:00:00Z');
  const inSet = () => true;

  it('nejslabší jsou ty s největším podílem chyb', () => {
    const cards = [
      { ...emptyCardState('fr', now), seen: 10, correct: 9 },
      { ...emptyCardState('td', now), seen: 10, correct: 2 },
      { ...emptyCardState('ro', now), seen: 10, correct: 5 },
      { ...emptyCardState('jp', now), seen: 10, correct: 10 },
    ];
    const weak = weakest(cards, inSet);
    expect(weak.map((w) => w.code)).toEqual(['td', 'ro', 'fr']);
    expect(weak[0]!.errorRate).toBeCloseTo(0.8);
  });

  it('jedna chyba u nové vlajky nepředběhne vlajku s historií', () => {
    const cards = [
      { ...emptyCardState('fr', now), seen: 1, correct: 0 },
      { ...emptyCardState('td', now), seen: 6, correct: 3 },
    ];
    expect(weakest(cards, inSet).map((w) => w.code)).toEqual(['td', 'fr']);
  });

  it('předpověď bere jen vlajky, které ještě nejsou po termínu', () => {
    let fresh = emptyCardState('td', now);
    fresh = applyAnswer(fresh, { correct: true, elapsedMs: 3000, mode: 'classic' }, now);
    const overdue = {
      ...emptyCardState('ro', now),
      seen: 3,
      correct: 3,
      fsrs: { ...fresh.fsrs, due: new Date(now.getTime() - 86_400_000).toISOString() },
    };
    const codes = fadingSoon([fresh, overdue], inSet, now).map((f) => f.code);
    expect(codes).not.toContain('ro');
  });

  it('nikdy neviděná vlajka v přehledu není', () => {
    const unseen = emptyCardState('tv', now);
    expect(weakest([unseen], inSet)).toEqual([]);
    expect(fadingSoon([unseen], inSet, now)).toEqual([]);
  });
});

describe('co hrát teď', () => {
  const base = { placementDone: true, dailyDone: true, dueCount: 0, weakCount: 0 };

  it('bez rozřazovacího testu začíná testem', () => {
    expect(nextUp({ ...base, placementDone: false, dueCount: 5 }).mode).toBe('placement');
  });

  it('denní výzva má přednost před opakováním – po půlnoci je pryč', () => {
    expect(nextUp({ ...base, dailyDone: false, dueCount: 20 }).reason).toBe('daily');
  });

  it('pak to, co je po termínu, a teprve potom slabiny', () => {
    expect(nextUp({ ...base, dueCount: 3, weakCount: 9 }).mode).toBe('review');
    expect(nextUp({ ...base, weakCount: 9 }).mode).toBe('weak');
  });

  it('když nic nehoří, nabídne klasiku', () => {
    expect(nextUp(base).mode).toBe('classic');
  });
});

describe('s čím si to pleteš', () => {
  const at = '2026-03-01T10:00:00Z';
  const log = [
    { code: 'ne', mode: 'classic', correct: false, elapsedMs: 3000, at, given: 'ng' },
    { code: 'ne', mode: 'classic', correct: false, elapsedMs: 3000, at, given: 'ng' },
    { code: 'ne', mode: 'classic', correct: false, elapsedMs: 3000, at, given: 'in' },
    { code: 'td', mode: 'classic', correct: false, elapsedMs: 3000, at },
    { code: 'ro', mode: 'classic', correct: true, elapsedMs: 3000, at, given: 'td' },
  ];

  it('sečte dvojice a seřadí je podle četnosti', () => {
    const found = confusions(log, () => true);
    expect(found[0]).toEqual({ code: 'ne', given: 'ng', count: 2 });
    expect(found).toHaveLength(2);
  });

  it('chyba bez zaznamenané odpovědi ani správná odpověď se nepočítají', () => {
    const found = confusions(log, () => true);
    expect(found.some((c) => c.code === 'td')).toBe(false);
    expect(found.some((c) => c.code === 'ro')).toBe(false);
  });

  it('respektuje sadu', () => {
    expect(confusions(log, (code) => code !== 'ng')).toEqual([
      { code: 'ne', given: 'in', count: 1 },
    ]);
  });
});
