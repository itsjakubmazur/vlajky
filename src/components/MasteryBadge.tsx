import type { Mastery } from '@/domain/srs/types';

const STYLES: Record<Mastery, string> = {
  new: 'bg-new/25 text-muted',
  bronze: 'bg-bronze/20 text-bronze',
  silver: 'bg-silver/20 text-silver',
  gold: 'bg-gold/20 text-gold',
};

const DOTS: Record<Mastery, string> = {
  new: 'bg-new',
  bronze: 'bg-bronze',
  silver: 'bg-silver',
  gold: 'bg-gold',
};

export function MasteryDot({ mastery, className = '' }: { mastery: Mastery; className?: string }) {
  return <span className={`block size-2.5 rounded-full ${DOTS[mastery]} ${className}`} />;
}

export function MasteryBadge({ mastery, label }: { mastery: Mastery; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[mastery]}`}
    >
      <MasteryDot mastery={mastery} />
      {label}
    </span>
  );
}
