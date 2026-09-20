import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { applyAnswer, dailyBatch, emptyCardState, isDue, ratingFor } from '@/domain/srs/scheduler';
import { computeMastery, isLevelUp } from '@/domain/srs/mastery';
import type { CardState } from '@/domain/srs/types';

const now = new Date('2026-03-01T10:00:00Z');
const later = (days: number) => new Date(now.getTime() + days * 86_400_000);

describe('mapování odpovědi na hodnocení', () => {
  it('špatná odpověď je vždy Again', () => {
    expect(ratingFor({ correct: false, elapsedMs: 500, mode: 'classic' })).toBe(Rating.Again);
    expect(ratingFor({ correct: false, elapsedMs: 30_000, mode: 'typing' })).toBe(Rating.Again);
  });

  it('rychlá správná odpověď je Easy', () => {
    expect(ratingFor({ correct: true, elapsedMs: 1200, mode: 'classic' })).toBe(Rating.Easy);
  });

  it('běžně rychlá správná odpověď je Good', () => {
    expect(ratingFor({ correct: true, elapsedMs: 4000, mode: 'classic' })).toBe(Rating.Good);
  });

  it('pomalá správná odpověď je Hard', () => {
    expect(ratingFor({ correct: true, elapsedMs: 15_000, mode: 'classic' })).toBe(Rating.Hard);
  });

  it('napsat název je těžší než kliknout, proto Easy', () => {
    expect(ratingFor({ correct: true, elapsedMs: 5000, mode: 'typing' })).toBe(Rating.Easy);
  });
});

describe('zpracování odpovědi', () => {
  it('nová karta začíná na úrovni nová', () => {
    const card = emptyCardState('td', now);
    expect(card.mastery).toBe('new');
    expect(card.seen).toBe(0);
    expect(isDue(card, now)).toBe(false);
  });

  it('první správná odpověď dá bronz', () => {
    const card = applyAnswer(emptyCardState('td', now), { correct: true, elapsedMs: 3000, mode: 'classic' }, now);
    expect(card.mastery).toBe('bronze');
    expect(card.correct).toBe(1);
    expect(card.streak).toBe(1);
  });

  it('chyba vynuluje sérii, ale nesníží počet správných', () => {
    let card = applyAnswer(emptyCardState('td', now), { correct: true, elapsedMs: 2000, mode: 'classic' }, now);
    card = applyAnswer(card, { correct: false, elapsedMs: 4000, mode: 'classic' }, later(1));
    expect(card.streak).toBe(0);
    expect(card.correct).toBe(1);
    expect(card.seen).toBe(2);
  });

  it('tři správné v řadě dají stříbro', () => {
    let card = emptyCardState('td', now);
    for (let i = 0; i < 3; i++) {
      card = applyAnswer(card, { correct: true, elapsedMs: 3000, mode: 'classic' }, later(i));
    }
    expect(card.mastery).toBe('silver');
  });

  it('zlato nejde získat bez napsání názvu', () => {
    let card = emptyCardState('td', now);
    for (let i = 0; i < 8; i++) {
      card = applyAnswer(card, { correct: true, elapsedMs: 800, mode: 'classic' }, later(i * 20));
    }
    expect(card.fsrs.stability).toBeGreaterThan(30);
    expect(card.mastery).toBe('silver');

    card = applyAnswer(card, { correct: true, elapsedMs: 3000, mode: 'typing' }, later(200));
    expect(card.mastery).toBe('gold');
  });

  it('napovězená odpověď na zlato nestačí', () => {
    let card = emptyCardState('td', now);
    for (let i = 0; i < 8; i++) {
      card = applyAnswer(card, { correct: true, elapsedMs: 800, mode: 'classic' }, later(i * 20));
    }
    // Klepnutí na našeptávač není napsání názvu – zlato se za něj nedává.
    card = applyAnswer(
      card,
      { correct: true, elapsedMs: 3000, mode: 'typing', assisted: true },
      later(200),
    );
    expect(card.typedCorrect).toBe(0);
    expect(card.mastery).toBe('silver');
  });

  it('pauza mimo aplikaci nezkazí hodnocení', () => {
    const paused = applyAnswer(
      emptyCardState('td', now),
      { correct: true, elapsedMs: 10 * 60 * 1000, mode: 'classic' },
      now,
    );
    const capped = applyAnswer(
      emptyCardState('td', now),
      { correct: true, elapsedMs: 60_000, mode: 'classic' },
      now,
    );
    expect(paused.fsrs.stability).toBe(capped.fsrs.stability);
  });

  it('rozřazovací test neznámou vlajku nepohřbí', () => {
    const fresh = emptyCardState('td', now);
    const after = applyAnswer(fresh, { correct: false, elapsedMs: 4000, mode: 'classic', isPlacement: true }, now);
    expect(after.fsrs).toEqual(fresh.fsrs);
    expect(after.seen).toBe(1);
    expect(after.mastery).toBe('new');
  });

  it('rozřazovací test odloží vlajku, kterou dítě umí', () => {
    const after = applyAnswer(
      emptyCardState('td', now),
      { correct: true, elapsedMs: 900, mode: 'classic', isPlacement: true },
      now,
    );
    expect(new Date(after.fsrs.due).getTime()).toBeGreaterThan(now.getTime());
    // Rychlá správná odpověď = Easy, takže plánovač vlajku odloží daleko.
    // Na stříbro ale jedna trefa nestačí – to je až po druhém potvrzení.
    expect(after.mastery).toBe('bronze');
    expect(after.fsrs.stability).toBeGreaterThan(7);
  });
});

describe('úrovně zvládnutí', () => {
  const base: CardState = { ...emptyCardState('td', now), seen: 5, correct: 5, streak: 5, typedCorrect: 1 };

  it('bez jediné správné odpovědi zůstává nová', () => {
    expect(computeMastery({ ...base, correct: 0, streak: 0 })).toBe('new');
  });

  it('jedna rychlá trefa dá bronz, ne rovnou stříbro', () => {
    const lucky: CardState = {
      ...emptyCardState('td', now),
      seen: 1,
      correct: 1,
      streak: 1,
      fsrs: { ...emptyCardState('td', now).fsrs, stability: 12 },
    };
    expect(computeMastery(lucky)).toBe('bronze');
    expect(computeMastery({ ...lucky, seen: 2, correct: 2, streak: 2 })).toBe('silver');
  });

  it('postup na vyšší úroveň se pozná', () => {
    expect(isLevelUp('new', 'bronze')).toBe(true);
    expect(isLevelUp('silver', 'gold')).toBe(true);
    expect(isLevelUp('gold', 'silver')).toBe(false);
    expect(isLevelUp('bronze', 'bronze')).toBe(false);
  });
});

describe('denní dávka', () => {
  const codes = Array.from({ length: 50 }, (_, i) => `c${i}`);
  const difficultyOf = (code: string) => Number(code.slice(1)) % 5;

  it('u nového hráče nabídne nové vlajky od nejsnazších', () => {
    const batch = dailyBatch([], codes, now, difficultyOf);
    expect(batch.length).toBe(10);
    expect(difficultyOf(batch[0]!)).toBe(0);
  });

  it('přednost mají karty po termínu', () => {
    const due: CardState = {
      ...emptyCardState('c40', now),
      seen: 3,
      correct: 2,
      fsrs: { ...emptyCardState('c40', now).fsrs, due: later(-2).toISOString() },
    };
    const batch = dailyBatch([due], codes, now, difficultyOf);
    expect(batch[0]).toBe('c40');
  });

  it('nikdy nepřekročí horní mez', () => {
    const cards = codes.map((code) => ({
      ...emptyCardState(code, now),
      seen: 1,
      correct: 1,
      fsrs: { ...emptyCardState(code, now).fsrs, due: later(-1).toISOString() },
    }));
    expect(dailyBatch(cards, codes, now, difficultyOf).length).toBe(15);
  });

  it('neopakuje tutéž vlajku dvakrát', () => {
    const batch = dailyBatch([], codes, now, difficultyOf);
    expect(new Set(batch).size).toBe(batch.length);
  });
});
