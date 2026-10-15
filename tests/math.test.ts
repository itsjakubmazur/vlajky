import { describe, expect, it } from 'vitest';
import {
  ALL_FACTS,
  difficultyOf,
  factKey,
  factsInRange,
  parseFactKey,
  requireFact,
} from '@/domain/math/facts';
import { buildRound, masteredCount, ROUND_LENGTH, weakestFacts } from '@/domain/math/session';
import { applyAnswer, emptyCardState } from '@/domain/srs/scheduler';
import type { CardState } from '@/domain/srs/types';
import { createRng } from '@/domain/rng';

const now = new Date('2026-03-01T10:00:00Z');

function cardsFrom(entries: Record<string, { correct: boolean; times: number }>) {
  const cards: Record<string, CardState> = {};
  for (const [key, { correct, times }] of Object.entries(entries)) {
    let card = emptyCardState(key, now);
    for (let i = 0; i < times; i++) {
      card = applyAnswer(card, { correct, elapsedMs: 3000, mode: 'typing' }, now);
    }
    cards[key] = card;
  }
  return cards;
}

describe('malá násobilka – příklady', () => {
  it('má 55 příkladů, protože 7×8 a 8×7 je jedna znalost', () => {
    expect(ALL_FACTS).toHaveLength(55);
    expect(factKey(8, 7)).toBe('7x8');
    expect(factKey(7, 8)).toBe('7x8');
  });

  it('klíč se dá přečíst zpátky', () => {
    expect(parseFactKey('7x8')).toEqual({ a: 7, b: 8 });
    expect(parseFactKey('0x5')).toBeNull();
    expect(parseFactKey('7x11')).toBeNull();
    expect(parseFactKey('sedmkrát osm')).toBeNull();
  });

  it('součiny sedí', () => {
    for (const fact of ALL_FACTS) expect(fact.product).toBe(fact.a * fact.b);
  });

  it('obtížnost se počítá z činitelů, ne od oka', () => {
    // Řady 1 a 10 jsou přepsání čísla, 2 a 5 má dítě z počítání po dvou
    // a po pěti. Co zbyde, je to, kde se doopravdy chybuje.
    expect(difficultyOf(1, 7)).toBe(1);
    expect(difficultyOf(10, 6)).toBe(1);
    expect(difficultyOf(5, 9)).toBe(2);
    expect(difficultyOf(7, 7)).toBe(2);
    expect(difficultyOf(7, 8)).toBe(5);
    expect(difficultyOf(6, 7)).toBe(5);
  });

  it('řada má deset příkladů', () => {
    expect(factsInRange(7)).toHaveLength(10);
    expect(factsInRange(null)).toHaveLength(55);
    for (const fact of factsInRange(7)) expect(fact.a === 7 || fact.b === 7).toBe(true);
  });
});

describe('malá násobilka – kolo', () => {
  it('má plnou délku a jen opravdové příklady', () => {
    const round = buildRound({ cards: {}, now, rng: createRng(1) });
    expect(round).toHaveLength(ROUND_LENGTH);
    for (const question of round) {
      expect(question.left * question.right).toBe(question.product);
      expect(requireFact(question.key).product).toBe(question.product);
    }
  });

  it('dva příklady po sobě nemají společného činitele', () => {
    // Tohle je celý smysl modulu: řada jde nazpaměť, náhodné pořadí ne.
    // Bez rozhazování vznikaly shluky a z náhody se zpátky stala řada.
    for (let seed = 1; seed <= 30; seed++) {
      const round = buildRound({ cards: {}, now, rng: createRng(seed) });
      for (let i = 1; i < round.length; i++) {
        const a = round[i]!;
        const b = round[i - 1]!;
        const shared = [a.left, a.right].some((n) => n === b.left || n === b.right);
        expect(shared, `semínko ${seed}, pozice ${i}: ${b.key} → ${a.key}`).toBe(false);
      }
    }
  });

  it('pořadí se mezi koly mění', () => {
    const first = buildRound({ cards: {}, now, rng: createRng(1) }).map((q) => q.key);
    const second = buildRound({ cards: {}, now, rng: createRng(2) }).map((q) => q.key);
    expect(first).not.toEqual(second);
  });

  it('ptá se oběma směry, ne pořád menším činitelem napřed', () => {
    const round = buildRound({ cards: {}, now, rng: createRng(7), length: 55 });
    const flipped = round.filter((q) => q.left > q.right);
    expect(flipped.length).toBeGreaterThan(5);
  });

  it('v jedné řadě dá plné kolo, i když má řada jen deset příkladů', () => {
    const round = buildRound({ cards: {}, now, rng: createRng(3), range: 7 });
    expect(round).toHaveLength(ROUND_LENGTH);
    for (const question of round) {
      expect(question.left === 7 || question.right === 7).toBe(true);
    }
  });

  it('co dítě neumí, přijde na řadu dřív', () => {
    // Všechno zvládnuté kromě jednoho příkladu – ten musí být v kole.
    const cards = cardsFrom(
      Object.fromEntries(ALL_FACTS.map((f) => [f.key, { correct: true, times: 4 }])),
    );
    cards['6x7'] = cardsFrom({ '6x7': { correct: false, times: 3 } })['6x7']!;

    const round = buildRound({ cards, now, rng: createRng(5) });
    expect(round.map((q) => q.key)).toContain('6x7');
  });

  it('přehled slabin řadí podle podílu chyb', () => {
    const cards = {
      ...cardsFrom({ '6x7': { correct: false, times: 4 } }),
      ...cardsFrom({ '3x4': { correct: true, times: 4 } }),
      ...cardsFrom({ '8x9': { correct: false, times: 2 } }),
    };
    const weak = weakestFacts(cards).map((entry) => entry.key);
    expect(weak).toContain('6x7');
    expect(weak).toContain('8x9');
    expect(weak).not.toContain('3x4');
    expect(weak[0]).toBe('6x7');
  });

  it('zvládnuté se počítají od stříbra', () => {
    const cards = cardsFrom({ '3x4': { correct: true, times: 4 }, '6x7': { correct: false, times: 2 } });
    expect(masteredCount(cards)).toBe(1);
  });
});
