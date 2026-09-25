import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import type { Topology } from 'topojson-specification';
import topology from 'world-atlas/countries-110m.json';
import { ALL_COUNTRIES } from '@/domain/countries';

const WIDTH = 900;
const HEIGHT = 440;

/**
 * Nejmenší poměr stran výřezu (šířka ku výšce).
 *
 * Vyšší mapa se na telefonu nevejde pod vlajku a musela by se zmenšit,
 * aby se vešla do dostupné výšky – a s ní by se zmenšily i špendlíky.
 * Radši ukázat kus oceánu navíc než mapu, na které nic není vidět.
 * Odpovídá zhruba poměru místa, které na mapu na telefonu zbývá.
 */
const MIN_FRAME_RATIO = 1.5;

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

const cache = new Map<number, WorldGeometry>();

/**
 * O kolik stupňů pootočit projekci, aby se daná část světa nelámala vejpůl.
 *
 * Projekce je středěná na nultý poledník, takže mapa má šev na 180°. Oceánie
 * leží po obou jeho stranách: podle zeměpisných délek se rozpíná přes 354°,
 * ale její nejkratší oblouk má jen 54° – je to kompaktní oblast, jen leží
 * přes šev. Bez pootočení by se z ní výřez nedal udělat vůbec.
 *
 * Pravidlo je obecné, ne „když Oceánie“: najde se největší mezera mezi
 * zeměpisnými délkami a oblast se vystředí na oblouk, který zbyde. U pěti
 * ze šesti světadílů z toho vyjde nula, protože šev neprotínají – jejich
 * mapa tedy zůstává přesně taková, jaká byla.
 */
export function rotationFor(codes: readonly string[]): number {
  const lngs: number[] = [];
  for (const code of codes) {
    const country = ALL_COUNTRIES.find((c) => c.code === code);
    if (country) lngs.push(country.lng);
  }
  if (lngs.length < 2) return 0;

  lngs.sort((a, b) => a - b);
  const plain = lngs[lngs.length - 1]! - lngs[0]!;

  let gap = 0;
  let arcStart = lngs[0]!;
  for (let i = 0; i < lngs.length; i++) {
    const next = i === lngs.length - 1 ? lngs[0]! + 360 : lngs[i + 1]!;
    if (next - lngs[i]! > gap) {
      gap = next - lngs[i]!;
      arcStart = next;
    }
  }

  const arc = 360 - gap;
  /*
    Otáčí se jen tam, kde oblast *vypadá* rozpůlená: podle délek se rozpíná
    přes víc než půl zeměkoule, ale ve skutečnosti se vejde do míň než
    poloviny toho rozpětí. Celý svět tuhle podmínku nesplní (rozpíná se přes
    359° a nejkratší oblouk má 340°), takže zůstává středěný na nultý
    poledník tak, jak ho děti znají z atlasu.
  */
  if (plain <= 180 || arc > plain / 2) return 0;

  const center = ((arcStart + arc / 2 + 540) % 360) - 180;
  return -Math.round(center);
}

/**
 * Geometrie světové mapy pro dané pootočení projekce.
 *
 * Počítá se jednou na pootočení a drží se v paměti: album, detail vlajky
 * i Roztřiď berou nulu, takže sdílejí jednu mapu, a projekce je pro ně
 * stejná – jinak by puntíky neseděly na pevninu.
 */
export function worldGeometry(rotationLng = 0): WorldGeometry {
  const key = Math.round(rotationLng);
  const cached = cache.get(key);
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

  const projection = geoNaturalEarth1()
    .rotate([key, 0])
    .fitSize([WIDTH, HEIGHT], withoutAntarctica);
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
   * Výřez si **drží svůj vlastní poměr stran**, jen se usadí mezi poměrem
   * `MIN_FRAME_RATIO` a poměrem světa. Původně se dorovnával na poměr světa (2,26:1) a to dělalo
   * každý světadíl zbytečně širokým: Evropa vycházela 343 jednotek místo
   * potřebných 185, Jižní Amerika 437 místo 133. Půlka mapy pak byla prázdný
   * oceán a všechno zbytečně malé.
   *
   * Výřez se nikdy nezvětší přes celý svět a nezmenší pod šestinu jeho
   * šířky – u jedné malinké země by jinak vyšlo takové zvětšení, že by
   * na mapě nebylo vidět nic známého, podle čeho se zorientovat.
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

    // Poměr stran mezi čtvercem a poměrem světa.
    const own = Math.min(Math.max(width / height, MIN_FRAME_RATIO), ratio);
    if (width / height < own) width = height * own;
    else height = width / own;

    if (width > world.width || height > world.height) return whole;

    // Spodní mez zvětšení.
    if (width < world.width / 6) {
      const grow = world.width / 6 / width;
      width *= grow;
      height *= grow;
    }

    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    const x = Math.max(world.x, Math.min(centerX - width / 2, world.x + world.width - width));
    const y = Math.max(world.y, Math.min(centerY - height / 2, world.y + world.height - height));

    return { viewBox: `${x} ${y} ${width} ${height}`, scale: width / world.width };
  };

  const geometry: WorldGeometry = {
    shapes,
    dots,
    viewBox: `${world.x} ${world.y} ${world.width} ${world.height}`,
    project: (lng, lat) => {
      const point = projection([lng, lat]);
      return point ? [point[0], point[1]] : null;
    },
    frameFor,
  };
  cache.set(key, geometry);
  return geometry;
}
