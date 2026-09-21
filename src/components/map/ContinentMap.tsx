'use client';

import { useMemo } from 'react';
import { ALL_COUNTRIES } from '@/domain/countries';
import type { Continent } from '@/domain/types';
import { cs } from '@/i18n/cs';
import { worldGeometry } from './geometry';

/**
 * Kotvy popisků světadílů v zeměpisných souřadnicích.
 *
 * Schválně ručně, ne průměrem souřadnic zemí: Evropu by průměr odtáhl
 * k Rusku a Oceánii do prázdného oceánu.
 */
const ANCHORS: Record<Continent, [lng: number, lat: number]> = {
  europe: [17, 51],
  asia: [88, 42],
  africa: [20, 3],
  northAmerica: [-100, 46],
  southAmerica: [-60, -14],
  oceania: [142, -26],
};

/** Mapa rozdělená na světadíly – podklad režimu Roztřiď. */
export function ContinentMap({
  zones,
  active,
  reveal,
  onZoneRect,
  children,
}: {
  /** Které světadíly jsou v téhle sadě ve hře. */
  zones: readonly Continent[];
  /** Světadíl pod prstem – zvýrazní se celý. */
  active?: Continent | null;
  /** Ve vyhodnocení se zvýrazní jen správné světadíly. */
  reveal?: boolean;
  /** Oznámí polohu zóny v obrazovkových bodech (kvůli tažení prstem). */
  onZoneRect?: (continent: Continent, element: SVGGElement | null) => void;
  /** Vlajky připnuté k jednotlivým světadílům; dostanou i polohu kotvy. */
  children?: (continent: Continent, x: number, y: number) => React.ReactNode;
}) {
  const { shapes, viewBox, project } = useMemo(worldGeometry, []);

  // Ke každému obrysu světadíl, ať se dá rozsvítit celá Afrika naráz.
  const continentOf = useMemo(() => {
    const map = new Map<string, Continent>();
    for (const country of ALL_COUNTRIES) map.set(country.code, country.continent);
    return map;
  }, []);

  const anchors = useMemo(
    () =>
      zones.flatMap((continent) => {
        const point = project(ANCHORS[continent][0], ANCHORS[continent][1]);
        return point ? [{ continent, x: point[0], y: point[1] }] : [];
      }),
    [zones, project],
  );

  return (
    <svg viewBox={viewBox} className="h-auto w-full touch-none select-none">
      <g>
        {shapes.map((shape) => {
          const continent = shape.code ? continentOf.get(shape.code) : undefined;
          const inZone = continent !== undefined && zones.includes(continent);
          const lit = inZone && active === continent;
          return (
            <path
              key={shape.id}
              d={shape.d}
              fill={
                lit
                  ? 'var(--color-mint)'
                  : inZone
                    ? 'rgb(255 255 255 / 0.16)'
                    : 'rgb(255 255 255 / 0.05)'
              }
              stroke="rgb(6 10 20 / 0.85)"
              strokeWidth={0.4}
              className="transition-[fill] duration-150"
            />
          );
        })}
      </g>

      {anchors.map(({ continent, x, y }) => (
        <g
          key={continent}
          ref={(element) => onZoneRect?.(continent, element)}
          data-continent={continent}
        >
          {/* Terč pro prst – větší než popisek, ať se to dá trefit. */}
          <circle cx={x} cy={y} r={34} fill="transparent" />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={15}
            fontWeight={800}
            fill={active === continent ? 'var(--color-abyss)' : 'var(--color-ink)'}
            stroke="rgb(6 10 20 / 0.75)"
            strokeWidth={active === continent ? 0 : 3}
            paintOrder="stroke"
            className={reveal ? 'opacity-60' : ''}
          >
            {cs.continents[continent]}
          </text>
          {children?.(continent, x, y)}
        </g>
      ))}
    </svg>
  );
}
