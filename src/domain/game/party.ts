import type { QuizModeId } from '../quiz/modes';

/**
 * Turnaj u jednoho zařízení.
 *
 * Rodina má jeden tablet, ne pět. Hraje se proto po sobě: kolo dostane
 * seznam vlajek a **každý hráč dostane přesně ten samý seznam** – jinak by
 * se výsledky nedaly porovnat. Tablet se mezi hráči předává, kolo se dá
 * opakovat a aplikace počítá, kdo kolik kol vyhrál.
 *
 * Turnaj se schválně nepočítá do postupu majitele zařízení: hraje na něm
 * i táta a babička, takže by to jinak rozhodilo plánovač i hodnost.
 */
export const PARTY_MIN_PLAYERS = 2;
export const PARTY_MAX_PLAYERS = 6;

/** Kolik otázek má jedno kolo. */
export const PARTY_LENGTHS = [5, 10, 15] as const;
export const PARTY_DEFAULT_LENGTH = 10;

/**
 * Režimy, které v turnaji dávají smysl.
 *
 * Chybí schválně: opakování a slabiny (jedou podle paměti majitele
 * zařízení), denní výzva (je jedna na den), souboj (potřebuje soupeřící
 * dvojici) a maraton (nemá konec).
 */
export const PARTY_MODES: readonly QuizModeId[] = [
  'classic',
  'reverse',
  'typing',
  'twins',
  'flash',
  'risk',
  'capitals',
  'map',
  'sort',
];

export interface PartyPlayer {
  id: string;
  name: string;
}

/** Jak dopadl jeden hráč v jednom kole. */
export interface PartyScore {
  correct: number;
  total: number;
  points: number;
  bestCombo: number;
  elapsedMs: number;
}

export interface PartyRound {
  /** Vlajky pro tohle kolo – stejné pro všechny hráče. */
  codes: string[];
  /** Výsledky hráčů, kteří už hráli. */
  scores: Record<string, PartyScore>;
}

export interface PartyState {
  players: PartyPlayer[];
  mode: QuizModeId;
  length: number;
  rounds: PartyRound[];
}

export function createParty(
  players: PartyPlayer[],
  mode: QuizModeId,
  length: number,
): PartyState {
  return { players, mode, length, rounds: [] };
}

/** Přidá nové kolo se zadanými vlajkami. */
export function startRound(state: PartyState, codes: string[]): PartyState {
  return { ...state, rounds: [...state.rounds, { codes, scores: {} }] };
}

/** Rozehrané kolo, nebo `undefined`, když se ještě žádné nezačalo. */
export function currentRound(state: PartyState): PartyRound | undefined {
  return state.rounds[state.rounds.length - 1];
}

/** Kdo je na řadě; `undefined`, když kolo dohráli všichni. */
export function playerOnTurn(state: PartyState): PartyPlayer | undefined {
  const round = currentRound(state);
  if (!round) return undefined;
  return state.players.find((player) => round.scores[player.id] === undefined);
}

/** Zapíše výsledek hráče do rozehraného kola. */
export function recordScore(
  state: PartyState,
  playerId: string,
  score: PartyScore,
): PartyState {
  const round = currentRound(state);
  if (!round) return state;
  const updated: PartyRound = { ...round, scores: { ...round.scores, [playerId]: score } };
  return { ...state, rounds: [...state.rounds.slice(0, -1), updated] };
}

export function isRoundComplete(state: PartyState): boolean {
  const round = currentRound(state);
  if (!round) return false;
  return state.players.every((player) => round.scores[player.id] !== undefined);
}

/**
 * Kdo kolo vyhrál. Při shodě bodů vyhrávají všichni se stejným nejvyšším
 * skóre – dělenou první příčku je lepší přiznat než ji rozhodnout mincí.
 */
export function roundWinners(round: PartyRound): string[] {
  const entries = Object.entries(round.scores);
  if (entries.length === 0) return [];
  const best = Math.max(...entries.map(([, score]) => score.points));
  return entries.filter(([, score]) => score.points === best).map(([id]) => id);
}

export interface Standing {
  player: PartyPlayer;
  /** Kolik dohraných kol hráč vyhrál. */
  wins: number;
  /** Součet bodů ze všech dohraných kol. */
  points: number;
  correct: number;
  total: number;
}

/**
 * Pořadí turnaje. Rozhodují vyhraná kola, až při shodě body – jinak by
 * jedno vydařené kolo přebilo tři těsně vyhraná.
 */
export function standings(state: PartyState): Standing[] {
  const done = state.rounds.filter((round) =>
    state.players.every((player) => round.scores[player.id] !== undefined),
  );

  const rows = state.players.map((player) => {
    let wins = 0;
    let points = 0;
    let correct = 0;
    let total = 0;
    for (const round of done) {
      const score = round.scores[player.id];
      if (!score) continue;
      points += score.points;
      correct += score.correct;
      total += score.total;
      if (roundWinners(round).includes(player.id)) wins += 1;
    }
    return { player, wins, points, correct, total };
  });

  return rows.sort(
    (a, b) => b.wins - a.wins || b.points - a.points || a.player.name.localeCompare(b.player.name, 'cs'),
  );
}

/** Kolik kol je dohraných. */
export function roundsPlayed(state: PartyState): number {
  return state.rounds.filter((round) =>
    state.players.every((player) => round.scores[player.id] !== undefined),
  ).length;
}
