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

function state(code: string, correctCode: string, chosen: string | null) {
  if (chosen === null) return 'glass hover:border-white/25 text-ink';
  if (code === correctCode) return 'border-mint/70 bg-mint/15 text-mint';
  if (code === chosen) return 'border-coral/70 bg-coral/15 text-coral animate-shake';
  return 'glass opacity-35 text-muted';
}

export function OptionGrid({ options, asFlags, correctCode, chosen, onChoose }: OptionGridProps) {
  return (
    <div className={`stagger grid gap-2.5 ${asFlags ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {options.map((code) => {
        const country = requireCountry(code);
        const revealed = chosen !== null && code === correctCode;
        return (
          <button
            key={code}
            type="button"
            disabled={chosen !== null}
            onClick={() => onChoose(code)}
            className={`touch-target relative overflow-hidden rounded-glass border p-3 transition-[background-color,border-color,opacity] duration-300 active:scale-[0.99] disabled:cursor-default ${state(
              code,
              correctCode,
              chosen,
            )} ${asFlags ? 'flex min-h-32 items-center justify-center' : 'flex items-center'}`}
          >
            {/* Přejezd světla po správné odpovědi – jedna krátká odměna. */}
            {revealed ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-white/25 blur-md motion-safe:animate-[sheen_650ms_ease-out_forwards] motion-reduce:hidden"
              />
            ) : null}
            {asFlags ? (
              <FlagImage code={code} fluid priority />
            ) : (
              <span className="display w-full text-left text-[1.15rem] leading-tight">
                {country.nameCs}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
