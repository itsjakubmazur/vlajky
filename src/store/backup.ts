import { migrate, SCHEMA_VERSION, type Progress } from './ProgressStore';

/** Značka v souboru – aby se nedal omylem nahrát cizí JSON. */
const KIND = 'vlajky-postup';

export interface BackupFile {
  kind: typeof KIND;
  /** Verze schématu postupu, kvůli migraci starší zálohy. */
  schemaVersion: number;
  /** Kdy se záloha vytvořila. */
  at: string;
  /** Kolik vlajek a bodů v ní je – ke kontrole očima před nahráním. */
  summary: { collected: number; points: number; answers: number };
  progress: Progress;
}

export type BackupProblem = 'notJson' | 'notOurs' | 'newerSchema';

export type BackupRead =
  | { ok: true; file: BackupFile }
  | { ok: false; problem: BackupProblem };

export function encodeBackup(progress: Progress, at = new Date()): string {
  const file: BackupFile = {
    kind: KIND,
    schemaVersion: SCHEMA_VERSION,
    at: at.toISOString(),
    summary: summarize(progress),
    progress,
  };
  return JSON.stringify(file, null, 2);
}

/**
 * Přečte zálohu. Nikdy nehodí výjimku – nahrání cizího souboru je běžná
 * nehoda, ne chyba programu, a aplikace o tom má umět říct česky.
 */
export function decodeBackup(text: string): BackupRead {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, problem: 'notJson' };
  }
  if (typeof parsed !== 'object' || parsed === null) return { ok: false, problem: 'notOurs' };
  const file = parsed as Partial<BackupFile>;
  if (file.kind !== KIND || typeof file.progress !== 'object' || file.progress === null) {
    return { ok: false, problem: 'notOurs' };
  }
  // Záloha z novější verze aplikace může mít pole, která tahle neumí. Načíst
  // ji a tiše je zahodit by byla ztráta dat, takže se radši odmítne.
  if (typeof file.schemaVersion === 'number' && file.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, problem: 'newerSchema' };
  }
  const progress = migrate(file.progress);
  return {
    ok: true,
    file: {
      kind: KIND,
      schemaVersion: progress.schemaVersion,
      at: typeof file.at === 'string' ? file.at : (progress.savedAt ?? ''),
      summary: summarize(progress),
      progress,
    },
  };
}

/** Název souboru se dnem, aby šly zálohy rozeznat ve složce Stažené. */
export function backupFileName(at = new Date()): string {
  return `vlajky-postup-${at.toISOString().slice(0, 10)}.json`;
}

function summarize(progress: Progress): BackupFile['summary'] {
  let collected = 0;
  for (const card of Object.values(progress.cards)) {
    if (card.mastery !== 'new') collected += 1;
  }
  return { collected, points: progress.meta.totalPoints, answers: progress.meta.totalAnswers };
}
