import type { Country } from '../types';
import { shuffle, type Rng } from '../rng';

/**
 * Nejmenší rozestup mezi body na mapě ve stupních, když se hraje celý svět.
 *
 * Bez něj by dvě nabídnuté země mohly padnout na sebe a otázka by se
 * nedala prstem vůbec trefit.
 */
export const MIN_SEPARATION = 22;

/** Pod tuhle rozteč se nejde ani v té nejmenší části světa. */
export const MIN_SEPARATION_FLOOR = 2.5;

/**
 * Rozteč pro danou část světa.
 *
 * Patnáct stupňů platí pro celý svět. V Evropě by se na takovou rozteč
 * čtvrtá země nevešla a otázka by nabídla jen tři možnosti – jenže mapa
 * je v té chvíli přiblížená na Evropu, takže i menší rozestup je na
 * obrazovce pořád velký. Proto se rozteč počítá z rozlohy toho, co se
 * zrovna hraje, ne z pevného čísla.
 */
export function separationFor(pool: readonly Country[]): number {
  if (pool.length < 2) return MIN_SEPARATION;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const country of pool) {
    minLng = Math.min(minLng, country.lng);
    maxLng = Math.max(maxLng, country.lng);
    minLat = Math.min(minLat, country.lat);
    maxLat = Math.max(maxLat, country.lat);
  }

  // Rozhoduje delší strana, protože ta určuje, jak moc je mapa přiblížená.
  const span = Math.max(maxLng - minLng, maxLat - minLat);
  // Zhruba šestina té strany. U celého světa to vyjde nad strop, takže se
  // uplatní `MIN_SEPARATION`; u menší části se rozteč zmenší spolu s mapou,
  // která je v té chvíli přiblížená, a špendlíky zůstanou stejně daleko
  // od sebe na obrazovce.
  return Math.max(MIN_SEPARATION_FLOOR, Math.min(MIN_SEPARATION, span * 0.18));
}

/**
 * Hrubá vzdálenost dvou míst ve stupních.
 *
 * Nejde o navigaci, jen o to, aby se špendlíky nepřekrývaly a aby se dalo
 * říct „blízko / daleko“. Rozdíl zeměpisných délek se krátí kosinem šířky,
 * protože u pólů jsou poledníky blíž u sebe.
 */
export function roughDistance(a: Country, b: Country): number {
  const meanLat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  let dLng = Math.abs(a.lng - b.lng);
  if (dLng > 180) dLng = 360 - dLng;
  const x = dLng * Math.cos(meanLat);
  const y = a.lat - b.lat;
  return Math.sqrt(x * x + y * y);
}

export interface MapDistractorOptions {
  count?: number;
  rng: Rng;
  /** Nejmenší rozestup mezi body; bez něj se bere rozteč pro celý svět. */
  minSeparation?: number;
  /**
   * 0 = nabídnout místa z druhého konce světa,
   * 1 = nabídnout sousedy, kde se dá splést.
   */
  challenge?: number;
}

/**
 * Vybere místa, mezi kterými se na mapě rozhoduje.
 *
 * Distraktory podle podobnosti vlajek by tady nedávaly smysl – vlajka je
 * v otázce vidět. Rozhoduje vzdálenost: začátečník dostane body rozházené
 * po světě, pokročilý sousední země.
 */
export function pickMapDistractors(
  target: Country,
  pool: readonly Country[],
  { count = 3, rng, challenge = 0.5, minSeparation = MIN_SEPARATION }: MapDistractorOptions,
): Country[] {
  const others = pool.filter((c) => c.code !== target.code);
  if (others.length === 0) return [];

  /** Pokus o výběr při dané rozteči; může jich vrátit míň, než je potřeba. */
  const attempt = (separation: number): Country[] => {
    const candidates = others
      .map((c) => ({ country: c, distance: roughDistance(target, c) }))
      .filter((c) => c.distance >= separation)
      .sort((a, b) => a.distance - b.distance);
    if (candidates.length === 0) return [];

    // Z čeho se losuje: u těžké otázky z nejbližších, u lehké z nejvzdálenějších.
    const bandSize = Math.max(count * 3, 12);
    const start =
      challenge >= 0.5
        ? 0
        : Math.max(0, Math.floor((candidates.length - bandSize) * (1 - challenge * 2)));
    const band = candidates.slice(start, start + bandSize);

    const chosen: Country[] = [];
    for (const { country } of shuffle(band.length ? band : candidates, rng)) {
      if (chosen.length >= count) break;
      // Špendlíky se nesmí překrývat ani mezi sebou.
      if (chosen.some((other) => roughDistance(other, country) < separation)) continue;
      chosen.push(country);
    }
    return chosen;
  };

  /**
   * Rozteč je přání, ne podmínka.
   *
   * Otázka musí mít vždycky čtyři možnosti – tři jsou nápověda, že se
   * čtvrtá nevešla. Když se při plné rozteči nenajdou, povolí se postupně
   * až na nulu. Radši dva špendlíky blízko sebe než otázka, kde je šance
   * na tip jedna ku třem.
   */
  for (const relaxation of [1, 0.6, 0.3, 0]) {
    const chosen = attempt(minSeparation * relaxation);
    if (chosen.length >= count) return chosen;
  }

  // Sem se dostaneme jen v části světa, která nemá dost zemí.
  return attempt(0);
}
