'use client';

import { useMemo } from 'react';
import { requireCountry } from '@/domain/countries';
import { cs } from '@/i18n/cs';
import { worldGeometry } from './geometry';

/**
 * Kde to je. Malá mapa v detailu vlajky.
 *
 * Nezvětšuje se ani nevykresluje jen okolí – dítě potřebuje vidět, kde ta
 * země leží vůči celému světu, ne jak vypadají její hranice. Označené místo
 * je proto puntík se zvýrazněným obrysem, ne výřez.
 */
export function MiniMap({ code }: { code: string }) {
  const { shapes, viewBox, project } = useMemo(worldGeometry, []);
  const country = requireCountry(code);
  const point = useMemo(() => project(country.lng, country.lat), [project, country]);

  if (!point) return null;

  return (
    <svg
      viewBox={viewBox}
      className="h-auto w-full"
      role="img"
      aria-label={cs.album.whereIs(country.nameCs)}
    >
      <g>
        {shapes.map((shape) => (
          <path
            key={shape.id}
            d={shape.d}
            fill={shape.code === code ? 'var(--color-mint)' : 'rgb(255 255 255 / 0.09)'}
            stroke="rgb(6 10 20 / 0.85)"
            strokeWidth={0.4}
          />
        ))}
      </g>
      {/* Kroužek kolem místa – u malých států je to jediné, co je vidět. */}
      <circle
        cx={point[0]}
        cy={point[1]}
        r={9}
        fill="none"
        stroke="var(--color-mint)"
        strokeWidth={2.5}
      />
      <circle cx={point[0]} cy={point[1]} r={2.5} fill="var(--color-mint)" />
    </svg>
  );
}
