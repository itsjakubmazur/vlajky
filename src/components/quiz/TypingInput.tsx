'use client';

import { useMemo, useState } from 'react';
import type { Country } from '@/domain/types';
import { suggestCountries } from '@/domain/answer/suggest';
import { cs } from '@/i18n/cs';
import { Button } from '@/components/ui';

export function TypingInput({
  pool,
  disabled,
  onSubmit,
  onSkip,
}: {
  pool: readonly Country[];
  disabled: boolean;
  onSubmit: (text: string) => void;
  onSkip: () => void;
}) {
  const [value, setValue] = useState('');

  const suggestions = useMemo(
    () => (disabled ? [] : suggestCountries(value, pool)),
    [value, pool, disabled],
  );

  const send = (text: string) => {
    if (disabled || !text.trim()) return;
    setValue('');
    onSubmit(text);
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
          className="glass touch-target display min-w-0 flex-1 rounded-pill px-5 text-lg text-ink outline-none placeholder:font-sans placeholder:font-semibold placeholder:text-faint focus:border-mint/60 disabled:opacity-50"
        />
        <Button type="submit" disabled={disabled || value.trim().length === 0} className="px-5">
          {cs.quiz.check}
        </Button>
      </form>

      {suggestions.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion.country.code}>
              <button
                type="button"
                onClick={() => send(suggestion.country.nameCs)}
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
