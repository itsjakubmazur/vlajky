'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FLAG_SOURCE } from '@/domain/countries';
import { SETS, type SetId } from '~data/sets';
import { cs } from '@/i18n/cs';
import { APP_NAME } from '@/config/app';
import { ROUTES } from '@/config/routes';
import { useProgress } from '@/store/StoreProvider';
import { Button, Eyebrow, Panel } from '@/components/ui';

export function SettingsScreen() {
  const { progress, setActiveSet, reset } = useProgress();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
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
