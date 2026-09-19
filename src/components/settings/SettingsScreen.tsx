'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FLAG_SOURCE } from '@/domain/countries';
import { SETS, type SetId } from '~data/sets';
import { cs } from '@/i18n/cs';
import { APP_NAME } from '@/config/app';
import { ROUTES } from '@/config/routes';
import { useProgress } from '@/store/StoreProvider';
import { Button, Card } from '@/components/ui';

export function SettingsScreen() {
  const { progress, setActiveSet, reset } = useProgress();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <Link
          href={ROUTES.home}
          className="touch-target -ml-2 inline-flex items-center px-2 text-sm font-semibold text-muted"
        >
          {cs.common.back}
        </Link>
        <h1 className="text-2xl font-extrabold">{cs.settings.title}</h1>
      </header>

      <Card className="mb-4">
        <h2 className="mb-3 font-bold">{cs.settings.set}</h2>
        <div className="grid gap-2">
          {(Object.keys(SETS) as SetId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => void setActiveSet(id)}
              className={`touch-target flex flex-col justify-center rounded-2xl border-2 px-4 py-2 text-left ${
                progress.meta.activeSet === id
                  ? 'border-brand bg-brand-soft'
                  : 'border-line bg-surface'
              }`}
            >
              <span className="font-bold">{cs.sets[id]}</span>
              <span className="text-sm text-muted">
                {id === 'world' ? cs.sets.worldDesc : cs.sets.territoriesDesc}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 font-bold">{cs.settings.about}</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted">
          <li>{cs.settings.offlineReady}</li>
          <li>{FLAG_SOURCE}</li>
        </ul>
      </Card>

      <Card className="border-wrong/20">
        {confirming ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-wrong">{cs.settings.resetConfirm}</p>
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
      </Card>

      <p className="mt-6 text-center text-xs text-muted">{APP_NAME}</p>
    </div>
  );
}
