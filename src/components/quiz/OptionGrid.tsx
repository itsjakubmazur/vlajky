'use client';

import { requireCountry } from '@/domain/countries';
import { FlagImage } from '@/components/FlagImage';

interface OptionGridProps {
  options: string[];
  /** Ukázat vlajky místo názvů (režim Opačně). */
  asFlags?: boolean;
  /** Co je na tlačítku napsané – název země, nebo hlavní město. */
  label?: 'name' | 'capital';
  correctCode: string;
  /** Co dítě vybralo – teprve pak se barví. */
  chosen: string | null;
  onChoose: (code: string) => void;
}

/**
 * Číslo klávesové zkratky. Ukáže se jen tam, kde je opravdová klávesnice
 * (`pointer: fine`) – na mobilu by to byl jen další prvek navíc.
 */
function KeyHint({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute left-2 top-2 hidden h-5 w-5 items-center justify-center rounded-md bg-white/10 text-[0.65rem] font-extrabold tabular-nums text-faint [@media(pointer:fine)]:flex"
    >
      {index + 1}
    </span>
  );
}

function state(code: string, correctCode: string, chosen: string | null) {
  if (chosen === null) return 'glass hover:border-white/25 text-ink';
  if (code === correctCode) return 'border-mint/70 bg-mint/15 text-mint';
  if (code === chosen) return 'border-coral/70 bg-coral/15 text-coral animate-shake';
  return 'glass opacity-35 text-muted';
}

/**
 * Nabídka je vždy 2×2.
 *
 * Medián českého názvu má 8 znaků a 90 % se vejde do 16, takže sloupec pod
 * sebou jen plýtval šířkou. Mřížka navíc zkracuje oční dráhu, což se
 * s bodováním za rychlost počítá. Řádky mají stejnou výšku, takže
 * „Demokratická republika Kongo“ nerozhodí sousedy.
 */
export function OptionGrid({
  options,
  asFlags,
  label = 'name',
  correctCode,
  chosen,
  onChoose,
}: OptionGridProps) {
  return (
    <div className="stagger grid grid-cols-2 gap-2.5">
      {options.map((code, index) => {
        const country = requireCountry(code);
        const revealed = chosen !== null && code === correctCode;
        return (
          <button
            key={code}
            type="button"
            disabled={chosen !== null}
            onClick={() => onChoose(code)}
            className={`touch-target relative flex min-h-20 items-center justify-center overflow-hidden rounded-glass border p-3 transition-[background-color,border-color,opacity] duration-300 active:scale-[0.99] disabled:cursor-default ${state(
              code,
              correctCode,
              chosen,
            )}`}
          >
            {chosen === null ? <KeyHint index={index} /> : null}
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
              <span className="display text-center text-[0.95rem] leading-tight text-balance">
                {label === 'capital' ? country.capitalCs : country.nameCs}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
