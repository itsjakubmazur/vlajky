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
          className="touch-target min-w-0 flex-1 rounded-2xl border-2 border-line bg-surface px-4 text-lg font-semibold outline-none focus:border-brand disabled:opacity-60"
        />
        <Button type="submit" disabled={disabled || value.trim().length === 0}>
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
                className="touch-target w-full rounded-2xl border border-line bg-surface px-4 text-left text-base font-semibold hover:border-brand/50"
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
