/**
 * Konfigurace aplikace. Název je zatím placeholder – vymyslí ho syn.
 */
export const APP_NAME = 'Vlajky';
export const APP_TAGLINE = 'Nauč se všechny vlajky světa';

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
