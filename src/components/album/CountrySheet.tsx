'use client';

import { requireCountry } from '@/domain/countries';
import type { Mastery } from '@/domain/srs/types';
import { cs } from '@/i18n/cs';
import { FlagImage } from '@/components/FlagImage';
import { MasteryBadge } from '@/components/MasteryBadge';
import { Button, Eyebrow } from '@/components/ui';

export function CountrySheet({
  code,
  mastery,
  inSet,
  onSelect,
  onClose,
}: {
  code: string;
  mastery: Mastery;
  inSet: (code: string) => boolean;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const country = requireCountry(code);
  const similar = country.similar.filter(inSet);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-abyss/70 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="glass-raised animate-rise-in max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-glass p-6 pb-9 sm:rounded-glass"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4">
          <FlagImage code={code} size="xl" />
          <div className="text-center">
            <h2 className="display text-2xl">{country.nameCs}</h2>
            {country.nameCsOfficial ? (
              <p className="mt-1 text-sm text-faint">{country.nameCsOfficial}</p>
            ) : null}
          </div>
          <MasteryBadge mastery={mastery} label={cs.album.mastery[mastery]} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-2.5">
          <div className="glass-thin rounded-2xl p-3.5">
            <dt className="eyebrow">{cs.album.capital}</dt>
            <dd className="display mt-1 text-base">{country.capitalCs}</dd>
          </div>
          <div className="glass-thin rounded-2xl p-3.5">
            <dt className="eyebrow">{cs.album.continent}</dt>
            <dd className="display mt-1 text-base">{cs.continents[country.continent]}</dd>
          </div>
        </dl>

        {country.funFact ? (
          <div className="glass-thin mt-2.5 rounded-2xl p-3.5">
            <Eyebrow>{cs.album.funFactTitle}</Eyebrow>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink/90">{country.funFact}</p>
          </div>
        ) : null}

        {similar.length > 0 ? (
          <div className="mt-5">
            <Eyebrow>{cs.album.similarFlags}</Eyebrow>
            <div className="mt-3 flex flex-wrap gap-2">
              {similar.map((other) => (
                <button
                  key={other}
                  type="button"
                  onClick={() => onSelect(other)}
                  className="glass-thin flex w-[4.75rem] flex-col items-center gap-1.5 rounded-2xl p-2 transition-colors hover:border-white/20"
                >
                  <FlagImage code={other} size="sm" glow={false} />
                  <span className="text-center text-[0.65rem] font-bold leading-tight text-muted">
                    {requireCountry(other).nameCs}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <Button variant="secondary" className="mt-6 w-full" onClick={onClose}>
          {cs.common.close}
        </Button>
      </div>
    </div>
  );
}
