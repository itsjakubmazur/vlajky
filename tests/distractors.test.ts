import { describe, expect, it } from 'vitest';
import { ALL_COUNTRIES, requireCountry } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { buildOptions, challengeFromMastery, pickDistractors } from '@/domain/quiz/distractors';
import { createRng } from '@/domain/rng';

const world = countriesInSet([...ALL_COUNTRIES], 'world');

describe('distraktory', () => {
  it('vrátí požadovaný počet a nikdy správnou odpověď', () => {
    for (const target of world) {
      const picks = pickDistractors(target, world, { rng: createRng(1), challenge: 0.8 });
      expect(picks).toHaveLength(3);
      expect(picks.map((c) => c.code)).not.toContain(target.code);
      expect(new Set(picks.map((c) => c.code)).size).toBe(3);
    }
  });

  it('pro pokročilého sáhne nejdřív po zaměnitelných vlajkách', () => {
    const chad = requireCountry('td');
    const picks = pickDistractors(chad, world, { rng: createRng(42), challenge: 0.9 });
    expect(picks.map((c) => c.code)).toContain('ro');
  });

  it('začátečníkovi zaměnitelné vlajky nepodstrkává', () => {
    const chad = requireCountry('td');
    const picks = pickDistractors(chad, world, { rng: createRng(42), challenge: 0.1 });
    const similar = picks.filter((c) => chad.similar.includes(c.code));
    expect(similar).toHaveLength(0);
  });

  it('se stejným seedem vybere totéž', () => {
    const target = requireCountry('cz');
    const a = pickDistractors(target, world, { rng: createRng(7), challenge: 0.7 });
    const b = pickDistractors(target, world, { rng: createRng(7), challenge: 0.7 });
    expect(a.map((c) => c.code)).toEqual(b.map((c) => c.code));
  });

  it('funguje i v malé sadě', () => {
    const small = world.slice(0, 4);
    const picks = pickDistractors(small[0]!, small, { rng: createRng(3) });
    expect(picks).toHaveLength(3);
  });

  it('úroveň zvládnutí zvyšuje náročnost nabídky', () => {
    expect(challengeFromMastery('new')).toBeLessThan(challengeFromMastery('bronze'));
    expect(challengeFromMastery('bronze')).toBeLessThan(challengeFromMastery('silver'));
    expect(challengeFromMastery('silver')).toBeLessThan(challengeFromMastery('gold'));
  });
});

describe('sestavení možností', () => {
  it('obsahuje správnou odpověď a má čtyři položky', () => {
    const target = requireCountry('jp');
    const picks = pickDistractors(target, world, { rng: createRng(5), challenge: 0.8 });
    const options = buildOptions(target, picks, createRng(5));
    expect(options).toHaveLength(4);
    expect(options.map((c) => c.code)).toContain('jp');
  });

  it('nemá správnou odpověď pořád na stejném místě', () => {
    const target = requireCountry('jp');
    const picks = pickDistractors(target, world, { rng: createRng(5), challenge: 0.8 });
    const positions = new Set(
      Array.from({ length: 20 }, (_, i) =>
        buildOptions(target, picks, createRng(i)).findIndex((c) => c.code === 'jp'),
      ),
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});
