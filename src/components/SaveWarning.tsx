'use client';

import Link from 'next/link';
import { cs } from '@/i18n/cs';
import { ROUTES } from '@/config/routes';
import { useProgress } from '@/store/StoreProvider';

/**
 * Pásek přes celou šířku, když se postup neukládá.
 *
 * Dřív se nepovedený zápis tiše spolkl: dítě hrálo dál, sbírka rostla na
 * obrazovce a po zavření karty byla pryč. Tohle je jediné místo v aplikaci,
 * které si dovolí křičet – proto je to jen při opravdové poruše ukládání,
 * ne při obnově ze zálohy (ta patří do Nastavení).
 */
export function SaveWarning() {
  const { ready, health } = useProgress();
  if (!ready || health.saved) return null;

  return (
    <Link
      href={ROUTES.settings}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-coral px-4 py-2 text-center text-[0.78rem] font-extrabold text-abyss"
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}
    >
      <span>{cs.backup.saveFailed}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}
