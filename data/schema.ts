import type { Continent, Difficulty, Sovereignty, Subregion } from '@/domain/types';

/**
 * Ručně psaný český zdroj pravdy. Vše ostatní (poměr stran, existence SVG,
 * symetrie podobných vlajek) se dopočítává a validuje ve `scripts/build-countries.ts`.
 *
 * Pravidlo: `funFact` se vyplňuje jen tam, kde je fakt ověřitelný a týká se vlajky.
 * Když si nejsme jistí, necháme ho prázdný – nedomýšlíme.
 */
export interface CsCountry {
  code: string;
  nameCs: string;
  nameCsOfficial?: string;
  aliases?: string[];
  capitalCs: string;
  continent: Continent;
  subregion: Subregion;
  sovereignty: Sovereignty;
  lat: number;
  lng: number;
  difficulty: Difficulty;
  funFact?: string;
  /** Ruční poznámka do REVIEW.md (sporné zařazení, sporný název…). */
  review?: string[];
}
