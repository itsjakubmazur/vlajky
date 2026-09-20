/**
 * Zkopíruje SVG používaných vlajek do `public/flags/` a cestou je zmenší
 * SVGO. Kopírujeme jen kódy, které jsou v datech – ne celý balíček.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { optimize } from 'svgo';
import { flagPath } from './flag-source';
import type { Country } from '../src/domain/types';

const data = JSON.parse(readFileSync(join(process.cwd(), 'data', 'countries.json'), 'utf8')) as {
  countries: Country[];
};

/**
 * Zploští vnořený `<svg>` do obyčejné `<g>`.
 *
 * `transform` na elementu `<svg>` je až SVG 2 a Safari ho ignoruje – znak
 * se pak vykreslí v jiné velikosti i na jiném místě než v Chromu. Tenhle
 * krok spočítá odpovídající transformaci (viewBox + vlastní transform)
 * a zapíše ji na `<g>`, což umí každý prohlížeč.
 *
 * Když narazí na vnořený `<svg>`, který takhle přepsat nejde, skončí
 * chybou – radši hlasitě spadnout než tiše vydat rozbitou vlajku.
 */
function flattenNestedSvg(svg: string, code: string): string {
  let out = svg;

  for (;;) {
    const nested = findNested(out);
    if (!nested) return out;

    const { start, tagEnd, end, attrs } = nested;
    const viewBox = attrs.viewBox?.trim().split(/[\s,]+/).map(Number);
    const width = Number(attrs.width);
    const height = Number(attrs.height);

    if (!viewBox || viewBox.length !== 4 || !Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error(`${code}: vnořený <svg> bez viewBox/rozměrů, nelze zploštit`);
    }

    // Výchozí preserveAspectRatio je „xMidYMid meet“: menší z měřítek
    // a vystředění zbytku. Jiné zarovnání neumíme – to raději spadne.
    const aspect = (attrs.preserveAspectRatio ?? 'xMidYMid meet').trim();
    if (aspect !== 'xMidYMid meet' && aspect !== 'xMidYMid') {
      throw new Error(`${code}: vnořený <svg> má preserveAspectRatio="${aspect}", nelze zploštit`);
    }

    const [minX, minY, vbWidth, vbHeight] = viewBox as [number, number, number, number];
    const scale = Math.min(width / vbWidth, height / vbHeight);
    const centerX = (width - vbWidth * scale) / 2;
    const centerY = (height - vbHeight * scale) / 2;

    const offsetX = Number(attrs.x ?? 0);
    const offsetY = Number(attrs.y ?? 0);
    const own = attrs.transform ? `${attrs.transform} ` : '';
    const round = (n: number) => Math.round(n * 1e6) / 1e6;

    const transform =
      `translate(${round(offsetX)} ${round(offsetY)}) ${own}` +
      `translate(${round(centerX - minX * scale)} ${round(centerY - minY * scale)}) ` +
      `scale(${round(scale)})`;

    const inner = out.slice(tagEnd, end);
    out = `${out.slice(0, start)}<g transform="${transform.trim()}">${inner}</g>${out.slice(end + '</svg>'.length)}`;
  }
}

/** Najde první vnořený `<svg>` (ten vnější přeskočí) i jeho konec. */
function findNested(svg: string): {
  start: number;
  tagEnd: number;
  end: number;
  attrs: Record<string, string>;
} | null {
  const first = svg.indexOf('<svg');
  const start = svg.indexOf('<svg', first + 1);
  if (start < 0) return null;

  const tagEnd = svg.indexOf('>', start) + 1;
  const tag = svg.slice(start, tagEnd);

  const attrs: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z:-]+)\s*=\s*"([^"]*)"/g)) {
    attrs[m[1]!] = m[2]!;
  }

  // Najít párový </svg> se započítáním dalšího vnoření.
  let depth = 1;
  let i = tagEnd;
  while (i < svg.length) {
    if (svg.startsWith('<svg', i)) depth += 1;
    else if (svg.startsWith('</svg>', i)) {
      depth -= 1;
      if (depth === 0) return { start, tagEnd, end: i, attrs };
    }
    i += 1;
  }
  throw new Error('Neuzavřený vnořený <svg>');
}

const outDir = join(process.cwd(), 'public', 'flags');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let before = 0;
let after = 0;

for (const country of data.countries) {
  const raw = flattenNestedSvg(readFileSync(flagPath(country.code), 'utf8'), country.code);
  before += Buffer.byteLength(raw);

  const result = optimize(raw, {
    multipass: true,
    // SVGO 4 nechává viewBox na pokoji; je to náš zdroj poměru stran.
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // ID uvnitř souboru si necháme unikátní kvůli <use>/clipPath
            cleanupIds: { minify: true },
          },
        },
      },
    ],
  });

  after += Buffer.byteLength(result.data);
  writeFileSync(join(outDir, `${country.code}.svg`), result.data, 'utf8');
}

// Seznam pro service worker: všechny vlajky se předcachují, aby hra
// fungovala offline úplně celá, ne jen ta část, kterou už dítě vidělo.
const files = data.countries.map((c) => `/flags/${c.code}.svg`).sort();
const revision = createHash('sha1').update(files.join('|')).digest('hex').slice(0, 12);
mkdirSync(join(process.cwd(), 'src', 'generated'), { recursive: true });
writeFileSync(
  join(process.cwd(), 'src', 'generated', 'flag-manifest.ts'),
  `// GENEROVÁNO scripts/copy-flags.ts – needitovat ručně.\n` +
    `export const FLAG_REVISION = '${revision}';\n` +
    `export const FLAG_FILES: string[] = ${JSON.stringify(files, null, 2)};\n`,
  'utf8',
);

for (const country of data.countries) {
  const written = readFileSync(join(outDir, `${country.code}.svg`), 'utf8');
  if ((written.match(/<svg/g) ?? []).length > 1) {
    throw new Error(`${country.code}: ve výstupu zůstal vnořený <svg>`);
  }
}

const kb = (n: number) => Math.round(n / 1024);
console.log(`✓ public/flags/ – ${data.countries.length} vlajek, ${kb(before)} kB → ${kb(after)} kB`);
