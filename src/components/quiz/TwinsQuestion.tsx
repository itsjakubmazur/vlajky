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
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((code) => {
        const answered = chosen !== null;
        const isCorrect = code === correctCode;
        const border = !answered
          ? 'border-line bg-surface'
          : isCorrect
            ? 'border-correct bg-correct-soft'
            : code === chosen
              ? 'border-wrong bg-wrong-soft animate-shake'
              : 'border-line bg-surface opacity-50';
        return (
          <button
            key={code}
            type="button"
            disabled={answered}
            onClick={() => onChoose(code)}
            className={`touch-target flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border-2 p-3 transition-colors duration-200 active:scale-[0.99] disabled:cursor-default ${border}`}
          >
            <FlagImage code={code} size="lg" />
            {answered ? (
              <span className={`text-sm font-semibold ${isCorrect ? 'text-correct' : 'text-muted'}`}>
                {requireCountry(code).nameCs}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
