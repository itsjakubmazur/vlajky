/**
 * Konfigurace aplikace. Název je zatím placeholder – vymyslí ho syn.
 */
export const APP_NAME = 'Vlajky';
export const APP_TAGLINE = 'Nauč se všechny vlajky světa';

/**
 * Záznamy, které v aplikaci schválně nejsou.
 *
 * Vlajku, kterou nemáme jak ukázat správně, je lepší neukazovat vůbec –
 * naučit dítě zastaralou nebo cizí vlajku je horší než ji neučit. Až bude
 * po ruce poctivé SVG, stačí záznam vrátit do `data/cs/*.ts`, soubor uložit
 * do `data/flags-override/` a spustit `npm run data`.
 *
 * `un: true` znamená, že jde o členský stát OSN – build si o to sníží
 * očekávaný počet členů, ať se nemůže stát, že nějaký zmizí omylem.
 */
export const OMITTED: Record<string, { un: boolean; reason: string }> = {
  af: {
    un: true,
    reason:
      'Afghánistán – dnešní vlajka (bílá s vyznáním víry) není v žádném dostupném ' +
      'balíčku a arabskou kaligrafii nelze poctivě nakreslit zpaměti. Balíček by ' +
      'ukázal vlajku Islámské republiky, platnou do roku 2021.',
  },
  'gb-nir': {
    un: false,
    reason:
      'Severní Irsko – od roku 1972 nemá vlastní úřední vlajku, používá se tam ' +
      'Union Jack. Balíček proto dodává tentýž soubor jako pro Spojené království ' +
      'a otázka „která země to je“ by neměla jedinou správnou odpověď. Ulsterský ' +
      'prapor je vlajka zrušené vlády, ne země.',
  },
};

/** Složení sady „Svět“. Změnou tohoto objektu se mění rozsah hry. */
export const WORLD_SET = {
  /** Suverenita, která se do sady počítá automaticky. */
  include: ['un', 'observer'] as const,
  /** Ručně přidané kódy nad rámec `include`. */
  extra: ['xk', 'tw'] as const,
};

/** Prahy pro mapování rychlosti odpovědi na hodnocení FSRS (v milisekundách). */
export const TIMING = {
  fastMs: 2500,
  slowMs: 8000,
};

/** Kolik karet je v denní dávce chytrého opakování. */
export const DAILY_REVIEW = { min: 10, max: 15 };
