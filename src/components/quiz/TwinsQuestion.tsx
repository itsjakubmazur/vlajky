'use client';

import { requireCountry } from '@/domain/countries';
import { FlagImage } from '@/components/FlagImage';

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
    <div className="grid h-full grid-cols-2 gap-3 pb-2">
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
            className={`touch-target flex h-full min-h-44 flex-col items-center justify-center gap-4 rounded-glass border p-3 transition-[background-color,border-color,opacity] duration-300 active:scale-[0.99] disabled:cursor-default ${look}`}
          >
            <FlagImage code={code} size="lg" pulse={answered && isCorrect} />
            {answered ? (
              <span
                className={`display text-sm ${isCorrect ? 'text-mint' : 'text-muted'}`}
              >
                {requireCountry(code).nameCs}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
