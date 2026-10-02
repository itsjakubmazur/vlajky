import type { CardState } from '@/domain/srs/types';
import { HISTORY_DAYS } from '@/domain/game/history';
import { LOG_LIMIT, migrate, type GameRecord, type Progress } from './ProgressStore';

/**
 * Sloučí dva postupy do jednoho.
 *
 * Potřebuje to import zálohy a potřebuje to i synchronizace mezi zařízeními:
 * když se hraje na tabletu i na telefonu, není „ten správný“ postup ani jeden.
 * Přepsat jeden druhým by znamenalo zahodit odehrané kolo.
 *
 * Pravidlo je u každého pole jiné, protože jiné dává smysl:
 *
 * - **karty** – ta, která je novější podle `updatedAt`. Plánovač FSRS stojí
 *   na posledním opakování, takže starší karta by vlajku položila podruhé.
 * - **body a rekordy** – vyšší hodnota, ne součet. Součet by při dvojím
 *   importu téže zálohy body zdvojnásobil.
 * - **seznamy** (souboje, vyzvednuté mise) – sjednocení.
 * - **graf sbírky** – za každý den vyšší hodnota. Sbírka se nezmenšuje.
 * - **nastavení** (rámeček, zvuk) – z toho zařízení, které ukládalo později.
 *   Tady na „správnosti“ nezáleží, jen aby to nepřeskakovalo.
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const left = migrate(a);
  const right = migrate(b);
  const newer = laterOf(left.savedAt, right.savedAt) === right.savedAt ? right : left;

  const cards: Record<string, CardState> = { ...left.cards };
  for (const [code, card] of Object.entries(right.cards)) {
    const mine = cards[code];
    cards[code] = !mine || card.updatedAt > mine.updatedAt ? card : mine;
  }

  const records: Record<string, GameRecord> = { ...left.meta.records };
  for (const [mode, record] of Object.entries(right.meta.records)) {
    const mine = records[mode];
    if (!mine || record.points > mine.points) records[mode] = record;
  }

  const history = { ...left.meta.history };
  for (const [day, snapshot] of Object.entries(right.meta.history)) {
    const mine = history[day];
    history[day] = mine
      ? {
          collected: Math.max(mine.collected, snapshot.collected),
          gold: Math.max(mine.gold, snapshot.gold),
        }
      : snapshot;
  }
  for (const day of Object.keys(history).sort().slice(0, -HISTORY_DAYS)) delete history[day];

  const dailyResults = { ...left.meta.dailyResults };
  for (const [day, result] of Object.entries(right.meta.dailyResults)) {
    const mine = dailyResults[day];
    if (!mine || result.points > mine.points) dailyResults[day] = result;
  }

  const missionsClaimed = { ...left.meta.missionsClaimed };
  for (const [day, ids] of Object.entries(right.meta.missionsClaimed)) {
    missionsClaimed[day] = [...new Set([...(missionsClaimed[day] ?? []), ...ids])];
  }

  return {
    schemaVersion: newer.schemaVersion,
    cards,
    log: mergeLog(left.log, right.log),
    savedAt: laterOf(left.savedAt, right.savedAt),
    meta: {
      ...newer.meta,
      placementDone: left.meta.placementDone || right.meta.placementDone,
      placementIndex: Math.max(left.meta.placementIndex, right.meta.placementIndex),
      placementResults: { ...left.meta.placementResults, ...right.meta.placementResults },
      streakDays: Math.max(left.meta.streakDays, right.meta.streakDays),
      lastPlayedDay: laterOf(left.meta.lastPlayedDay, right.meta.lastPlayedDay),
      totalAnswers: Math.max(left.meta.totalAnswers, right.meta.totalAnswers),
      totalPoints: Math.max(left.meta.totalPoints, right.meta.totalPoints),
      records,
      bossesBeaten: [...new Set([...left.meta.bossesBeaten, ...right.meta.bossesBeaten])],
      dailyResults,
      missionsClaimed,
      history,
      // Rozehraný turnaj se nespojuje – patří k jednomu zařízení, na kterém
      // si ho rodina předává. Zůstane ten z novějšího postupu.
      party: newer.meta.party,
    },
  };
}

/**
 * Odpovědi z obou stran podle času. Stejná odpověď (tatáž vlajka ve stejný
 * okamžik) se nepočítá dvakrát, aby přehled záměn nelhal.
 */
function mergeLog(left: Progress['log'], right: Progress['log']): Progress['log'] {
  const byKey = new Map<string, Progress['log'][number]>();
  for (const entry of [...left, ...right]) byKey.set(`${entry.at}|${entry.code}|${entry.mode}`, entry);
  return [...byKey.values()].sort((x, y) => x.at.localeCompare(y.at)).slice(-LOG_LIMIT);
}

function laterOf(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
