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

/** Výřez mapy: co se má vykreslit a jak moc je proti světu zvětšený. */
export interface MapFrame {
  viewBox: string;
  /**
   * Poměr šířky výřezu k šířce celého světa.
   *
   * Špendlík má být na obrazovce pořád stejně velký, ať se kouká na svět
   * nebo na Evropu. Protože se zmenšuje plátno, musí se o stejný díl
   * zmenšit i poloměr – proto ho komponenty násobí právě tímhle číslem.
   */
  scale: number;
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
  /** Výřez kolem zadaných zemí; bez kódů vrátí celý svět. */
  frameFor: (codes: readonly string[]) => MapFrame;
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
  const world = {
    x: x0 - pad,
    y: y0 - pad,
    width: x1 - x0 + pad * 2,
    height: y1 - y0 + pad * 2,
  };

  const pointByCode = new Map<string, [number, number]>();
  for (const country of ALL_COUNTRIES) {
    const point = projection([country.lng, country.lat]);
    if (point) pointByCode.set(country.code, [point[0], point[1]]);
  }

  /**
   * Výřez kolem zadaných zemí.
   *
   * Počítá se z bodů, kam se sázejí špendlíky, **ne z obrysů**. Rusko je
   * v datech Evropa a jeho obrys sahá až k Pacifiku, takže podle obrysů
   * vycházela „Evropa“ skoro jako celý svět. Podle bodů je výřez pravdivý:
   * co je v něm vidět, je přesně to, na co se dá klepnout.
   *
   * Poměr stran se drží stejný jako u světa, aby mapa seděla do stejného
   * místa v rozvržení. Výřez se nikdy nezvětší přes celý svět a nezmenší
   * pod jeho šestinu – u jedné malinké země by jinak vyšlo takové
   * zvětšení, že by na mapě nebylo vidět nic známého.
   */
  const frameFor = (codes: readonly string[]): MapFrame => {
    const ratio = world.width / world.height;
    const whole: MapFrame = {
      viewBox: `${world.x} ${world.y} ${world.width} ${world.height}`,
      scale: 1,
    };

    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const code of codes) {
      const point = pointByCode.get(code);
      if (!point) continue;
      left = Math.min(left, point[0]);
      top = Math.min(top, point[1]);
      right = Math.max(right, point[0]);
      bottom = Math.max(bottom, point[1]);
    }
    if (!Number.isFinite(left) || !Number.isFinite(top)) return whole;

    // Okraj aspoň na poloměr špendlíku, ať krajní vlajka nevisí přes hranu.
    const margin = Math.max((right - left) * 0.08, (bottom - top) * 0.08, 34);
    let width = right - left + margin * 2;
    let height = bottom - top + margin * 2;

    if (width / height < ratio) width = height * ratio;
    width = Math.min(world.width, Math.max(width, world.width / 6));
    height = width / ratio;

    if (width >= world.width) return whole;

    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    const x = Math.max(world.x, Math.min(centerX - width / 2, world.x + world.width - width));
    const y = Math.max(world.y, Math.min(centerY - height / 2, world.y + world.height - height));

    return { viewBox: `${x} ${y} ${width} ${height}`, scale: width / world.width };
  };

  cached = {
    shapes,
    dots,
    viewBox: `${world.x} ${world.y} ${world.width} ${world.height}`,
    project: (lng, lat) => {
      const point = projection([lng, lat]);
      return point ? [point[0], point[1]] : null;
    },
    frameFor,
  };
  return cached;
}
