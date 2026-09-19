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

const outDir = join(process.cwd(), 'public', 'flags');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let before = 0;
let after = 0;

for (const country of data.countries) {
  const raw = readFileSync(flagPath(country.code), 'utf8');
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

const kb = (n: number) => Math.round(n / 1024);
console.log(`✓ public/flags/ – ${data.countries.length} vlajek, ${kb(before)} kB → ${kb(after)} kB`);
