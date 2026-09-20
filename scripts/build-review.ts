/**
 * Vygeneruje REVIEW.md – tabulku ke kontrole českých názvů, hlavních měst
 * a zajímavostí. Soubor je generovaný; opravy se dělají v `data/cs/*.ts`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Continent, Country } from '../src/domain/types';
import { similarGroups } from '../data/similar';
import { differenceFor } from '../data/differences';
import { OMITTED } from '../src/config/app';
import { cs } from '../src/i18n/cs';

const data = JSON.parse(readFileSync(join(process.cwd(), 'data', 'countries.json'), 'utf8')) as {
  meta: { flagSource: string };
  countries: Country[];
};

const all = data.countries;
const states = all.filter((c) => c.sovereignty !== 'territory');
const territories = all.filter((c) => c.sovereignty === 'territory');

const continentOrder: Continent[] = ['europe', 'asia', 'africa', 'northAmerica', 'southAmerica', 'oceania'];
const continentName = (c: Continent) => cs.continents[c];

const ratioText = (r: [number, number]) => {
  const v = r[0] / r[1];
  return `${v.toFixed(2)}:1`;
};

const escape = (s: string) => s.replace(/\|/g, '\\|');

function table(rows: Country[]): string {
  const head = '| Kód | Český název | Úřední název | Aliasy | Hlavní město | Obtížnost | Poměr | Zajímavost o vlajce |\n|---|---|---|---|---|---|---|---|';
  const body = rows
    .map(
      (c) =>
        `| \`${c.code}\` | **${escape(c.nameCs)}** | ${escape(c.nameCsOfficial ?? '–')} | ${
          c.aliases.length ? escape(c.aliases.join(', ')) : '–'
        } | ${escape(c.capitalCs)} | ${c.difficulty} | ${ratioText(c.ratio)} | ${
          c.funFact ? escape(c.funFact) : '**— CHYBÍ —**'
        } |`,
    )
    .join('\n');
  return `${head}\n${body}`;
}

const isDecided = (note: string) => note.startsWith('ROZHODNUTO:');
const isFactNote = (note: string) => note.startsWith('Chybí zajímavost');
const openQuestions = all.filter((c) =>
  c.needsReview.some((r) => !isFactNote(r) && !isDecided(r)),
);
const decided = all.filter((c) => c.needsReview.some(isDecided));
const missingFacts = all.filter((c) => !c.funFact);

const lines: string[] = [];

lines.push('# REVIEW – kontrola dat');
lines.push('');
lines.push('> Tenhle soubor je **generovaný** (`npm run data`). Opravy piš do `data/cs/*.ts`, ne sem.');
lines.push('');
lines.push('## Co je potřeba zkontrolovat');
lines.push('');
lines.push('1. **České názvy zemí** – jestli sedí s tím, jak se to říká/píše u nás.');
lines.push('2. **Hlavní města** – hlavně tam, kde je víc možností (viz otevřené otázky níž).');
lines.push('3. **Zajímavosti o vlajkách** – jestli jsou pravdivé a srozumitelné pro osmiletého.');
lines.push('4. **Aliasy** – co všechno se má uznat jako správná odpověď.');
lines.push('');
lines.push('Co je potřeba opravit, napiš k tomu poznámku – projdu to a přepíšu ve zdrojových datech.');
lines.push('');
lines.push('## Přehled');
lines.push('');
lines.push(`- Zdroj vlajek: ${data.meta.flagSource}`);
lines.push(`- Států v sadě „${cs.sets.world}“: **${states.length}** (193 členů OSN + Vatikán, Palestina, Kosovo, Tchaj-wan)`);
lines.push(`- Území v bonusové sadě: **${territories.length}**`);
lines.push(`- Zajímavost o vlajce chybí u **${missingFacts.length}** záznamů`);
lines.push(`- Otevřených otázek k rozhodnutí: **${openQuestions.length}**`);
lines.push('');
lines.push('### Co NENÍ ověřené');
lines.push('');
lines.push('- **Souřadnice (`lat`, `lng`)** jsou přibližné středy zemí. Slouží k obarvení mapy a později k nápovědě „směr + vzdálenost“. Na metry přesné nejsou a být nemusí.');
lines.push('- **Obtížnost 1–5** je odhad (jak je vlajka podobná jiným + jak je země známá), ne měřený údaj. Až bude dost odehraných odpovědí, dá se nahradit reálnými daty.');
lines.push('- **Poměr stran** je odečtený z `viewBox` zdrojového SVG, takže odpovídá tomu, co zdroj kreslí – ne nutně tomu, co je v zákoně dané země.');
lines.push('');

lines.push('## Otevřené otázky');
lines.push('');
if (openQuestions.length === 0) {
  lines.push('_Žádné._');
} else {
  for (const c of openQuestions) {
    const notes = c.needsReview.filter((r) => !isFactNote(r) && !isDecided(r));
    lines.push(`- **${c.nameCs}** (\`${c.code}\`)`);
    for (const n of notes) lines.push(`  - ${n}`);
  }
}
lines.push('');

lines.push('## Rozhodnutá sporná místa');
lines.push('');
lines.push('Tady už je rozhodnuto, zapsané jen pro paměť.');
lines.push('');
if (decided.length === 0) {
  lines.push('_Žádná._');
} else {
  for (const c of decided) {
    for (const note of c.needsReview.filter(isDecided)) {
      lines.push(`- **${c.nameCs}** (\`${c.code}\`) – ${note.replace('ROZHODNUTO: ', '')}`);
    }
  }
}
lines.push('');

lines.push('## Schválně vynechané záznamy');
lines.push('');
lines.push('Vlajku, kterou nemáme jak ukázat správně, je lepší neukazovat vůbec.');
lines.push('Až bude po ruce poctivé SVG, stačí záznam vrátit do `data/cs/*.ts`.');
lines.push('');
const omittedEntries = Object.entries(OMITTED);
if (omittedEntries.length === 0) {
  lines.push('_Žádné._');
} else {
  for (const [code, item] of omittedEntries) {
    lines.push(`- \`${code}\` – ${item.reason}`);
  }
}
lines.push('');

lines.push('## Chybějící zajímavosti');
lines.push('');
lines.push('U těchhle vlajek jsem nenašel fakt, za který bych ručil. Radši prázdné než vymyšlené –');
lines.push('když něco víš, doplníme. Aplikace funguje i bez nich (ukáže se jen velká vlajka).');
lines.push('');
if (missingFacts.length === 0) {
  lines.push('_Žádné._');
} else {
  lines.push(missingFacts.map((c) => `\`${c.code}\` ${c.nameCs}`).join(' · '));
}
lines.push('');

for (const cont of continentOrder) {
  const rows = states.filter((c) => c.continent === cont).sort((a, b) => a.nameCs.localeCompare(b.nameCs, 'cs'));
  if (!rows.length) continue;
  lines.push(`## ${continentName(cont)} (${rows.length})`);
  lines.push('');
  lines.push(table(rows));
  lines.push('');
}

lines.push(`## Bonusová sada: ${cs.sets.territories} (${territories.length})`);
lines.push('');
lines.push(table([...territories].sort((a, b) => a.nameCs.localeCompare(b.nameCs, 'cs'))));
lines.push('');

lines.push('## Skupiny zaměnitelných vlajek');
lines.push('');
lines.push('Podle nich se vybírají distraktory a staví režim Dvojčata. Čím víc přesných skupin, tím lepší trénink.');
lines.push('');
const nameOf = (code: string) => all.find((c) => c.code === code)?.nameCs ?? `? ${code}`;
for (const group of similarGroups) {
  lines.push(`- ${group.map(nameOf).join(' · ')}`);
}
lines.push('');

lines.push('## Čím se zaměnitelné vlajky liší');
lines.push('');
lines.push('Tyhle věty se ukazují po chybě, když dítě zamění dvě podobné vlajky.');
lines.push('Zkontroluj je prosím – je to to nejdůležitější, co se z aplikace učí.');
lines.push('');
lines.push('| Dvojice | Čím se liší |');
lines.push('|---|---|');
const seenPairs = new Set<string>();
for (const group of similarGroups) {
  for (const a of group) {
    for (const b of group) {
      if (a >= b) continue;
      const key = `${a}|${b}`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      const note = differenceFor(a, b);
      lines.push(
        `| ${nameOf(a)} · ${nameOf(b)} | ${note ? escape(note) : '**— CHYBÍ —**'} |`,
      );
    }
  }
}
lines.push('');

writeFileSync(join(process.cwd(), 'REVIEW.md'), lines.join('\n'), 'utf8');
console.log(`✓ REVIEW.md – ${all.length} záznamů, ${openQuestions.length} otevřených otázek`);
