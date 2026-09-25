'use client';

import { useMemo, useRef } from 'react';
import { requireCountry } from '@/domain/countries';
import { cs } from '@/i18n/cs';
import { rotationFor, worldGeometry } from '@/components/map/geometry';

/**
 * Poloměr špendlíku na světové mapě; ve výřezu se úměrně zmenší, takže na
 * obrazovce zůstává stejný. Na telefonu z toho vyjde kolem 16 px v průměru.
 */
const PIN_R = 21;
/**
 * Jak daleko od špendlíku ještě klepnutí platí, v obrazovkových bodech.
 *
 * Sám špendlík má na mapě kolem 23 px, což je na prst málo. Nerozhoduje
 * se proto zásahem do kolečka, ale vzdáleností k nejbližšímu špendlíku –
 * stejně jako v režimu Roztřiď.
 */
const TAP_REACH = 44;
/** Velikost popisku pod špendlíkem; taky se přepočítává na stálou velikost. */
const LABEL_SIZE = 28;

function color(code: string, correctCode: string, chosen: string | null) {
  if (chosen === null) return { fill: 'var(--color-mint)', text: 'var(--color-abyss)' };
  if (code === correctCode) return { fill: 'var(--color-mint)', text: 'var(--color-abyss)' };
  if (code === chosen) return { fill: 'var(--color-coral)', text: 'var(--color-abyss)' };
  return { fill: 'rgb(255 255 255 / 0.25)', text: 'var(--color-abyss)' };
}

/**
 * Otázka na mapě.
 *
 * Klepat přímo do obrysů zemí by na telefonu nešlo – Lucembursko má na
 * světové mapě pár pixelů. Proto se nabídnou čtyři špendlíky, mezi kterými
 * je dost místa (`MIN_SEPARATION`), a rozhoduje se mezi nimi.
 */
export function MapQuestion({
  options,
  correctCode,
  chosen,
  onChoose,
  frameCodes,
}: {
  options: string[];
  correctCode: string;
  chosen: string | null;
  onChoose: (code: string) => void;
  /**
   * Země, na které se má mapa oříznout – to, co se zrovna hraje.
   *
   * Schválně celá vybraná část světa, ne jen ty čtyři nabídnuté: výřez
   * podle nabídky by se měnil s každou otázkou a prozrazoval by, kde
   * zhruba odpověď leží.
   */
  frameCodes: readonly string[];
}) {
  // Oceánie leží po obou stranách 180. poledníku, takže se pro ni projekce
  // pootočí. Ostatním částem světa vyjde nula a mapa zůstává beze změny.
  const rotation = useMemo(() => rotationFor(frameCodes), [frameCodes]);
  const { shapes, project, frameFor } = useMemo(() => worldGeometry(rotation), [rotation]);
  const frame = useMemo(() => frameFor(frameCodes), [frameFor, frameCodes]);

  // Špendlík má zůstat na obrazovce stejně velký, ať se kouká na svět
  // nebo na Evropu – s menším plátnem se proto musí zmenšit i on.
  const pinR = PIN_R * frame.scale;
  const labelSize = LABEL_SIZE * frame.scale;

  const mapBox = useRef<HTMLDivElement>(null);
  const pinRefs = useRef(new Map<string, SVGCircleElement>());

  const pins = useMemo(
    () =>
      options.flatMap((code) => {
        const country = requireCountry(code);
        const point = project(country.lng, country.lat);
        return point ? [{ code, x: point[0], y: point[1], name: country.nameCs }] : [];
      }),
    [options, project],
  );

  /** Nejbližší špendlík k místu klepnutí, když je dost blízko. */
  const pick = (x: number, y: number) => {
    if (chosen !== null) return;
    const map = mapBox.current?.getBoundingClientRect();
    if (!map) return;

    let best: string | null = null;
    let bestDistance = Infinity;
    for (const [code, element] of pinRefs.current) {
      const rect = element.getBoundingClientRect();
      const distance = Math.hypot(
        x - (rect.left + rect.width / 2),
        y - (rect.top + rect.height / 2),
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        best = code;
      }
    }

    const reach = Math.max(TAP_REACH, map.width * 0.12);
    if (best && bestDistance <= reach) onChoose(best);
  };

  return (
    <div
      ref={mapBox}
      className="glass-thin rounded-glass p-2"
      onPointerUp={(event) => pick(event.clientX, event.clientY)}
    >
      {/*
        Strop výšky: u čtvercových výřezů (Jižní Amerika) by mapa na telefonu
        přetekla pod okraj obrazovky a musela by se k ní rolovat. `meet`
        ji v takovém případě zmenší a vycentruje, místo aby ji ořízl.
      */}
      <svg
        viewBox={frame.viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto max-h-[34svh] w-full"
        role="group"
        aria-label={cs.album.map}
      >
        <g>
          {shapes.map((shape) => (
            <path
              key={shape.id}
              d={shape.d}
              fill="rgb(255 255 255 / 0.08)"
              stroke="rgb(6 10 20 / 0.85)"
              strokeWidth={0.4 * frame.scale}
            />
          ))}
        </g>
        <g>
          {pins.map((pin) => {
            const { fill, text } = color(pin.code, correctCode, chosen);
            const revealed = chosen !== null;
            return (
              <g
                key={pin.code}
                className={chosen === null ? 'cursor-pointer' : undefined}
                aria-label={revealed ? pin.name : undefined}
              >
                <circle
                  ref={(element) => {
                    if (element) pinRefs.current.set(pin.code, element);
                    else pinRefs.current.delete(pin.code);
                  }}
                  cx={pin.x}
                  cy={pin.y}
                  r={pinR}
                  fill={fill}
                  stroke="rgb(6 10 20 / 0.7)"
                  strokeWidth={1.5 * frame.scale}
                  className="transition-[fill] duration-300"
                />
                {revealed ? (
                  <text
                    x={pin.x}
                    y={pin.y + pinR + labelSize}
                    textAnchor="middle"
                    fontSize={labelSize}
                    fontWeight={800}
                    fill={pin.code === correctCode ? 'var(--color-mint)' : 'var(--color-muted)'}
                  >
                    {pin.name}
                  </text>
                ) : (
                  <circle cx={pin.x} cy={pin.y} r={pinR / 2.6} fill={text} opacity={0.45} />
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
