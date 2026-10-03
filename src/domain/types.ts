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
 * `organization` – mezinárodní organizace (bonusová sada); nemá hlavní město
 *   ani místo na mapě, takže tyhle tři údaje jsou u ní `null`
 */
export const SOVEREIGNTIES = ['un', 'observer', 'partial', 'territory', 'organization'] as const;
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
  /** `null` u organizací – ty žádné hlavní město nemají. */
  capitalCs: string | null;
  /** `null` u organizací. OSN nepatří do Severní Ameriky, jen tam sídlí. */
  continent: Continent | null;
  subregion: Subregion | null;
  sovereignty: Sovereignty;
  /** Přibližný střed země (pro mapu a nápovědu směr/vzdálenost); `null` u organizací. */
  lat: number | null;
  lng: number | null;
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
  /** Výrazná barva z vlajky; rozhraní jí vlajku podsvítí. Odvozeno ze SVG. */
  accent: string;
}

/**
 * Země, která má místo na mapě a hlavní město.
 *
 * Organizace (OSN, EU) ho nemají a nemají ani mít: OSN nepatří do Severní
 * Ameriky, jen tam sídlí. Režimy, které se bez zeměpisu neobejdou – Hlavní
 * města, Kde to je, Roztřiď – si pool protáhnou přes `isPlaced` a tím mají
 * jistotu od překladače, ne od dobré vůle.
 */
export interface PlacedCountry extends Country {
  capitalCs: string;
  continent: Continent;
  subregion: Subregion;
  lat: number;
  lng: number;
}

export function isPlaced(country: Country): country is PlacedCountry {
  return (
    country.capitalCs !== null &&
    country.continent !== null &&
    country.subregion !== null &&
    country.lat !== null &&
    country.lng !== null
  );
}
