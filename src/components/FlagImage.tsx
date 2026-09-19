import { flagUrl, getCountry } from '@/domain/countries';
import { FLAG_HEIGHTS, isRectangular, type FlagSize } from '@/domain/flags';

interface FlagImageProps {
  code: string;
  size?: FlagSize;
  /** Vyplní dostupnou šířku místo pevné výšky (pro velkou vlajku po odpovědi). */
  fluid?: boolean;
  className?: string;
}

/**
 * Vlajka vždy ve skutečném poměru stran.
 *
 * Box má pevnou výšku, obrázek se do něj vejde na šířku – mřížka tak zůstane
 * pravidelná, ale Nepál je pořád praporec a Švýcarsko čtverec.
 */
export function FlagImage({ code, size = 'md', fluid = false, className = '' }: FlagImageProps) {
  const country = getCountry(code);
  const ratio = country ? country.ratio[0] / country.ratio[1] : 1.5;
  const rectangular = isRectangular(code);

  const frame = rectangular
    ? 'rounded-[3px] border border-black/10 shadow-[0_1px_3px_rgba(16,18,43,0.18)]'
    : 'drop-shadow-[0_1px_3px_rgba(16,18,43,0.35)]';

  const style = fluid
    ? { aspectRatio: String(ratio), width: '100%' as const }
    : { height: FLAG_HEIGHTS[size], width: FLAG_HEIGHTS[size] * ratio };

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${fluid ? 'w-full' : ''} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG z veřejné složky, žádná optimalizace není potřeba */}
      <img
        src={flagUrl(code)}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={style}
        className={`max-w-full object-contain ${frame}`}
      />
    </span>
  );
}
