'use client';

import { useRef, useState } from 'react';
import { cs } from '@/i18n/cs';
import { useProgress } from '@/store/StoreProvider';
import { backupFileName, decodeBackup, encodeBackup, type BackupFile } from '@/store/backup';
import { Button, Eyebrow, Panel } from '@/components/ui';

/** Datum a čas pro člověka. Jen tady – jinde se čas neukazuje. */
function whenText(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Záloha postupu do souboru a zpět.
 *
 * Proč zrovna soubor: postup žije v prohlížeči, a ten se dá vymazat
 * jedním klepnutím v nastavení tabletu. Soubor je jediná záloha, která
 * funguje bez serveru i bez internetu – a zároveň nejjednodušší způsob,
 * jak postup přenést na druhé zařízení.
 */
export function BackupPanel() {
  const { progress, health, restore } = useProgress();
  const fileInput = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState<BackupFile | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const save = () => {
    const blob = new Blob([encodeBackup(progress)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFileName();
    link.click();
    URL.revokeObjectURL(url);
  };

  const pick = async (file: File | undefined) => {
    setProblem(null);
    setDone(false);
    setLoaded(null);
    if (!file) return;
    const read = decodeBackup(await file.text());
    if (!read.ok) {
      setProblem(cs.backup.problem[read.problem] ?? cs.backup.problem.notOurs ?? '');
      return;
    }
    // Nahrání je nevratné, takže se nejdřív ukáže, co v souboru je.
    setLoaded(read.file);
  };

  const apply = async (mode: 'merge' | 'replace') => {
    if (!loaded) return;
    await restore(loaded.progress, mode);
    setLoaded(null);
    setDone(true);
  };

  return (
    <Panel className="mb-3">
      <Eyebrow>{cs.backup.title}</Eyebrow>
      <p className="mt-1.5 text-[0.82rem] leading-snug text-muted">{cs.backup.desc}</p>

      {health.saved ? null : (
        <div className="mt-3 rounded-2xl border border-coral/35 bg-coral/10 p-3">
          <p className="text-sm font-extrabold text-coral">{cs.backup.saveFailed}</p>
          <p className="mt-1 text-[0.78rem] leading-snug text-muted">{cs.backup.saveFailedWhy}</p>
        </div>
      )}
      {health.recovered ? (
        <p className="mt-3 rounded-2xl border border-gold/30 bg-gold/10 p-3 text-[0.78rem] leading-snug text-gold">
          {cs.backup.recovered}
        </p>
      ) : null}

      <p className="mt-3 text-[0.75rem] font-semibold text-faint">
        {health.lastSavedAt ? cs.backup.savedAt(whenText(health.lastSavedAt)) : cs.backup.savedNever}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={save}>
          {cs.backup.save}
        </Button>
        <Button variant="secondary" onClick={() => fileInput.current?.click()}>
          {cs.backup.load}
        </Button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          void pick(event.target.files?.[0]);
          // Aby se dal nahrát týž soubor podruhé po opravě.
          event.target.value = '';
        }}
      />

      {done ? <p className="mt-3 text-sm font-bold text-mint">{cs.backup.done}</p> : null}
      {problem ? <p className="mt-3 text-sm font-bold text-coral">{problem}</p> : null}

      {loaded ? (
        <div className="mt-3 rounded-2xl border border-white/12 p-3">
          <p className="text-sm font-extrabold">{cs.backup.loadedTitle}</p>
          <p className="mt-0.5 text-[0.8rem] text-muted">
            {cs.backup.loadedSummary(loaded.summary.collected, loaded.summary.points)}
            {loaded.at ? ` · ${cs.backup.loadedAt(whenText(loaded.at))}` : ''}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button onClick={() => void apply('merge')}>{cs.backup.merge}</Button>
            <p className="text-[0.75rem] leading-snug text-faint">{cs.backup.mergeHint}</p>
            <Button variant="danger" onClick={() => void apply('replace')}>
              {cs.backup.replace}
            </Button>
            <p className="text-[0.75rem] leading-snug text-faint">{cs.backup.replaceHint}</p>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
