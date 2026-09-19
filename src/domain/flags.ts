/**
 * Vlajky, které nejsou obdélník. Takové se nesmí orámovat – rámeček by
 * nesledoval jejich tvar. Místo toho dostanou stín podle obrysu.
 */
export const NON_RECTANGULAR_FLAGS = new Set(['np']);

export function isRectangular(code: string): boolean {
  return !NON_RECTANGULAR_FLAGS.has(code);
}

/** Výška zobrazení vlajky v pixelech podle velikosti. */
export const FLAG_HEIGHTS = {
  xs: 22,
  sm: 34,
  md: 58,
  lg: 96,
  xl: 150,
} as const;

export type FlagSize = keyof typeof FLAG_HEIGHTS;
