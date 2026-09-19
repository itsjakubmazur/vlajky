'use client';

import { requireCountry } from '@/domain/countries';
import { FlagImage } from '@/components/FlagImage';

/**
 * Dvě zaměnitelné vlajky vedle sebe. Vlajky jsou schválně co největší –
 * celý režim stojí na tom, že se dají porovnat detaily.
 */
export function TwinsQuestion({
  options,
  correctCode,
  chosen,
  onChoose,
}: {
  options: string[];
  correctCode: string;
  chosen: string | null;
  onChoose: (code: string) => void;
}) {
  const answered = chosen !== null;

  return (
    <div className="stagger grid grid-cols-2 gap-3">
      {options.map((code) => {
        const isCorrect = code === correctCode;
        const look = !answered
          ? 'glass hover:border-white/25'
          : isCorrect
            ? 'border-mint/70 bg-mint/15'
            : code === chosen
              ? 'border-coral/70 bg-coral/15 animate-shake'
              : 'glass opacity-35';
        return (
          <button
            key={code}
            type="button"
            disabled={answered}
            onClick={() => onChoose(code)}
            className={`flex flex-col items-center justify-center gap-3 rounded-glass border p-3 transition-[background-color,border-color,opacity] duration-300 active:scale-[0.99] disabled:cursor-default ${look}`}
          >
            <FlagImage code={code} fluid priority pulse={answered && isCorrect} />
            {answered ? (
              <span className={`display text-sm ${isCorrect ? 'text-mint' : 'text-muted'}`}>
                {requireCountry(code).nameCs}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
