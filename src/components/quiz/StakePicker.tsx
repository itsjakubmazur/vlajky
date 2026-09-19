'use client';

import { cs } from '@/i18n/cs';
import { Eyebrow } from '@/components/ui';

/** Vabank: kolik bodů jde do hry. Vyšší sázka = vyšší zisk i ztráta. */
export function StakePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="glass-thin rounded-glass p-3">
      <Eyebrow>{cs.game.stake}</Eyebrow>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((stake) => (
          <button
            key={stake}
            type="button"
            onClick={() => onChange(stake)}
            className={`touch-target rounded-pill border text-sm font-extrabold transition-colors ${
              value === stake
                ? 'border-gold/70 bg-gold/20 text-gold'
                : 'border-white/10 text-muted hover:text-ink'
            }`}
          >
            {stake}×
          </button>
        ))}
      </div>
      <p className="mt-2 text-[0.75rem] leading-snug text-faint">{cs.game.stakeHint}</p>
    </div>
  );
}
