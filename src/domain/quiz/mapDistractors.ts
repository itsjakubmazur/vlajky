import type { Country } from '../types';
import { shuffle, type Rng } from '../rng';

/**
 * Nejmenší rozestup mezi body na mapě ve stupních.
 *
 * Bez něj by dvě nabídnuté země mohly padnout na sebe a otázka by se
 * nedala prstem vůbec trefit.
 */
export const MIN_SEPARATION = 15;

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
  { count = 3, rng, challenge = 0.5 }: MapDistractorOptions,
): Country[] {
  const candidates = pool
    .filter((c) => c.code !== target.code)
    .map((c) => ({ country: c, distance: roughDistance(target, c) }))
    .filter((c) => c.distance >= MIN_SEPARATION)
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
    if (chosen.some((other) => roughDistance(other, country) < MIN_SEPARATION)) continue;
    chosen.push(country);
  }

  // Když je část světa malá, radši méně možností než dvě na sobě.
  return chosen;
}
