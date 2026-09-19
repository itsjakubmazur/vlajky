import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Zdroj vlajkových SVG.
 *
 * Používáme `svg-country-flags` (public domain, rendery z Wikipedie), protože
 * jako jediný dostupný balíček má vlajky ve SKUTEČNÝCH poměrech stran
 * (Švýcarsko 1:1, Nepál praporec, Katar 28:11). Balíček `flag-icons` má
 * všechny vlajky překreslené do 4:3 – tam by se skutečný poměr nedal obnovit.
 *
 * Výměna zdroje = změna jen tohoto souboru.
 */
export const FLAG_SOURCE_DIR = join(process.cwd(), 'node_modules', 'svg-country-flags', 'svg');
export const FLAG_SOURCE_NAME = 'svg-country-flags (public domain, zdroj Wikipedia)';

export function flagPath(code: string): string {
  return join(FLAG_SOURCE_DIR, `${code}.svg`);
}

export function hasFlag(code: string): boolean {
  return existsSync(flagPath(code));
}

/** Skutečný poměr stran [šířka, výška] přečtený z viewBox zdrojového SVG. */
export function readRatio(code: string): [number, number] {
  const svg = readFileSync(flagPath(code), 'utf8');
  const viewBox = /viewBox\s*=\s*"([^"]+)"/i.exec(svg);
  if (viewBox?.[1]) {
    const parts = viewBox[1].trim().split(/[\s,]+/).map(Number);
    const w = parts[2];
    const h = parts[3];
    if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
      return [round(w), round(h)];
    }
  }
  const w = /\bwidth\s*=\s*"([\d.]+)"/i.exec(svg);
  const h = /\bheight\s*=\s*"([\d.]+)"/i.exec(svg);
  if (w?.[1] && h?.[1]) return [round(Number(w[1])), round(Number(h[1]))];
  throw new Error(`Nelze zjistit poměr stran vlajky ${code}`);
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
