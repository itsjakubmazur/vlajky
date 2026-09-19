import { RANKS, rankFor } from './ranks';

/**
 * Odemykatelné věci. Důvod, proč se vracet, i když je album plné.
 * Nic z toho neovlivňuje hru – jen jak vypadá.
 */
export type UnlockKind = 'frame' | 'theme';

export interface Unlock {
  id: string;
  kind: UnlockKind;
  /** Hodnost, od které je k dispozici. */
  rank?: string;
  /** Nebo počet zlatých vlajek. */
  golds?: number;
  /** Nebo počet poražených soubojů. */
  bosses?: number;
}

export const UNLOCKS: readonly Unlock[] = [
  { id: 'frame-classic', kind: 'frame' },
  { id: 'frame-gold', kind: 'frame', golds: 25 },
  { id: 'frame-neon', kind: 'frame', rank: 'kartograf' },
  { id: 'frame-stamp', kind: 'frame', bosses: 5 },
  { id: 'theme-night', kind: 'theme' },
  { id: 'theme-sunrise', kind: 'theme', rank: 'pruzkumnik' },
  { id: 'theme-deep', kind: 'theme', rank: 'velvyslanec' },
  { id: 'theme-aurora', kind: 'theme', bosses: 12 },
];

export interface UnlockState {
  totalPoints: number;
  golds: number;
  bosses: number;
}

export function isUnlocked(unlock: Unlock, state: UnlockState): boolean {
  if (unlock.golds !== undefined && state.golds < unlock.golds) return false;
  if (unlock.bosses !== undefined && state.bosses < unlock.bosses) return false;
  if (unlock.rank !== undefined) {
    const have = RANKS.findIndex((r) => r.id === rankFor(state.totalPoints).id);
    const need = RANKS.findIndex((r) => r.id === unlock.rank);
    if (have < need) return false;
  }
  return true;
}

export function unlockedIds(state: UnlockState): string[] {
  return UNLOCKS.filter((u) => isUnlocked(u, state)).map((u) => u.id);
}
