'use client';

import { cs } from '@/i18n/cs';

/**
 * Numerická klávesnice.
 *
 * Výsledek se **píše, nevybírá**: ze čtyř možností se dá trefit náhodou
 * a osmiletý tester to řekl rovnou – když má na výběr, je to moc lehké.
 * Vlastní klávesnice místo `<input>` je tu schválně: systémová na telefonu
 * vyjede přes půl obrazovky, překryje příklad a při každém příkladu se
 * znovu objevuje a mizí.
 */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function Keypad({
  onDigit,
  onErase,
  onSubmit,
  canSubmit,
  disabled,
}: {
  onDigit: (digit: string) => void;
  onErase: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  disabled: boolean;
}) {
  const key =
    'glass touch-target flex h-full items-center justify-center rounded-2xl text-2xl font-extrabold tabular-nums ' +
    'transition-[transform,border-color,background-color] duration-100 active:scale-[0.96] ' +
    'hover:border-white/25 disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className="grid h-full grid-cols-3 gap-2.5" style={{ gridAutoRows: '1fr' }}>
      {KEYS.map((digit) => (
        <button
          key={digit}
          type="button"
          disabled={disabled}
          aria-label={cs.math.digit(Number(digit))}
          onClick={() => onDigit(digit)}
          className={key}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        aria-label={cs.math.erase}
        onClick={onErase}
        className={key}
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
          <path
            d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7 6-7Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="m12 10 4 4m0-4-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label={cs.math.digit(0)}
        onClick={() => onDigit('0')}
        className={key}
      >
        0
      </button>
      <button
        type="button"
        disabled={disabled || !canSubmit}
        onClick={onSubmit}
        className={
          'touch-target flex h-full items-center justify-center rounded-2xl bg-mint text-lg font-extrabold text-abyss ' +
          'shadow-[0_10px_30px_-12px_var(--color-mint)] transition-transform duration-100 active:scale-[0.96] ' +
          'disabled:pointer-events-none disabled:opacity-30'
        }
      >
        {cs.math.submit}
      </button>
    </div>
  );
}
