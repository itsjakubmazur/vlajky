'use client';

import { cs } from '@/i18n/cs';
import './globals.css';

/**
 * Poslední záchrana: chyba v kořenovém rozvržení, kde ještě neběží ani
 * poskytovatel postupu. Proto žádné sdílené komponenty a vlastní `<html>`.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="cs">
      <body className="min-h-dvh antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-4 px-4 py-6">
          <h1 className="display text-2xl">{cs.errors.title}</h1>
          <p className="text-sm leading-snug text-muted">{cs.errors.desc}</p>
          <button
            type="button"
            onClick={reset}
            className="touch-target rounded-pill bg-mint px-6 font-extrabold text-abyss"
          >
            {cs.errors.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
