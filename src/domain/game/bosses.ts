import { similarGroups } from '~data/similar';
import type { Country } from '../types';

/**
 * Souboje se zrádnými dvojicemi.
 *
 * Skupiny zaměnitelných vlajek, které v datech máme kvůli distraktorům,
 * jsou samy o sobě ta nejtěžší věc v celé aplikaci. Stačí je pojmenovat
 * a udělat z nich protivníky.
 */
export interface Boss {
  id: string;
  codes: string[];
}

/** Kolik otázek je potřeba zvládnout bez chyby. */
export const BOSS_QUESTIONS = 5;

export function bossesFor(pool: readonly Country[]): Boss[] {
  const inPool = new Set(pool.map((c) => c.code));
  const seen = new Set<string>();
  const bosses: Boss[] = [];

  for (const group of similarGroups) {
    const codes = group.filter((code) => inPool.has(code));
    if (codes.length < 2) continue;
    const id = [...codes].sort().join('-');
    if (seen.has(id)) continue;
    seen.add(id);
    bosses.push({ id, codes });
  }

  // Nejdřív dvojice, pak větší skupiny – aby se začínalo od zvládnutelných.
  return bosses.sort((a, b) => a.codes.length - b.codes.length || a.id.localeCompare(b.id));
}

export function bossById(pool: readonly Country[], id: string): Boss | undefined {
  return bossesFor(pool).find((boss) => boss.id === id);
}

/** Jméno souboje se skládá ze jmen zemí – žádné vymýšlené přezdívky. */
export function bossName(boss: Boss, nameOf: (code: string) => string): string {
  const names = boss.codes.map(nameOf);
  if (names.length === 2) return `${names[0]} vs. ${names[1]}`;
  return names.join(' · ');
}
