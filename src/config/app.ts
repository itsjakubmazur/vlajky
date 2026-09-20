/**
 * Konfigurace aplikace. Název je zatím placeholder – vymyslí ho syn.
 */
export const APP_NAME = 'Vlajky';
export const APP_TAGLINE = 'Nauč se všechny vlajky světa';

/**
 * Členské státy OSN, které v aplikaci schválně nejsou.
 *
 * Vlajku, kterou nemáme jak ukázat správně, je lepší neukazovat vůbec –
 * naučit dítě zastaralou vlajku je horší než ji neučit. Až bude po ruce
 * poctivé SVG, stačí zemi vrátit do `data/cs/*.ts`, uložit soubor do
 * `data/flags-override/` a spustit `npm run data`.
 */
export const OMITTED_UN: Record<string, string> = {
  af:
    'Afghánistán – dnešní vlajka (bílá s vyznáním víry) není v žádném dostupném ' +
    'balíčku a arabskou kaligrafii nelze poctivě nakreslit zpaměti. Balíček by ' +
    'ukázal vlajku Islámské republiky, platnou do roku 2021.',
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
