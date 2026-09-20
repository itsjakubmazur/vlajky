'use client';

import { useEffect } from 'react';
import { cs } from '@/i18n/cs';
import { ROUTES } from '@/config/routes';
import { Button, ButtonLink, Panel } from '@/components/ui';

/**
 * Náhradní obrazovka po chybě.
 *
 * Dítě nemá číst stack trace, a hlavně se musí dozvědět to podstatné:
 * o nasbírané vlajky nepřišlo. Postup je v localStorage, ne v rozbitém
 * překreslení.
 */
export default function ErrorScreen({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Bez analytiky a bez odesílání kamkoli – zůstává to v konzoli.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[var(--safe-height)] w-full max-w-xl flex-col justify-center px-4 py-6">
      <Panel raised className="flex flex-col gap-4">
        <div>
          <h1 className="display text-2xl">{cs.errors.title}</h1>
          <p className="mt-2 text-sm leading-snug text-muted">{cs.errors.desc}</p>
        </div>
        <Button onClick={reset}>{cs.errors.retry}</Button>
        <ButtonLink href={ROUTES.home} variant="secondary">
          {cs.common.home}
        </ButtonLink>
      </Panel>
    </div>
  );
}
