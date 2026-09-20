import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import type { Topology } from 'topojson-specification';
import topology from 'world-atlas/countries-110m.json';
import { ALL_COUNTRIES } from '@/domain/countries';

const WIDTH = 900;
const HEIGHT = 440;

export interface MapShape {
  id: string;
  /** Kód země, pokud jsme polygon uměli spárovat. */
  code: string | undefined;
  d: string;
}

export interface MapDot {
  code: string;
  x: number;
  y: number;
}

export interface WorldGeometry {
  shapes: MapShape[];
  dots: MapDot[];
  viewBox: string;
  /** Zeměpisné souřadnice → bod v soustavě `viewBox`. */
  project: (lng: number, lat: number) => [number, number] | null;
}

let cached: WorldGeometry | null = null;

/**
 * Geometrie světové mapy. Počítá se jednou na celou aplikaci – album
 * i kvíz s mapou kreslí tentýž podklad, takže nemá smysl ji mít dvakrát
 * a projekce musí být stejná, jinak by puntíky neseděly na pevninu.
 */
export function worldGeometry(): WorldGeometry {
  if (cached) return cached;

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
  const shapes = withoutAntarctica.features.flatMap<MapShape>((f) => {
    const code = codeByNumeric.get(String(f.id));
    const d = path(f);
    if (!d) return [];
    if (code) drawn.add(code);
    return [{ id: String(f.id), code, d }];
  });

  // Malé státy nemají v mapě polygon – ukážeme je aspoň jako puntík.
  const dots = ALL_COUNTRIES.filter((c) => c.sovereignty !== 'territory')
    .filter((c) => !drawn.has(c.code))
    .flatMap<MapDot>((c) => {
      const point = projection([c.lng, c.lat]);
      return point ? [{ code: c.code, x: point[0], y: point[1] }] : [];
    });

  // Ořez na skutečné rozměry pevnin – ať mapa nemá nahoře a dole prázdno.
  const [[x0, y0], [x1, y1]] = path.bounds(withoutAntarctica);
  const pad = 6;

  cached = {
    shapes,
    dots,
    viewBox: `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`,
    project: (lng, lat) => {
      const point = projection([lng, lat]);
      return point ? [point[0], point[1]] : null;
    },
  };
  return cached;
}
