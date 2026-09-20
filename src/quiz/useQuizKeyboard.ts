'use client';

import { useEffect } from 'react';

/** Z klávesy udělá index možnosti; vrátí `null` pro cokoli jiného. */
function optionIndex(key: string): number | null {
  if (key < '1' || key > '9') return null;
  return Number(key) - 1;
}

export interface QuizKeyboardOptions {
  /** Možnosti, které jdou vybrat čísly. */
  options: readonly string[];
  /** Zavolá se s vybranou možností. */
  onChoose: (code: string) => void;
  /** Enter / mezera po odpovědi. */
  onNext: (() => void) | null;
  /** Když se zrovna píše, čísla patří do pole, ne do nabídky. */
  enabled: boolean;
}

/**
 * Ovládání kvízu z klávesnice: 1–4 vybírají odpověď, Enter jde dál.
 *
 * Na mobilu se nic z toho nestane, ale na notebooku je psaní na klávesnici
 * rychlejší než míření myší – a body se počítají za rychlost.
 */
export function useQuizKeyboard({ options, onChoose, onNext, enabled }: QuizKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      // V textovém poli má klávesnice svou práci.
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (onNext && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onNext();
        return;
      }

      if (onNext) return;
      const index = optionIndex(event.key);
      if (index === null) return;
      const code = options[index];
      if (code === undefined) return;
      event.preventDefault();
      onChoose(code);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [options, onChoose, onNext, enabled]);
}
