import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  // Jediná plná barva v rozhraní kromě vlajek – proto je jasné, kam sáhnout.
  primary:
    'bg-mint text-abyss shadow-[0_10px_30px_-12px_var(--color-mint)] hover:bg-[color-mix(in_oklab,var(--color-mint),white_12%)]',
  secondary: 'glass text-ink hover:border-white/20',
  ghost: 'text-muted hover:text-ink',
  danger: 'glass text-coral border-coral/30 hover:border-coral/50',
};

const BASE =
  'inline-flex touch-target items-center justify-center gap-2 rounded-pill px-6 text-[0.95rem] font-extrabold ' +
  'transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.98] ' +
  'disabled:pointer-events-none disabled:opacity-40';

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

export function Panel({
  raised = false,
  className = '',
  children,
}: {
  raised?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${raised ? 'glass-raised' : 'glass'} rounded-glass p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/10">
      <div
        className="h-full rounded-pill bg-gradient-to-r from-mint-deep to-mint transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Kruhový ukazatel postupu – nese hlavní číslo na domovské obrazovce. */
export function ProgressRing({
  value,
  total,
  size = 92,
  children,
}: {
  value: number;
  total: number;
  size?: number;
  children: ReactNode;
}) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(1, value / total) : 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(255 255 255 / 0.1)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-mint)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
