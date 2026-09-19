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

/**
 * Ruční opravy. Hlavní balíček se od roku 2021 neaktualizuje, takže u zemí,
 * které si mezitím vlajku změnily, bere přednost soubor odtud.
 * Generuje je `scripts/make-overrides.ts` a jsou v repozitáři.
 */
export const FLAG_OVERRIDE_DIR = join(process.cwd(), 'data', 'flags-override');

export function flagPath(code: string): string {
  const override = join(FLAG_OVERRIDE_DIR, `${code}.svg`);
  return existsSync(override) ? override : join(FLAG_SOURCE_DIR, `${code}.svg`);
}

/** Je vlajka ručně opravená? Kvůli poznámce v REVIEW.md. */
export function isOverridden(code: string): boolean {
  return existsSync(join(FLAG_OVERRIDE_DIR, `${code}.svg`));
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

const NAMED_COLORS: Record<string, string> = {
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  white: '#ffffff',
  black: '#000000',
  yellow: '#ffff00',
  orange: '#ffa500',
  navy: '#000080',
  gold: '#ffd700',
  lime: '#00ff00',
};

function toHex(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (NAMED_COLORS[value]) return NAMED_COLORS[value]!;
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  if (/^#[0-9a-f]{3}$/.test(value)) {
    return '#' + value.slice(1).split('').map((c) => c + c).join('');
  }
  return null;
}

function saturationAndLightness(hex: string): { s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { s: s * 100, l: l * 100 };
}

/**
 * Výrazná barva vlajky – rozhraní jí pak podsvítí vlajku v albu i v kvízu.
 *
 * Bereme první syté plné barvy v souboru; vlajky z Wikipedie se kreslí
 * odzadu, takže mezi prvními výplněmi bývá pole vlajky. Bílou, černou
 * a šedé přeskakujeme – ty by jako světlo nefungovaly.
 */
export function readAccent(code: string, fallback = '#19E3B1'): string {
  const svg = readFileSync(flagPath(code), 'utf8');
  const fills = [...svg.matchAll(/(?:fill|stop-color)\s*=\s*"([^"]+)"/g)]
    .map((match) => toHex(match[1] ?? ''))
    .filter((hex): hex is string => hex !== null);

  const vivid = (hex: string) => {
    const { s, l } = saturationAndLightness(hex);
    return s > 25 && l > 12 && l < 88;
  };

  const early = fills.slice(0, 6).find(vivid);
  if (early) return early;

  const any = fills.find((hex) => {
    const { s, l } = saturationAndLightness(hex);
    return s > 20 && l > 10 && l < 90;
  });
  return any ?? fallback;
}
