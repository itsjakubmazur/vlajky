'use client';

import { useState } from 'react';
import { cs } from '@/i18n/cs';
import { useSync } from '@/sync/SyncProvider';
import type { SyncError } from '@/sync/supabase';
import { Button, Eyebrow, Panel } from '@/components/ui';

function errorText(error: SyncError): string {
  if (error.kind === 'server') return cs.account.error.server(error.status);
  return cs.account.error[error.kind];
}

function whenText(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Přihlášení a synchronizace.
 *
 * Když není nastavený server, panel se vůbec neukáže – aplikace pak běží
 * jen místně a nikam nesahá. Přihlašuje se e-mailem rodiče: heslo by si
 * osmiletý na tabletu zapamatoval hůř než klepnutí na odkaz v mailu.
 */
export function AccountPanel() {
  const { state, signIn, signOut, syncNow } = useSync();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  if (state.kind === 'off') return null;

  const send = async () => {
    if (!email.includes('@') || sending) return;
    setSending(true);
    try {
      await signIn(email);
    } finally {
      setSending(false);
    }
  };

  return (
    <Panel className="mb-3">
      <Eyebrow>{cs.account.title}</Eyebrow>

      {state.kind === 'signedOut' || state.kind === 'linkSent' ? (
        <>
          <p className="mt-1.5 text-[0.82rem] leading-snug text-muted">{cs.account.desc}</p>
          {state.kind === 'linkSent' ? (
            <p className="mt-3 rounded-2xl border border-mint/30 bg-mint/10 p-3 text-[0.82rem] leading-snug text-mint">
              {cs.account.linkSent(state.email)}
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <label className="text-[0.75rem] font-bold text-faint" htmlFor="sync-email">
                {cs.account.emailLabel}
              </label>
              <input
                id="sync-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                placeholder={cs.account.emailPlaceholder}
                onChange={(event) => setEmail(event.target.value)}
                className="glass-thin touch-target rounded-2xl px-4 text-base"
              />
              <Button onClick={() => void send()} disabled={!email.includes('@') || sending}>
                {cs.account.signIn}
              </Button>
              <p className="text-[0.75rem] leading-snug text-faint">{cs.account.linkHint}</p>
              <p className="text-[0.75rem] leading-snug text-faint">{cs.account.mergeHint}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm font-bold">{cs.account.signedInAs(state.email)}</p>
          <p className="mt-1 text-[0.75rem] font-semibold text-faint">
            {state.kind === 'syncing'
              ? cs.account.syncing
              : state.kind === 'synced'
                ? cs.account.syncedAt(whenText(state.at))
                : ''}
          </p>
          {state.kind === 'failed' ? (
            <p className="mt-2 rounded-2xl border border-coral/30 bg-coral/10 p-3 text-[0.8rem] leading-snug text-coral">
              {errorText(state.error)}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => void syncNow()}>
              {cs.account.syncNow}
            </Button>
            <Button variant="secondary" onClick={() => void signOut()}>
              {cs.account.signOut}
            </Button>
          </div>
          <p className="mt-2 text-[0.75rem] leading-snug text-faint">{cs.account.signOutHint}</p>
        </>
      )}
    </Panel>
  );
}
