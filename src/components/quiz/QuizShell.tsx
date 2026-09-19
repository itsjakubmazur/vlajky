'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cs } from '@/i18n/cs';

/**
 * Ukazatel postupu je poskládaný z dílků – dítě na první pohled vidí,
 * kolik otázek ještě zbývá. U dlouhých sezení by dílky byly moc drobné,
 * tam se z nich stane obyčejný pruh.
 */
function Steps({ index, total }: { index: number; total: number }) {
  if (total > 20) {
    const pct = total > 0 ? Math.min(100, (index / total) * 100) : 0;
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/10">
        <div
          className="h-full rounded-pill bg-gradient-to-r from-mint-deep to-mint transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-pill transition-colors duration-300 ${
            i < index ? 'bg-mint' : i === index ? 'bg-mint/45' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Obrazovka kvízu má pevnou výšku a roluje se jen obsah pod hlavičkou.
 *
 * Dřív byla hlavička `sticky` nad rolující se stránkou – na iPhonu se přes ni
 * po pár pixelech posunu schoval nadpis otázky. Takhle se hlavička hýbat
 * nemůže. Výška je v `svh` (nejmenší viewport), aby se rozvržení nepřepočítalo,
 * když vyjede klávesnice.
 */
export function QuizShell({
  index,
  total,
  children,
}: {
  index: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <div
      className="flex h-[100svh] flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <header className="shrink-0 px-4 py-3">
        <div className="glass mx-auto flex max-w-xl items-center gap-4 rounded-pill py-2 pl-2 pr-4">
          <Link
            href="/"
            className="touch-target inline-flex items-center rounded-pill px-4 text-sm font-extrabold text-muted transition-colors hover:text-ink"
          >
            {cs.quiz.quit}
          </Link>
          <div className="flex-1">
            <Steps index={index} total={total} />
          </div>
          <span className="text-sm font-extrabold tabular-nums text-faint">
            {cs.quiz.progress(Math.min(index + 1, total), total)}
          </span>
        </div>
      </header>
      {/*
        `main` je sám sloupcový flex – teprve tak se obsah uvnitř roztáhne do
        výšky, a když je delší, kontejner se odroluje. Procentní výška by
        v rolovacím kontejneru nefungovala.
      */}
      <main
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}
