/**
 * Normalizace odpovědi dítěte na mobilu.
 *
 * Cíl: „  Čad. “ → „cad“, „POBŘEŽÍ  SLONOVINY“ → „pobrezi slonoviny“,
 * „Guinea-Bissau“ → „guinea bissau“.
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    // odstranit diakritiku (kombinující znaky)
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    // interpunkci a spojovníky bereme jako mezeru, ne jako nic:
    // „Guinea-Bissau“ a „Guinea Bissau“ mají vyjít stejně
    .replace(/[-–—_/.,;:!?'"`´‘’“”()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalizace bez mezer – pro tolerantnější srovnání v našeptávači. */
export function normalizeTight(input: string): string {
  return normalize(input).replace(/ /g, '');
}
