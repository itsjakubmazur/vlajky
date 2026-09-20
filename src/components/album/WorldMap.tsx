'use client';

import { useMemo } from 'react';
import type { Mastery } from '@/domain/srs/types';
import { cs } from '@/i18n/cs';
import { worldGeometry } from '@/components/map/geometry';

const FILL: Record<Mastery, string> = {
  new: 'var(--color-new)',
  bronze: 'var(--color-bronze)',
  silver: 'var(--color-silver)',
  gold: 'var(--color-gold)',
};

/** Země mimo aktivní sadu – ať nepůsobí, že na ně hráč zapomněl. */
const OUT_OF_SET = 'rgb(255 255 255 / 0.05)';

export function WorldMap({
  masteryOf,
  inSet,
  onSelect,
}: {
  masteryOf: (code: string) => Mastery;
  inSet: (code: string) => boolean;
  onSelect?: (code: string) => void;
}) {
  const { shapes, dots, viewBox } = useMemo(worldGeometry, []);

  const fillFor = (code: string | undefined) =>
    code && inSet(code) ? FILL[masteryOf(code)] : OUT_OF_SET;

  return (
    <svg
      viewBox={viewBox}
      className="h-auto w-full"
      role="img"
      aria-label={cs.album.map}
    >
      <g>
        {shapes.map((shape) => (
          <path
            key={shape.id}
            d={shape.d}
            fill={fillFor(shape.code)}
            stroke="rgb(6 10 20 / 0.85)"
            strokeWidth={0.4}
            onClick={shape.code && onSelect ? () => onSelect(shape.code!) : undefined}
            className={shape.code && onSelect ? 'cursor-pointer' : undefined}
          />
        ))}
      </g>
      <g>
        {dots.map((dot) => (
          <circle
            key={dot.code}
            cx={dot.x}
            cy={dot.y}
            r={3}
            fill={fillFor(dot.code)}
            stroke="rgb(6 10 20 / 0.85)"
            strokeWidth={0.6}
            onClick={onSelect ? () => onSelect(dot.code) : undefined}
            className={onSelect ? 'cursor-pointer' : undefined}
          />
        ))}
      </g>
    </svg>
  );
}
