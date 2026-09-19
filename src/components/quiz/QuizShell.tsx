'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cs } from '@/i18n/cs';
import { ProgressBar } from '@/components/ui';

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
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link
            href="/"
            className="touch-target -ml-2 inline-flex items-center rounded-xl px-2 text-sm font-semibold text-muted"
          >
            {cs.quiz.quit}
          </Link>
          <div className="flex-1">
            <ProgressBar value={index} total={total} />
          </div>
          <span className="w-12 text-right text-sm font-semibold tabular-nums text-muted">
            {cs.quiz.progress(Math.min(index + 1, total), total)}
          </span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-5">{children}</main>
    </div>
  );
}
