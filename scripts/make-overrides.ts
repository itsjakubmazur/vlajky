/**
 * Vygeneruje opravené vlajky do `data/flags-override/`.
 *
 * Proč vůbec: náš hlavní zdroj `svg-country-flags` se od roku 2021
 * neaktualizuje, takže u pár zemí má neplatnou podobu. Balíček `flag-icons`
 * je udržovaný a aktuální podobu má – jenže všechno kreslí do 4:3, což by
 * rozbilo skutečné poměry stran, na kterých celá aplikace stojí.
 *
 * Řešení: pole vlajky (pruhy, kříž) si nakreslíme sami ve skutečném poměru
 * a složitý znak přeneseme z flag-icons rovnoměrným zvětšením kolem středu.
 * Znak je kruhový a vztažený k výšce vlajky, takže se tím nedeformuje.
 *
 * Výstupy se commitují do repozitáře – build tak nezávisí na síti.
 * Spouští se ručně: `npx tsx scripts/make-overrides.ts`
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'node_modules', 'flag-icons', 'flags', '4x3');
const OUT = join(process.cwd(), 'data', 'flags-override');
mkdirSync(OUT, { recursive: true });

function header(note: string): string {
  return `<!-- GENEROVÁNO scripts/make-overrides.ts – needitovat ručně.\n     ${note} -->\n`;
}

/** Vnitřek zdrojového SVG bez pozadí (první výplň celé plochy). */
function emblemOf(code: string, backgroundPattern: RegExp): string {
  const svg = readFileSync(join(SRC, `${code}.svg`), 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return inner.replace(backgroundPattern, '').trim();
}

/**
 * Přenese znak z plátna 640×480 na naše plátno: střed na střed,
 * rovnoměrné zvětšení podle výšky (znak je vztažený k výšce vlajky).
 */
function transplant(emblem: string, width: number, height: number): string {
  const scale = height / 480;
  return `  <g transform="translate(${width / 2} ${height / 2}) scale(${round(scale)}) translate(-320 -240)">
${emblem
  .split('\n')
  .map((line) => (line.trim() ? '  ' + line : line))
  .join('\n')}
  </g>`;
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Pěticípá hvězda jako desetiúhelník – přesná geometrie, ne odhad. */
function star(cx: number, cy: number, radius: number): string {
  const inner = radius * 0.381966;
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : inner;
    const angle = (-90 + i * 36) * (Math.PI / 180);
    points.push(`${round(cx + r * Math.cos(angle))} ${round(cy + r * Math.sin(angle))}`);
  }
  return `M${points.join('L')}Z`;
}

// --- Sýrie: od prosince 2024 zeleno-bílo-černá se třemi červenými hvězdami --
{
  const w = 900;
  const h = 600;
  const band = h / 3;
  const radius = h * 0.135;
  const stars = [0.25, 0.5, 0.75]
    .map((x) => star(w * x, band * 1.5, radius))
    .join('');
  const svg = `${header('Sýrie – vlajka platná od prosince 2024. Poměr 2:3, geometrie dopočítaná; barvy podle flag-icons (MIT).')}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <path fill="#007a3d" d="M0 0h${w}v${band}H0Z"/>
  <path fill="#fff" d="M0 ${band}h${w}v${band}H0Z"/>
  <path fill="#000" d="M0 ${band * 2}h${w}v${band}H0Z"/>
  <path fill="#ce1126" d="${stars}"/>
</svg>
`;
  writeFileSync(join(OUT, 'sy.svg'), svg, 'utf8');
  console.log('✓ sy.svg – Sýrie, poměr 2:3');
}

// --- Kyrgyzstán: od prosince 2023 má slunce rovné paprsky ------------------
{
  const w = 600;
  const h = 360;
  const emblem = emblemOf('kg', /<path fill="red"[^>]*\/>/);
  const svg = `${header('Kyrgyzstán – vlajka platná od prosince 2023 (narovnané paprsky). Poměr 3:5, znak přenesený z flag-icons (MIT).')}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <path fill="red" d="M0 0h${w}v${h}H0Z"/>
${transplant(emblem, w, h)}
</svg>
`;
  writeFileSync(join(OUT, 'kg.svg'), svg, 'utf8');
  console.log('✓ kg.svg – Kyrgyzstán, poměr 3:5');
}

/**
 * Vytáhne všechno mezi značkou a koncem obalové skupiny.
 * Znak není jedna skupina, ale několik sourozenců za sebou.
 */
function contentAfter(svg: string, afterMarker: string): string {
  const start = svg.indexOf(afterMarker);
  if (start < 0) throw new Error(`Nenalezeno: ${afterMarker}`);
  const from = start + afterMarker.length;
  const to = svg.lastIndexOf('</g>'); // poslední zavírá obalovou skupinu
  const content = svg.slice(from, to);
  const opened = (content.match(/<g[\s>]/g) ?? []).length;
  const closed = (content.match(/<\/g>/g) ?? []).length;
  if (opened !== closed) throw new Error(`Nevyvážené skupiny: ${opened} vs ${closed}`);
  return content.trim();
}

// --- Dominika: pole a kříž kreslíme sami, papouška přeneseme ---------------
{
  const w = 600;
  const h = 300;
  const band = h * 0.0979; // šířka ramene kříže, odvozená ze zdroje
  const discR = h * 0.2674;
  const cx = w / 2;
  const cy = h / 2;
  const triple = band * 3;

  // Vodorovná i svislá trojice: žlutá, černá, bílá – v tom pořadí.
  const colors = ['#ffd600', '#000001', '#fff'];
  const horizontal = colors
    .map((c, i) => `  <path fill="${c}" d="M0 ${round(cy - triple / 2 + i * band)}h${w}v${round(band)}H0Z"/>`)
    .join('\n');
  const vertical = colors
    .map(
      (c, i) =>
        `  <path fill="${c}" d="M${round(cx - triple / 2 + i * band)} 0h${round(band)}v${h}h-${round(band)}Z"/>`,
    )
    .join('\n');

  // Znak z flag-icons sedí na disku o poloměru 136.9 se středem (257.7, 256.4).
  const source = readFileSync(join(SRC, 'dm.svg'), 'utf8');
  const emblem = contentAfter(source, 'ry="137.5" transform="scale(-1)"/>');
  const scale = discR / 136.9;

  const svg = `${header('Dominika – poměr 1:2. Pole a kříž dopočítané, znak s papouškem přenesený z flag-icons (MIT); náš hlavní zdroj kreslí hvězdy bez žlutého lemu.')}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <path fill="#108c00" d="M0 0h${w}v${h}H0Z"/>
${horizontal}
${vertical}
  <circle cx="${cx}" cy="${cy}" r="${round(discR)}" fill="#e72910"/>
  <g fill-rule="evenodd" transform="translate(${cx} ${cy}) scale(${round(scale)}) translate(-257.7 -256.4)">
${emblem}
  </g>
</svg>
`;
  writeFileSync(join(OUT, 'dm.svg'), svg, 'utf8');
  console.log('✓ dm.svg – Dominika, poměr 1:2');
}
