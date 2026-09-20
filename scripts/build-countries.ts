/**
 * Sloučí ručně psanou českou vrstvu se zdrojovými SVG, dopočítá odvozená pole
 * a zapíše `data/countries.json`. Při jakékoli nesrovnalosti skončí chybou –
 * data jsou základ celé aplikace, nechceme je mít tiše rozbitá.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import isoCountries from 'i18n-iso-countries';
import { europe } from '../data/cs/europe';
import { asia } from '../data/cs/asia';
import { africa } from '../data/cs/africa';
import { americas } from '../data/cs/americas';
import { oceania } from '../data/cs/oceania';
import { territories } from '../data/cs/territories';
import { similarGroups } from '../data/similar';
import { flagDifferences, pairKey } from '../data/differences';
import type { CsCountry } from '../data/schema';
import type { Country } from '../src/domain/types';
import { CONTINENTS, SOVEREIGNTIES, SUBREGIONS } from '../src/domain/types';
import { normalize } from '../src/domain/text/normalize';
import { OMITTED_UN } from '../src/config/app';
import { hasFlag, readAccent, readRatio, FLAG_SOURCE_NAME } from './flag-source';

const source: CsCountry[] = [...europe, ...asia, ...africa, ...americas, ...oceania, ...territories];

const errors: string[] = [];
const warnings: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}

// --- 1. Skupiny podobných vlajek → symetrické sousedství -------------------
const similarMap = new Map<string, Set<string>>();
for (const group of similarGroups) {
  for (const a of group) {
    for (const b of group) {
      if (a === b) continue;
      if (!similarMap.has(a)) similarMap.set(a, new Set());
      similarMap.get(a)!.add(b);
    }
  }
}

// --- 2. Sestavení zemí -----------------------------------------------------
const byCode = new Map<string, CsCountry>();
for (const c of source) {
  if (byCode.has(c.code)) fail(`Duplicitní kód: ${c.code}`);
  byCode.set(c.code, c);
}

const countries: Country[] = source.map((c) => {
  if (!hasFlag(c.code)) fail(`Chybí SVG pro kód ${c.code} (${c.nameCs})`);
  if (!CONTINENTS.includes(c.continent)) fail(`${c.code}: neznámý světadíl ${c.continent}`);
  if (!SUBREGIONS.includes(c.subregion)) fail(`${c.code}: neznámá podoblast ${c.subregion}`);
  if (!SOVEREIGNTIES.includes(c.sovereignty)) fail(`${c.code}: neznámá suverenita`);

  const needsReview = [...(c.review ?? [])];
  if (!c.funFact) needsReview.push('Chybí zajímavost o vlajce – doplň, nebo nech prázdné.');

  const alpha2 = c.code.toUpperCase();
  const iso3 = isoCountries.alpha2ToAlpha3(alpha2) ?? null;
  const numeric = isoCountries.alpha2ToNumeric(alpha2) ?? null;

  return {
    code: c.code,
    nameCs: c.nameCs,
    nameCsOfficial: c.nameCsOfficial ?? null,
    aliases: c.aliases ?? [],
    capitalCs: c.capitalCs,
    continent: c.continent,
    subregion: c.subregion,
    sovereignty: c.sovereignty,
    lat: c.lat,
    lng: c.lng,
    similar: [...(similarMap.get(c.code) ?? [])].sort(),
    difficulty: c.difficulty,
    funFact: c.funFact ?? null,
    ratio: hasFlag(c.code) ? readRatio(c.code) : [3, 2],
    accent: hasFlag(c.code) ? readAccent(c.code) : '#19E3B1',
    needsReview,
    iso3,
    numeric,
  } satisfies Country;
});

// --- 3. Kontroly -----------------------------------------------------------
for (const [code, set] of similarMap) {
  if (!byCode.has(code)) fail(`similar.ts odkazuje na neznámý kód: ${code}`);
  for (const other of set) {
    if (!byCode.has(other)) fail(`similar.ts odkazuje na neznámý kód: ${other}`);
  }
}

// Žádné dvě země nesmí mít stejný normalizovaný název ani alias –
// jinak by odpověď nešlo jednoznačně vyhodnotit.
const nameIndex = new Map<string, string[]>();
for (const c of countries) {
  for (const label of [c.nameCs, c.nameCsOfficial, ...c.aliases].filter(Boolean) as string[]) {
    const key = normalize(label);
    const list = nameIndex.get(key) ?? [];
    list.push(c.code);
    nameIndex.set(key, list);
  }
}
for (const [key, codes] of nameIndex) {
  const unique = [...new Set(codes)];
  if (unique.length > 1) fail(`Název „${key}“ patří víc zemím: ${unique.join(', ')}`);
}

// Ke každé zaměnitelné dvojici má být věta o tom, čím se liší. Chybějící
// se jen připomene – prázdná věta je pořád lepší než vymyšlená.
const pairsWithoutNote: string[] = [];
for (const group of similarGroups) {
  for (const a of group) {
    for (const b of group) {
      if (a >= b) continue;
      const key = pairKey(a, b);
      if (!flagDifferences[key] && !pairsWithoutNote.includes(key)) pairsWithoutNote.push(key);
    }
  }
}
if (pairsWithoutNote.length) {
  warnings.push(
    `Bez věty o rozdílu (${pairsWithoutNote.length}): ${pairsWithoutNote.join(', ')}`,
  );
}

// Věta o rozdílu nesmí odkazovat na dvojici, která v datech není.
for (const key of Object.keys(flagDifferences)) {
  const [a, b] = key.split('|');
  if (!a || !b) fail(`differences.ts: špatný klíč „${key}“`);
  else if (!byCode.has(a) || !byCode.has(b)) fail(`differences.ts: neznámá dvojice ${key}`);
  else if (!similarMap.get(a)?.has(b)) {
    fail(`differences.ts: ${key} není zaměnitelná dvojice podle similar.ts`);
  }
}

// Kontrola počtů podle sady. Vynechané státy jsou vyjmenované v OMITTED_UN,
// ať se nemůže stát, že nějaký zmizí omylem.
const omitted = Object.keys(OMITTED_UN);
for (const code of omitted) {
  if (byCode.has(code)) fail(`${code} je v OMITTED_UN, ale zároveň v datech`);
}
const expectedUn = 193 - omitted.length;
const unCount = countries.filter((c) => c.sovereignty === 'un').length;
if (unCount !== expectedUn) {
  fail(`Členů OSN má být ${expectedUn} (193 minus ${omitted.length} vynechaných), je ${unCount}`);
}

// Pokrytí mapou světa (chybějící = malé ostrovní státy, jen upozornění)
type Geometry = { id?: string };
const atlas = JSON.parse(
  readFileSync(join(process.cwd(), 'node_modules', 'world-atlas', 'countries-110m.json'), 'utf8'),
) as { objects: { countries: { geometries: Geometry[] } } };
const mapIds = new Set(atlas.objects.countries.geometries.map((g) => g.id));
const withoutMap = countries
  .filter((c) => c.sovereignty !== 'territory')
  .filter((c) => !c.numeric || !mapIds.has(c.numeric))
  .map((c) => c.code);
if (withoutMap.length) {
  warnings.push(`Bez polygonu na mapě (${withoutMap.length}): ${withoutMap.join(', ')}`);
}

// --- 4. Zápis --------------------------------------------------------------
if (errors.length) {
  console.error('\nCHYBY V DATECH:');
  for (const e of errors) console.error(' ✗ ' + e);
  process.exit(1);
}

countries.sort((a, b) => a.code.localeCompare(b.code));
const out = {
  meta: {
    generated: 'scripts/build-countries.ts – NEEDITOVAT RUČNĚ',
    flagSource: FLAG_SOURCE_NAME,
    count: countries.length,
  },
  countries,
};
writeFileSync(join(process.cwd(), 'data', 'countries.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');

console.log(`✓ data/countries.json – ${countries.length} záznamů`);
console.log(`  z toho členů OSN: ${unCount}`);
console.log(`  pozorovatelé: ${countries.filter((c) => c.sovereignty === 'observer').length}`);
console.log(`  částečně uznané: ${countries.filter((c) => c.sovereignty === 'partial').length}`);
console.log(`  území (bonus): ${countries.filter((c) => c.sovereignty === 'territory').length}`);
console.log(`  bez zajímavosti: ${countries.filter((c) => !c.funFact).length}`);
for (const w of warnings) console.log('  ! ' + w);
