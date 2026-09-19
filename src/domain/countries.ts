import raw from '~data/countries.json';
import type { Country } from './types';

interface CountriesFile {
  meta: { flagSource: string; count: number };
  countries: Country[];
}

const file = raw as unknown as CountriesFile;

export const ALL_COUNTRIES: readonly Country[] = file.countries;
export const FLAG_SOURCE = file.meta.flagSource;

const index = new Map(ALL_COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string): Country | undefined {
  return index.get(code);
}

/** Vyhodí chybu – pro místa, kde kód musí existovat (přišel z našich dat). */
export function requireCountry(code: string): Country {
  const c = index.get(code);
  if (!c) throw new Error(`Neznámý kód země: ${code}`);
  return c;
}

/** Cesta k SVG vlajce. Vše je lokální, žádný externí požadavek. */
export function flagUrl(code: string): string {
  return `/flags/${code}.svg`;
}
