import { describe, expect, it } from 'vitest';
import { ALL_COUNTRIES, requireCountry } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { buildSession, SESSION_LENGTH } from '@/domain/quiz/session';
import {
  bandSkill,
  bandStats,
  estimateKnown,
  PLACEMENT_LENGTH,
  placementPlan,
} from '@/domain/srs/placement';
import { buildQuestion, kindForMode, pickTwin, twinnableCountries } from '@/domain/quiz/modes';
import { applyAnswer, emptyCardState } from '@/domain/srs/scheduler';
import { createRng } from '@/domain/rng';
import type { CardState } from '@/domain/srs/types';

const world = countriesInSet([...ALL_COUNTRIES], 'world');
const now = new Date('2026-03-01T10:00:00Z');

describe('sestavení hry', () => {
  it('má správnou délku a neopakuje vlajky', () => {
    const codes = buildSession({ mode: 'classic', pool: world, cards: {}, now, rng: createRng(1) });
    expect(codes).toHaveLength(SESSION_LENGTH);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('přednost dostane vlajka po termínu', () => {
    const overdue = {
      ...emptyCardState('td', now),
      seen: 3,
      correct: 1,
      fsrs: { ...emptyCardState('td', now).fsrs, due: new Date('2026-02-01').toISOString() },
    } satisfies CardState;
    const codes = buildSession({
      mode: 'classic',
      pool: world,
      cards: { td: overdue },
      now,
      rng: createRng(2),
    });
    expect(codes).toContain('td');
  });

  it('Dvojčata berou jen vlajky, které mají dvojče', () => {
    const codes = buildSession({ mode: 'twins', pool: world, cards: {}, now, rng: createRng(3) });
    for (const code of codes) {
      expect(requireCountry(code).similar.length).toBeGreaterThan(0);
    }
  });

  it('Chytré opakování dá denní dávku', () => {
    const codes = buildSession({ mode: 'review', pool: world, cards: {}, now, rng: createRng(4) });
    expect(codes.length).toBeGreaterThanOrEqual(10);
    expect(codes.length).toBeLessThanOrEqual(15);
  });

  it('nezasekne se, když je sada menší než hra', () => {
    const small = world.slice(0, 5);
    const codes = buildSession({ mode: 'classic', pool: small, cards: {}, now, rng: createRng(5) });
    expect(codes.length).toBe(5);
    expect(new Set(codes).size).toBe(5);
  });
});

describe('rozřazovací test', () => {
  it('je krátký a vzorkuje napříč obtížnostmi', () => {
    const plan = placementPlan(world);
    expect(plan.length).toBeLessThanOrEqual(PLACEMENT_LENGTH + 6);
    expect(new Set(plan).size).toBe(plan.length);
    const bands = new Set(plan.map((code) => requireCountry(code).difficulty));
    expect(bands).toEqual(new Set([1, 2, 3, 4, 5]));
  });

  it('začíná od nejznámějších', () => {
    const plan = placementPlan(world);
    expect(requireCountry(plan[0]!).difficulty).toBe(1);
    expect(requireCountry(plan[plan.length - 1]!).difficulty).toBe(5);
  });

  it('má stabilní pořadí, aby šlo navázat po pauze', () => {
    expect(placementPlan(world)).toEqual(placementPlan(world));
  });

  it('z výsledků odhadne, kolik vlajek dítě umí', () => {
    const plan = placementPlan(world);
    const allRight = Object.fromEntries(plan.map((code) => [code, true]));
    expect(estimateKnown(bandStats(world, allRight))).toBe(world.length);

    const allWrong = Object.fromEntries(plan.map((code) => [code, false]));
    expect(estimateKnown(bandStats(world, allWrong))).toBe(0);
  });

  it('pásmo, na které se nezeptal, si nedomýšlí', () => {
    const plan = placementPlan(world);
    const partial = Object.fromEntries(
      plan
        .filter((code) => requireCountry(code).difficulty <= 2)
        .map((code) => [code, true]),
    );
    const skill = bandSkill(bandStats(world, partial));
    expect(skill[1]).toBe(1);
    expect(skill[5]).toBeUndefined();
  });

  it('po testu se nové vlajky berou od nejslabšího pásma', () => {
    const now = new Date('2024-05-01T10:00:00Z');
    const codes = buildSession({
      mode: 'classic',
      pool: world,
      cards: {},
      now,
      rng: createRng(9),
      bandSkill: { 1: 0.2, 2: 1, 3: 1, 4: 1, 5: 1 },
    });
    const easy = codes.filter((code) => requireCountry(code).difficulty === 1);
    expect(easy.length).toBeGreaterThan(0);
  });
});

describe('otázky', () => {
  it('Klasika nabídne čtyři možnosti včetně správné', () => {
    const q = buildQuestion({
      mode: 'classic',
      target: requireCountry('td'),
      pool: world,
      mastery: 'silver',
      rng: createRng(6),
    });
    expect(q.kind).toBe('pickCountry');
    expect(q.options).toHaveLength(4);
    expect(q.options).toContain('td');
  });

  it('Opačně ukazuje vlajky místo názvů', () => {
    const q = buildQuestion({
      mode: 'reverse',
      target: requireCountry('jp'),
      pool: world,
      mastery: 'new',
      rng: createRng(7),
    });
    expect(q.kind).toBe('pickFlag');
    expect(q.options).toHaveLength(4);
  });

  it('Napiš nenabízí nic', () => {
    const q = buildQuestion({
      mode: 'typing',
      target: requireCountry('cz'),
      pool: world,
      mastery: 'gold',
      rng: createRng(8),
    });
    expect(q.kind).toBe('type');
    expect(q.options).toHaveLength(0);
  });

  it('Dvojčata postaví právě dvě zaměnitelné vlajky', () => {
    const target = requireCountry('td');
    const q = buildQuestion({
      mode: 'twins',
      target,
      pool: world,
      mastery: 'silver',
      rng: createRng(9),
    });
    expect(q.options).toHaveLength(2);
    expect(q.options).toContain('td');
    const other = q.options.find((c) => c !== 'td')!;
    expect(target.similar).toContain(other);
  });

  it('dvojče se hledá jen v aktivní sadě', () => {
    const onlyChad = world.filter((c) => c.code === 'td');
    expect(pickTwin(requireCountry('td'), onlyChad, createRng(10))).toBeUndefined();
  });

  it('Chytré opakování střídá typy otázek', () => {
    const kinds = new Set(Array.from({ length: 30 }, (_, i) => kindForMode('review', createRng(i))));
    expect(kinds.size).toBeGreaterThan(1);
  });

  it('nabídka je pro pokročilého těžší než pro začátečníka', () => {
    const target = requireCountry('ro');
    const easy = buildQuestion({ mode: 'classic', target, pool: world, mastery: 'new', rng: createRng(11) });
    const hard = buildQuestion({ mode: 'classic', target, pool: world, mastery: 'gold', rng: createRng(11) });
    expect(hard.options).toContain('td');
    expect(easy.options).not.toContain('td');
  });

  it('všechny vlajky se dvojčetem jsou hratelné v režimu Dvojčata', () => {
    const twinnable = twinnableCountries(world);
    expect(twinnable.length).toBeGreaterThan(40);
    for (const country of twinnable) {
      const q = buildQuestion({
        mode: 'twins',
        target: country,
        pool: world,
        mastery: 'silver',
        rng: createRng(12),
      });
      expect(q.options.length, country.code).toBe(2);
    }
  });
});

describe('postup se propisuje do hry', () => {
  it('po správné odpovědi se vlajka posune dál v čase', () => {
    const card = applyAnswer(emptyCardState('td', now), { correct: true, elapsedMs: 3000, mode: 'classic' }, now);
    expect(new Date(card.fsrs.due).getTime()).toBeGreaterThan(now.getTime());
  });
});
