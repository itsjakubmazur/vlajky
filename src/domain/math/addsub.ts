import type { Rng } from '../rng';
import type { AddSubLimit } from './operations';
import type { MathQuestion } from './session';

/**
 * Kolik příkladů má být s přechodem přes desítku (8 + 5, 43 − 17).
 *
 * Přesně tam se chybuje – 30 + 40 nebo 57 − 4 zvládne dítě, které umí
 * násobilku, i s očima zavřenýma. Úplně je vynechat ale nejde: kdyby byl
 * přechod v každém příkladu, dítě by ho přestalo hledat a dělalo by ho ze zvyku.
 */
export const CARRY_SHARE = 0.65;

/**
 * Kolo sčítání a odčítání: půl na půl, náhodně promíchané, žádný příklad
 * dvakrát. Výsledek ani žádné z čísel nikdy není nula a nic nepřesáhne mez.
 */
export function buildAddSubRound(rng: Rng, limit: AddSubLimit, length: number): MathQuestion[] {
  const out: MathQuestion[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < length && guard++ < length * 50) {
    const subtract = out.length % 2 === 1;
    const carry = rng() < CARRY_SHARE;
    const question = subtract ? subtraction(rng, limit, carry) : addition(rng, limit, carry);
    if (seen.has(question.key)) continue;
    seen.add(question.key);
    out.push(question);
  }
  return shuffleKeepingMix(out, rng);
}

function addition(rng: Rng, limit: AddSubLimit, carry: boolean): MathQuestion {
  const low = limit === 20 ? 1 : 2;
  for (let i = 0; i < 40; i++) {
    const a = between(rng, low, limit - low);
    const b = between(rng, low, limit - a);
    if (hasCarry(a, b) === carry) return add(a, b);
  }
  return add(between(rng, low, limit - low), low);
}

function subtraction(rng: Rng, limit: AddSubLimit, borrow: boolean): MathQuestion {
  const low = limit === 20 ? 1 : 2;
  const minMinuend = limit === 20 ? 3 : 20;
  for (let i = 0; i < 40; i++) {
    const a = between(rng, minMinuend, limit);
    const b = between(rng, low, a - 1);
    if (hasBorrow(a, b) === borrow) return sub(a, b);
  }
  const a = between(rng, minMinuend, limit);
  return sub(a, low);
}

/** Přechod přes desítku při sčítání: jednotky dohromady dají aspoň deset. */
export function hasCarry(a: number, b: number): boolean {
  return (a % 10) + (b % 10) >= 10;
}

/** Přechod přes desítku při odčítání: jednotek je v menšenci méně. */
export function hasBorrow(a: number, b: number): boolean {
  return a % 10 < b % 10;
}

function add(a: number, b: number): MathQuestion {
  return { key: `${a}+${b}`, op: '+', left: a, right: b, answer: a + b };
}

function sub(a: number, b: number): MathQuestion {
  return { key: `${a}-${b}`, op: '−', left: a, right: b, answer: a - b };
}

function between(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Zamíchá, ale tak, aby po sobě nešla víc než dvě stejná znaménka.
 * Jinak by se z kola občas stal blok sčítání a za ním blok odčítání.
 *
 * Losuje se znaménko po znaménku, a jen z těch, po kterých se zbytek ještě
 * dá dorovnat – jinak by na konci zbyly tři stejné za sebou.
 */
function shuffleKeepingMix(items: MathQuestion[], rng: Rng): MathQuestion[] {
  const groups = { plus: items.filter((q) => q.op === '+'), minus: items.filter((q) => q.op !== '+') };
  const out: MathQuestion[] = [];
  let lastKind: 'plus' | 'minus' | null = null;
  let run = 0;

  while (groups.plus.length || groups.minus.length) {
    const options = (['plus', 'minus'] as const).filter((kind) => {
      const other = kind === 'plus' ? 'minus' : 'plus';
      const mine = groups[kind].length - 1;
      const theirs = groups[other].length;
      if (mine < 0) return false;
      const nextRun = kind === lastKind ? run + 1 : 1;
      if (nextRun > 2) return false;
      // Zbytek musí jít rozložit: ze dvou skupin větší nejvýš dvakrát tolik
      // co mezery, které jí menší skupina nabídne.
      return mine <= 2 * theirs + (2 - nextRun) && theirs <= 2 * (mine + 1);
    });
    const pool = options.length > 0 ? options : (['plus', 'minus'] as const).filter((k) => groups[k].length);
    const weights = pool.map((kind) => groups[kind].length);
    let roll = rng() * weights.reduce((sum, w) => sum + w, 0);
    let kind = pool[0]!;
    for (const [i, candidate] of pool.entries()) {
      roll -= weights[i]!;
      if (roll < 0) {
        kind = candidate;
        break;
      }
    }
    out.push(groups[kind].shift()!);
    run = kind === lastKind ? run + 1 : 1;
    lastKind = kind;
  }
  return out;
}
