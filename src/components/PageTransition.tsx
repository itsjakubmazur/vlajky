'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Přechod mezi obrazovkami. Klíč podle adresy znovu spustí animaci nástupu,
 * takže se obsah nepřeblikne, ale plynule najede.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  );
}
