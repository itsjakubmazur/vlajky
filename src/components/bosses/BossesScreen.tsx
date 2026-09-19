'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ALL_COUNTRIES, requireCountry } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { bossName, bossesFor } from '@/domain/game/bosses';
import { cs } from '@/i18n/cs';
import { ROUTES } from '@/config/routes';
import { useProgress } from '@/store/StoreProvider';
import { FlagImage } from '@/components/FlagImage';
import { Panel, ProgressBar } from '@/components/ui';
import { QuizScreen } from '@/components/quiz/QuizScreen';

/**
 * Souboje se zrádnými dvojicemi.
 *
 * Duel se hraje rovnou tady – je to pět otázek, kvůli tomu nemá smysl
 * zavádět vlastní adresu.
 */
export function BossesScreen() {
  const { progress } = useProgress();
  const [active, setActive] = useState<string | null>(null);

  const pool = useMemo(
    () => countriesInSet([...ALL_COUNTRIES], progress.meta.activeSet),
    [progress.meta.activeSet],
  );
  const bosses = useMemo(() => bossesFor(pool), [pool]);
  const beaten = new Set(progress.meta.bossesBeaten);

  if (active) return <QuizScreen mode="boss" bossId={active} />;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-8">
      <header className="mb-5 flex items-center gap-4">
        <Link
          href={ROUTES.home}
          className="touch-target -ml-2 inline-flex items-center rounded-pill px-2 text-sm font-extrabold text-muted transition-colors hover:text-ink"
        >
          {cs.common.back}
        </Link>
        <h1 className="display text-3xl">{cs.bosses.title}</h1>
      </header>

      <Panel className="mb-4">
        <p className="display text-lg tabular-nums">
          {cs.bosses.progress(beaten.size, bosses.length)}
        </p>
        <div className="mt-2.5">
          <ProgressBar value={beaten.size} total={bosses.length} />
        </div>
        <p className="mt-3 text-[0.8rem] leading-snug text-faint">{cs.bosses.desc}</p>
      </Panel>

      <ul className="tiles flex flex-col gap-2.5">
        {bosses.map((boss) => {
          const won = beaten.has(boss.id);
          return (
            <li key={boss.id}>
              <button
                type="button"
                onClick={() => setActive(boss.id)}
                className={`touch-target flex w-full items-center gap-4 rounded-glass border px-4 py-3 text-left transition-[border-color,transform] duration-200 active:scale-[0.99] ${
                  won ? 'border-gold/40 bg-gold/10' : 'glass hover:border-white/25'
                }`}
              >
                <span className="flex shrink-0 items-center">
                  {boss.codes.slice(0, 3).map((code, i) => (
                    <span
                      key={code}
                      className="block"
                      style={{
                        marginLeft: i === 0 ? 0 : -14,
                        transform: `rotate(${(i - 1) * 5}deg)`,
                      }}
                    >
                      <FlagImage code={code} size="xs" glow={false} />
                    </span>
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="display block text-[0.95rem] leading-tight">
                    {bossName(boss, (code) => requireCountry(code).nameCs)}
                  </span>
                  {won ? (
                    <span className="mt-0.5 block text-[0.72rem] font-extrabold text-gold">
                      {cs.bosses.beaten}
                    </span>
                  ) : null}
                </span>
                {won ? null : (
                  <span className="shrink-0 text-xs font-extrabold text-mint">{cs.bosses.open}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
