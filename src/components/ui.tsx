import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark active:bg-brand-dark',
  secondary: 'bg-surface text-ink border border-line hover:border-brand/40',
  ghost: 'bg-transparent text-muted hover:text-ink',
  danger: 'bg-wrong-soft text-wrong border border-wrong/25',
};

const BASE =
  'inline-flex touch-target items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold ' +
  'transition-[transform,background-color,border-color] duration-150 active:scale-[0.98] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} className={`${BASE} ${VARIANTS[variant]} ${className}`} />;
}

export function ButtonLink({
  href,
  variant = 'primary',
  className = '',
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-xl2 border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(16,18,43,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line" role="presentation">
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
