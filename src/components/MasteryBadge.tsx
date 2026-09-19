import type { Mastery } from '@/domain/srs/types';

const DOT: Record<Mastery, string> = {
  new: 'bg-new',
  bronze: 'bg-bronze',
  silver: 'bg-silver',
  gold: 'bg-gold',
};

const TEXT: Record<Mastery, string> = {
  new: 'text-faint',
  bronze: 'text-bronze',
  silver: 'text-silver',
  gold: 'text-gold',
};

export function MasteryDot({ mastery, className = '' }: { mastery: Mastery; className?: string }) {
  return (
    <span
      className={`block size-2.5 rounded-full ${DOT[mastery]} ${
        mastery === 'gold' ? 'shadow-[0_0_10px_var(--color-gold)]' : ''
      } ${className}`}
    />
  );
}

export function MasteryBadge({ mastery, label }: { mastery: Mastery; label: string }) {
  return (
    <span
      className={`glass-thin inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-extrabold ${TEXT[mastery]}`}
    >
      <MasteryDot mastery={mastery} />
      {label}
    </span>
  );
}
