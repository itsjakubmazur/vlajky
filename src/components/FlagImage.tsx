import { flagUrl, getCountry } from '@/domain/countries';
import { FLAG_HEIGHTS, isRectangular, type FlagSize } from '@/domain/flags';

interface FlagImageProps {
  code: string;
  size?: FlagSize;
  /** Vyplní dostupnou šířku místo pevné výšky. */
  fluid?: boolean;
  /** Podsvícení barvou vlajky. U velkých vlajek zapnuté, u drobných ne. */
  glow?: boolean;
  /** Vyšisovaná „nezískaná samolepka“ v albu. */
  muted?: boolean;
  pulse?: boolean;
  /** Vlajka v otázce se načítá hned, zbytek až když je vidět. */
  priority?: boolean;
  className?: string;
}

/**
 * Vlajka vždy ve skutečném poměru stran.
 *
 * Na tmavém podkladu dostane obdélníková vlajka světlý vlas, aby se bílé
 * vlajky (Japonsko) neztratily. Nepál je praporec, ten rámeček nedostane –
 * místo toho stín podle obrysu. Halo má barvu odvozenou z vlajky samotné.
 */
export function FlagImage({
  code,
  size = 'md',
  fluid = false,
  glow,
  muted = false,
  pulse = false,
  priority = false,
  className = '',
}: FlagImageProps) {
  const country = getCountry(code);
  const ratio = country ? country.ratio[0] / country.ratio[1] : 1.5;
  const rectangular = isRectangular(code);
  const accent = country?.accent ?? '#19e3b1';
  const showGlow = (glow ?? (size === 'lg' || size === 'xl')) && !muted;

  const frame = rectangular
    ? 'rounded-[4px] ring-1 ring-white/25 shadow-[0_10px_26px_-12px_rgb(0_0_0/0.9)]'
    : 'drop-shadow-[0_6px_14px_rgb(0_0_0/0.75)]';

  const style = fluid
    ? { aspectRatio: String(ratio), width: '100%' as const }
    : { height: FLAG_HEIGHTS[size], width: FLAG_HEIGHTS[size] * ratio };

  return (
    <span
      className={`relative isolate inline-flex shrink-0 items-center justify-center ${fluid ? 'w-full' : ''} ${className}`}
    >
      {showGlow ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl ${
            size === 'xl' ? 'scale-[1.7] opacity-85' : 'scale-[1.45] opacity-60'
          } ${pulse ? 'animate-halo' : ''}`}
          style={{ background: `radial-gradient(60% 60% at 50% 50%, ${accent}, transparent 72%)` }}
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- lokální SVG, optimalizovat není co */}
      <img
        src={flagUrl(code)}
        alt=""
        aria-hidden="true"
        draggable={false}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        style={style}
        className={`max-w-full object-contain ${frame} ${muted ? 'opacity-30 grayscale' : ''}`}
      />
    </span>
  );
}
