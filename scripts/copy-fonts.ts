/**
 * Zkopíruje self-hostované fonty do `public/fonts/`.
 *
 * Bereme jen řezy latin a latin-ext (čeština potřebuje obojí – ř, ě, ů, ž
 * jsou v latin-ext) a jen osu tloušťky. Google Fonts nepoužíváme schválně:
 * aplikace nesmí za běhu nikam volat.
 */
import { copyFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Jedno písmo na všechno – nadpisy se od textu liší jen tloušťkou a proklikem.
 * Dvě rodiny dělaly v tak malém rozhraní víc hluku než užitku.
 */
const FACES = [
  { pkg: '@fontsource-variable/figtree', file: 'figtree-latin-wght-normal.woff2' },
  { pkg: '@fontsource-variable/figtree', file: 'figtree-latin-ext-wght-normal.woff2' },
];

const outDir = join(process.cwd(), 'public', 'fonts');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let bytes = 0;
for (const face of FACES) {
  const from = join(process.cwd(), 'node_modules', face.pkg, 'files', face.file);
  const to = join(outDir, face.file);
  copyFileSync(from, to);
  bytes += statSync(to).size;
}

console.log(`✓ public/fonts/ – ${FACES.length} souborů, ${Math.round(bytes / 1024)} kB`);
