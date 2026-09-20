'use client';

import { useMemo, useRef, useState } from 'react';
import type { Country } from '@/domain/types';
import { suggestCountries } from '@/domain/answer/suggest';
import { cs } from '@/i18n/cs';
import { Button } from '@/components/ui';

export function TypingInput({
  pool,
  disabled,
  hint,
  onSubmit,
  onSkip,
}: {
  pool: readonly Country[];
  disabled: boolean;
  hint: string | null;
  onSubmit: (text: string, viaSuggestion?: boolean) => void;
  onSkip: () => void;
}) {
  const [value, setValue] = useState('');
  const field = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => (disabled ? [] : suggestCountries(value, pool)),
    [value, pool, disabled],
  );

  const send = (text: string, viaSuggestion = false) => {
    if (disabled || !text.trim()) return;
    setValue('');
    onSubmit(text, viaSuggestion);
  };

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(value);
        }}
        className="flex gap-2"
      >
        <input
          ref={field}
          id="odpoved"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="done"
          placeholder={cs.quiz.inputPlaceholder}
          aria-label={cs.quiz.typeCountry}
          onFocus={() => {
            // iOS posune obsah až po vyjetí klávesnice – počkáme si na ni.
            setTimeout(() => field.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
          }}
          className="glass touch-target display min-w-0 flex-1 rounded-pill px-5 text-[1.0625rem] text-ink outline-none placeholder:font-sans placeholder:font-semibold placeholder:text-faint focus:border-mint/60 disabled:opacity-50"
        />
        <Button type="submit" disabled={disabled || value.trim().length === 0} className="px-5">
          {cs.quiz.check}
        </Button>
      </form>

      {hint ? (
        <p className="glass-thin rounded-glass px-4 py-3 text-sm font-bold text-gold">{hint}</p>
      ) : null}

      {suggestions.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion.country.code}>
              <button
                type="button"
                onClick={() => send(suggestion.country.nameCs, true)}
                className="glass touch-target display w-full rounded-pill px-5 text-left text-base transition-colors hover:border-mint/40 hover:text-mint"
              >
                {suggestion.country.nameCs}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!disabled && suggestions.length === 0 ? (
        <Button type="button" variant="ghost" onClick={onSkip} className="self-center">
          {cs.quiz.dontKnow}
        </Button>
      ) : null}
    </div>
  );
}
