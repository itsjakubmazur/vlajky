/**
 * Levenshteinova vzdálenost s odříznutím: jakmile je jisté, že výsledek
 * překročí `max`, vrátí `max + 1`. Pro našeptávač nad 200 názvy to stačí
 * a je to výrazně rychlejší než plná matice.
 */
export function levenshtein(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr: number[] = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0]!;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        prev[j]! + 1, // smazání
        curr[j - 1]! + 1, // vložení
        prev[j - 1]! + cost, // záměna
      );
      curr[j] = value;
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1;
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  return prev[b.length]!;
}

/**
 * Povolená tolerance překlepu podle délky správné odpovědi.
 * Krátké názvy (Čad, Niger, Mali) musí sedět přesně – jinak by prošla jiná země.
 */
export function typoTolerance(targetLength: number): number {
  if (targetLength > 10) return 2;
  if (targetLength > 5) return 1;
  return 0;
}
