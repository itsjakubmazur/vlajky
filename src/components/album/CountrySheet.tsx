'use client';

import { requireCountry } from '@/domain/countries';
import type { Mastery } from '@/domain/srs/types';
import { cs } from '@/i18n/cs';
import { FlagImage } from '@/components/FlagImage';
import { MasteryBadge } from '@/components/MasteryBadge';
import { Button } from '@/components/ui';

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
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="animate-rise max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 pb-8 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3">
          <FlagImage code={code} size="xl" />
          <h2 className="text-center text-2xl font-extrabold">{country.nameCs}</h2>
          {country.nameCsOfficial ? (
            <p className="-mt-2 text-center text-sm text-muted">{country.nameCsOfficial}</p>
          ) : null}
          <MasteryBadge mastery={mastery} label={cs.album.mastery[mastery]} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-bg p-3">
            <dt className="text-muted">{cs.album.capital}</dt>
            <dd className="font-bold">{country.capitalCs}</dd>
          </div>
          <div className="rounded-2xl bg-bg p-3">
            <dt className="text-muted">{cs.album.continent}</dt>
            <dd className="font-bold">{cs.continents[country.continent]}</dd>
          </div>
        </dl>

        {country.funFact ? (
          <p className="mt-3 rounded-2xl bg-brand-soft p-3 text-base leading-snug">
            <span className="font-bold">{cs.album.funFactTitle} </span>
            {country.funFact}
          </p>
        ) : null}

        {similar.length > 0 ? (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-bold text-muted">{cs.album.similarFlags}</h3>
            <div className="flex flex-wrap gap-3">
              {similar.map((other) => (
                <button
                  key={other}
                  type="button"
                  onClick={() => onSelect(other)}
                  className="flex flex-col items-center gap-1 rounded-xl p-1 hover:bg-bg"
                >
                  <FlagImage code={other} size="sm" />
                  <span className="text-xs font-semibold">{requireCountry(other).nameCs}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <Button variant="secondary" className="mt-5 w-full" onClick={onClose}>
          {cs.common.close}
        </Button>
      </div>
    </div>
  );
}
