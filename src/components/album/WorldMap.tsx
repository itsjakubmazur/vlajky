'use client';

import { useMemo } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import type { Topology } from 'topojson-specification';
import topology from 'world-atlas/countries-110m.json';
import { ALL_COUNTRIES } from '@/domain/countries';
import type { Mastery } from '@/domain/srs/types';
import { cs } from '@/i18n/cs';

const WIDTH = 900;
const HEIGHT = 440;

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
  const { shapes, dots, viewBox } = useMemo(() => {
    const topo = topology as unknown as Topology;
    const collection = feature(topo, topo.objects.countries!) as unknown as FeatureCollection<
      Geometry,
      { name?: string }
    >;

    // Antarktida by zabrala třetinu výšky a žádnou vlajku v sadě nemá.
    const withoutAntarctica: FeatureCollection<Geometry, { name?: string }> = {
      ...collection,
      features: collection.features.filter((f) => String(f.id) !== '010'),
    };

    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], withoutAntarctica);
    const path = geoPath(projection);

    const codeByNumeric = new Map<string, string>();
    for (const country of ALL_COUNTRIES) {
      if (country.numeric) codeByNumeric.set(country.numeric, country.code);
    }

    const drawn = new Set<string>();
    const shapes = withoutAntarctica.features.flatMap((f) => {
      const code = codeByNumeric.get(String(f.id));
      const d = path(f);
      if (!d) return [];
      if (code) drawn.add(code);
      return [{ id: String(f.id), code, d }];
    });

    // Malé státy nemají v mapě polygon – ukážeme je aspoň jako puntík.
    const dots = ALL_COUNTRIES.filter((c) => c.sovereignty !== 'territory')
      .filter((c) => !drawn.has(c.code))
      .flatMap((c) => {
        const point = projection([c.lng, c.lat]);
        return point ? [{ code: c.code, x: point[0], y: point[1] }] : [];
      });

    // Ořez na skutečné rozměry pevnin – ať mapa nemá nahoře a dole prázdno.
    const [[x0, y0], [x1, y1]] = path.bounds(withoutAntarctica);
    const pad = 6;
    const viewBox = `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`;

    return { shapes, dots, viewBox };
  }, []);

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
