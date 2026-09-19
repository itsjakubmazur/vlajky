'use client';

import { requireCountry } from '@/domain/countries';
import { FlagImage } from '@/components/FlagImage';

interface OptionGridProps {
  options: string[];
  /** Ukázat vlajky místo názvů (režim Opačně). */
  asFlags?: boolean;
  correctCode: string;
  /** Co dítě vybralo – teprve pak se barví. */
  chosen: string | null;
  onChoose: (code: string) => void;
}

function stateClasses(code: string, correctCode: string, chosen: string | null): string {
  if (chosen === null) return 'border-line bg-surface hover:border-brand/50';
  if (code === correctCode) return 'border-correct bg-correct-soft text-correct';
  if (code === chosen) return 'border-wrong bg-wrong-soft text-wrong animate-shake';
  return 'border-line bg-surface opacity-50';
}

export function OptionGrid({ options, asFlags, correctCode, chosen, onChoose }: OptionGridProps) {
  return (
    <div className={`grid gap-3 ${asFlags ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {options.map((code) => {
        const country = requireCountry(code);
        return (
          <button
            key={code}
            type="button"
            disabled={chosen !== null}
            onClick={() => onChoose(code)}
            className={`touch-target flex items-center justify-center gap-3 rounded-2xl border-2 p-3 text-left text-lg font-semibold transition-colors duration-200 active:scale-[0.99] disabled:cursor-default ${stateClasses(
              code,
              correctCode,
              chosen,
            )} ${asFlags ? 'min-h-28 flex-col' : ''}`}
          >
            {asFlags ? <FlagImage code={code} size="lg" /> : <span className="w-full">{country.nameCs}</span>}
          </button>
        );
      })}
    </div>
  );
}
