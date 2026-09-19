/** Světadíly – klíče odpovídají `cs.continents`. */
export const CONTINENTS = [
  'europe',
  'asia',
  'africa',
  'northAmerica',
  'southAmerica',
  'oceania',
] as const;
export type Continent = (typeof CONTINENTS)[number];

/**
 * Podoblasti slouží ke generování chytrých distraktorů
 * (nabídnout sousední zemi je těžší než zemi z druhého konce světa).
 */
export const SUBREGIONS = [
  'westernEurope',
  'northernEurope',
  'southernEurope',
  'easternEurope',
  'centralEurope',
  'balkans',
  'baltics',
  'caucasus',
  'westernAsia',
  'centralAsia',
  'southAsia',
  'southeastAsia',
  'eastAsia',
  'northernAfrica',
  'westernAfrica',
  'centralAfrica',
  'easternAfrica',
  'southernAfrica',
  'northAmerica',
  'centralAmerica',
  'caribbean',
  'northernSouthAmerica',
  'andes',
  'southernCone',
  'australasia',
  'melanesia',
  'micronesia',
  'polynesia',
] as const;
export type Subregion = (typeof SUBREGIONS)[number];

/**
 * `un` – členský stát OSN
 * `observer` – pozorovatel OSN (Vatikán, Palestina)
 * `partial` – částečně uznaný stát (Kosovo, Tchaj-wan)
 * `territory` – závislé území nebo součást státu (bonusová sada)
 */
export const SOVEREIGNTIES = ['un', 'observer', 'partial', 'territory'] as const;
export type Sovereignty = (typeof SOVEREIGNTIES)[number];

export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** Jedna země tak, jak ji čte aplikace (výstup `data/countries.json`). */
export interface Country {
  /** ISO 3166-1 alpha-2 malými písmeny; klíč k SVG souboru. */
  code: string;
  nameCs: string;
  /** Dlouhý úřední název, zobrazuje se jen v detailu. */
  nameCsOfficial: string | null;
  /** Další přijímané odpovědi (hovorové názvy, zkratky, starší názvy). */
  aliases: string[];
  capitalCs: string;
  continent: Continent;
  subregion: Subregion;
  sovereignty: Sovereignty;
  /** Přibližný střed země (pro mapu a nápovědu směr/vzdálenost). */
  lat: number;
  lng: number;
  /** Kódy zaměnitelných vlajek; vztah je vždy oboustranný. */
  similar: string[];
  difficulty: Difficulty;
  /** Krátká ověřená zajímavost o vlajce; `null` = zatím neověřeno. */
  funFact: string | null;
  /** Skutečný poměr stran [šířka, výška] – odvozeno z viewBox zdrojového SVG. */
  ratio: [number, number];
  /** Co má rodič zkontrolovat v REVIEW.md. */
  needsReview: string[];
  /** ISO 3166-1 alpha-3; `null` u kódů mimo standard. */
  iso3: string | null;
  /** ISO 3166-1 numeric – napojení na polygony mapy světa. */
  numeric: string | null;
}
