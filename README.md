# Vlajky

Webová aplikace na učení vlajek světa. Česky, bez reklam a bez sledování,
funguje offline.

- **197 států** (193 členů OSN + Vatikán, Palestina, Kosovo, Tchaj-wan)
  a bonusová sada 31 závislých území
- **5 herních režimů** a chytré opakování podle plánovače FSRS
- **album** se samolepkami a mapou světa obarvenou podle toho, co už umíš
- **PWA** – jde nainstalovat na mobil a funguje bez internetu

## Lokální spuštění

```bash
npm install
npm run dev
```

Aplikace běží na <http://localhost:3000>.

Při prvním spuštění se z balíčku `svg-country-flags` vygenerují vlajky do
`public/flags/`. Dělá to `npm run data`, které si `npm run build` pouští samo;
pokud vlajky chybí i ve vývoji, spusť ho ručně.

> Service worker je ve vývojovém režimu vypnutý, jinak by se špatně ladilo.
> Offline režim se testuje na produkčním buildu: `npm run build && npm start`.

## Příkazy

| Příkaz | Co dělá |
|---|---|
| `npm run dev` | vývojový server |
| `npm run build` | přegeneruje data a udělá produkční build |
| `npm start` | spustí produkční build |
| `npm run check` | typecheck + lint + testy |
| `npm test` | testy logiky (Vitest) |
| `npm run data` | přegeneruje `data/countries.json`, `public/flags/` a `REVIEW.md` |

## Nasazení na Vercel

1. Naimportuj repozitář na <https://vercel.com/new>.
2. Framework se rozpozná sám (Next.js), build příkaz `npm run build`.
3. Žádné proměnné prostředí nejsou potřeba – aplikace nemá backend ani
   databázi a za běhu nikam nevolá.

## Jak přidat sadu vlajek

1. **Data.** Do `data/cs/` přidej soubor se seznamem záznamů (`CsCountry`).
   Povinné je `code` (ISO 3166-1 alpha-2 malými písmeny, musí existovat
   v balíčku `svg-country-flags`), `nameCs`, `capitalCs`, `continent`,
   `subregion`, `sovereignty`, `lat`, `lng` a `difficulty`.
2. **Zaregistruj ho** v `scripts/build-countries.ts` do pole `source`.
3. **Definuj sadu** v `data/sets.ts` – stačí funkce `filter`, která z dat
   vybere, co do sady patří.
4. **Název sady** přidej do `src/i18n/cs.ts` pod `sets`.
5. **Spusť** `npm run data && npm run check`.

Build ověří, že ke každému kódu existuje SVG, že jsou vazby zaměnitelných
vlajek oboustranné a že žádné dvě země nemají shodný normalizovaný název.
Když něco nesedí, skončí chybou a řekne co.

## Kontrola dat

`REVIEW.md` je generovaná tabulka všech českých názvů, hlavních měst
a zajímavostí o vlajkách. Je tam i seznam otevřených otázek (sporná hlavní
města, dvojznačné názvy) a vlajek, u kterých zatím není ověřená zajímavost.
Opravy patří do `data/cs/*.ts`, ne do REVIEW.md – ten se přegeneruje.

## Licence dat

Vlajky pocházejí z balíčku [`svg-country-flags`](https://github.com/hjnilsson/country-flags)
(public domain, zdrojové soubory z Wikipedie). Podklad mapy světa je
[`world-atlas`](https://github.com/topojson/world-atlas) (ISC).
