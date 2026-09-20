'use client';

import { useMemo } from 'react';
import { requireCountry } from '@/domain/countries';
import { cs } from '@/i18n/cs';
import { worldGeometry } from '@/components/map/geometry';

/** Poloměr špendlíku v soustavě mapy. */
const PIN_R = 15;
/** Neviditelná plocha pro prst – špendlík sám by byl na dotyk malý. */
const PIN_HIT_R = 30;

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
}: {
  options: string[];
  correctCode: string;
  chosen: string | null;
  onChoose: (code: string) => void;
}) {
  const { shapes, viewBox, project } = useMemo(worldGeometry, []);

  const pins = useMemo(
    () =>
      options.flatMap((code) => {
        const country = requireCountry(code);
        const point = project(country.lng, country.lat);
        return point ? [{ code, x: point[0], y: point[1], name: country.nameCs }] : [];
      }),
    [options, project],
  );

  return (
    <div className="glass-thin rounded-glass p-2">
      <svg viewBox={viewBox} className="h-auto w-full" role="group" aria-label={cs.album.map}>
        <g>
          {shapes.map((shape) => (
            <path
              key={shape.id}
              d={shape.d}
              fill="rgb(255 255 255 / 0.08)"
              stroke="rgb(6 10 20 / 0.85)"
              strokeWidth={0.4}
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
                onClick={chosen === null ? () => onChoose(pin.code) : undefined}
                className={chosen === null ? 'cursor-pointer' : undefined}
                role={chosen === null ? 'button' : undefined}
                aria-label={revealed ? pin.name : undefined}
              >
                <circle cx={pin.x} cy={pin.y} r={PIN_HIT_R} fill="transparent" />
                <circle
                  cx={pin.x}
                  cy={pin.y}
                  r={PIN_R}
                  fill={fill}
                  stroke="rgb(6 10 20 / 0.7)"
                  strokeWidth={1.5}
                  className="transition-[fill] duration-300"
                />
                {revealed ? (
                  <text
                    x={pin.x}
                    y={pin.y + PIN_R + 14}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={800}
                    fill={pin.code === correctCode ? 'var(--color-mint)' : 'var(--color-muted)'}
                  >
                    {pin.name}
                  </text>
                ) : (
                  <circle cx={pin.x} cy={pin.y} r={PIN_R / 2.6} fill={text} opacity={0.45} />
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
