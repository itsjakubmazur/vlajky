'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ALL_COUNTRIES, FLAG_SOURCE } from '@/domain/countries';
import { countriesInSet, SETS, type SetId } from '~data/sets';
import { UNLOCKS, isUnlocked, type Unlock } from '@/domain/game/unlocks';
import { rankFor } from '@/domain/game/ranks';
import { bossesFor } from '@/domain/game/bosses';
import { cs } from '@/i18n/cs';
import { APP_NAME } from '@/config/app';
import { ROUTES } from '@/config/routes';
import { useProgress } from '@/store/StoreProvider';
import { Button, Eyebrow, Panel } from '@/components/ui';

function requirementText(unlock: Unlock): string {
  if (unlock.golds) return cs.settings.unlockBy.golds(unlock.golds);
  if (unlock.bosses) return cs.settings.unlockBy.bosses(unlock.bosses);
  if (unlock.rank) return cs.settings.unlockBy.rank(cs.game.ranks[unlock.rank] ?? '');
  return '';
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="touch-target flex w-full items-center justify-between rounded-2xl px-1 text-left"
    >
      <span className="font-bold">{label}</span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-pill transition-colors duration-200 ${
          on ? 'bg-mint' : 'bg-white/12'
        }`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-abyss transition-[left] duration-200 ${
            on ? 'left-6' : 'left-1'
          }`}
        />
      </span>
    </button>
  );
}

export function SettingsScreen() {
  const { progress, setActiveSet, setMeta, reset } = useProgress();
  const [confirming, setConfirming] = useState(false);

  const pool = useMemo(
    () => countriesInSet([...ALL_COUNTRIES], progress.meta.activeSet),
    [progress.meta.activeSet],
  );
  const golds = pool.filter((c) => progress.cards[c.code]?.mastery === 'gold').length;
  const state = {
    totalPoints: progress.meta.totalPoints,
    golds,
    bosses: progress.meta.bossesBeaten.length,
  };
  const bossCount = bossesFor(pool).length;

  const frames = UNLOCKS.filter((u) => u.kind === 'frame');
  const themes = UNLOCKS.filter((u) => u.kind === 'theme');

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-8">
      <header className="mb-5 flex items-center gap-4">
        <Link
          href={ROUTES.home}
          className="touch-target -ml-2 inline-flex items-center rounded-pill px-2 text-sm font-extrabold text-muted transition-colors hover:text-ink"
        >
          {cs.common.back}
        </Link>
        <h1 className="display text-3xl">{cs.settings.title}</h1>
      </header>

      <Panel className="mb-3">
        <Eyebrow>{cs.game.rank}</Eyebrow>
        <p className="display mt-1 text-xl">{cs.game.ranks[rankFor(state.totalPoints).id]}</p>
        <p className="mt-1 text-sm tabular-nums text-muted">
          {state.totalPoints} {cs.game.points} · {golds} {cs.home.goldCount} ·{' '}
          {cs.bosses.progress(state.bosses, bossCount)}
        </p>
      </Panel>

      <Panel className="mb-3">
        <Eyebrow>{cs.settings.set}</Eyebrow>
        <div className="mt-3 grid gap-2">
          {(Object.keys(SETS) as SetId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => void setActiveSet(id)}
              className={`touch-target flex flex-col justify-center rounded-2xl border px-4 py-2.5 text-left transition-colors duration-200 ${
                progress.meta.activeSet === id
                  ? 'border-mint/60 bg-mint/10'
                  : 'glass-thin hover:border-white/20'
              }`}
            >
              <span
                className={`display text-base ${
                  progress.meta.activeSet === id ? 'text-mint' : 'text-ink'
                }`}
              >
                {cs.sets[id]}
              </span>
              <span className="text-[0.8rem] text-faint">
                {id === 'world' ? cs.sets.worldDesc : cs.sets.territoriesDesc}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="mb-3">
        <Eyebrow>{cs.settings.look}</Eyebrow>
        <div className="mt-3 flex flex-col gap-4">
          {[
            { list: themes, current: progress.meta.theme, key: 'theme' as const, labels: cs.settings.themes },
            { list: frames, current: progress.meta.frame, key: 'frame' as const, labels: cs.settings.frames },
          ].map(({ list, current, key, labels }) => (
            <div key={key} className="grid grid-cols-2 gap-2">
              {list.map((unlock) => {
                const open = isUnlocked(unlock, state);
                return (
                  <button
                    key={unlock.id}
                    type="button"
                    disabled={!open}
                    onClick={() => void setMeta({ [key]: unlock.id })}
                    className={`touch-target flex flex-col justify-center rounded-2xl border px-3 py-2 text-left transition-colors duration-200 ${
                      current === unlock.id
                        ? 'border-mint/60 bg-mint/10 text-mint'
                        : open
                          ? 'glass-thin text-ink hover:border-white/20'
                          : 'border-white/5 text-faint'
                    }`}
                  >
                    <span className="text-[0.85rem] font-bold leading-tight">
                      {labels[unlock.id]}
                    </span>
                    {open ? null : (
                      <span className="mt-0.5 text-[0.7rem] leading-tight text-faint">
                        {cs.settings.locked} · {requirementText(unlock)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="mb-3">
        <div className="flex flex-col gap-1">
          <Toggle
            label={cs.settings.sound}
            on={progress.meta.soundOn}
            onChange={(value) => void setMeta({ soundOn: value })}
          />
          <Toggle
            label={cs.settings.haptics}
            on={progress.meta.hapticsOn}
            onChange={(value) => void setMeta({ hapticsOn: value })}
          />
        </div>
      </Panel>

      <Panel className="mb-3">
        <Eyebrow>{cs.settings.about}</Eyebrow>
        <ul className="mt-2.5 space-y-1.5 text-[0.85rem] leading-relaxed text-muted">
          <li>{cs.settings.offlineReady}</li>
          <li className="text-faint">{FLAG_SOURCE}</li>
        </ul>
      </Panel>

      <Panel className="border-coral/25">
        {confirming ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-coral">{cs.settings.resetConfirm}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                {cs.common.cancel}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  void reset();
                  setConfirming(false);
                }}
              >
                {cs.settings.resetProgress}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" className="w-full" onClick={() => setConfirming(true)}>
            {cs.settings.resetProgress}
          </Button>
        )}
      </Panel>

      <p className="mt-8 text-center text-xs font-bold text-faint">{APP_NAME}</p>
    </div>
  );
}
