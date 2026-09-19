# CLAUDE.md

Webová aplikace na učení vlajek světa. Česky, bez reklam, pro osmiletého
testera, který už vlajky umí hodně dobře.

## Stav fází

| Fáze | Stav | Co obsahuje |
|---|---|---|
| **1 – MVP** | ✅ hotovo | 5 režimů, album, mapa, rozřazovací test, FSRS, PWA offline |
| 2 – Supabase | ⬜ nezačato | rodinné profily (přezdívka + avatar + PIN), statistiky, denní vlajka, odznaky, série |
| 3 – kreativní režimy | ⬜ nezačato | Vybarvi vlajku, Kresli zpaměti, Detektiv, Maraton, Duel přes kód místnosti |
| 4 – balíčky navíc | ⬜ nezačato | kraje ČR, historické vlajky, zvuky, animace, tmavý režim |

Sada „Území“ (31 závislých území včetně Anglie, Skotska, Walesu) už v datech je
a jde zapnout v Nastavení.

## Příkazy

```bash
npm run dev        # vývojový server
npm run data       # přegeneruje countries.json, public/flags/ a REVIEW.md
npm run build      # npm run data + produkční build
npm run check      # typecheck + lint + testy (spusť po každé změně)
npm test           # jen Vitest
```

`npm run data` je potřeba pustit po každé změně v `data/cs/*.ts` nebo
`data/similar.ts`. Build si ho pouští sám.

## Architektura

Tři vrstvy, které se znají jen jedním směrem:

```
src/app, src/components   →  React, jen zobrazování
src/domain                →  čistá logika, 0 závislostí na Reactu a DOM
src/store                 →  ProgressStore (rozhraní) + localStorage
```

**Pravidlo, které hlídá test** `tests/architecture.test.ts`:
v `src/domain/` nesmí být import z `react`/`next` ani sáhnutí na
`window`/`document`/`localStorage`. Díky tomu se celá logika testuje bez DOM
a výměna úložiště za Supabase (fáze 2) se nedotkne UI.

### Kde co je

| Cesta | K čemu |
|---|---|
| `data/cs/*.ts` | **ruční zdroj pravdy** pro česká data (názvy, města, zajímavosti) |
| `data/similar.ts` | skupiny zaměnitelných vlajek |
| `data/countries.json` | GENEROVANÉ – needitovat |
| `scripts/build-countries.ts` | sloučení + validace dat |
| `scripts/flag-source.ts` | jediné místo, kde se řeší zdroj SVG |
| `src/domain/answer/match.ts` | vyhodnocení napsané odpovědi |
| `src/domain/quiz/` | distraktory, režimy, sestavení hry |
| `src/domain/srs/` | FSRS, úrovně zvládnutí |
| `src/store/ProgressStore.ts` | rozhraní úložiště (fáze 2 = nová implementace) |
| `src/i18n/cs.ts` | **všechny** texty rozhraní |
| `src/config/app.ts` | název aplikace, složení sady, prahy |

## Konvence

- **Texty:** žádný český řetězec v komponentách – všechno přes `cs` z `src/i18n/cs.ts`.
  Hlídá to test.
- **Název aplikace** je placeholder v `src/config/app.ts` (`APP_NAME`), syn ho
  teprve vymyslí. Nikde jinde se nepíše natvrdo.
- **Fakta o vlajkách:** raději prázdné než vymyšlené. Když si nejsme jistí,
  `funFact` se vynechá a záznam se objeví v REVIEW.md. Teď chybí u 24 vlajek.
- **Commity:** conventional commits, česky, malé kroky.
- **Po každé změně:** `npm run check`.
- **Žádné externí požadavky za běhu** – ani fonty, ani analytika. Všechno je
  lokální kvůli offline režimu a soukromí.

## Rozhodnutí, která stojí za vysvětlení

**Zdroj vlajek je `svg-country-flags`, ne `flag-icons`.** Původní zadání znělo
na `flag-icons`, jenže ten má všechny vlajky překreslené do 4:3 – včetně
Švýcarska (ve skutečnosti 1:1), Nepálu (praporec) a Kataru (28:11). Není to
roztažená kopie originálu, ale jiná kresba: japonský kotouč je v ní skutečný
kruh na plátně 4:3, takže zmáčknutím zpět do 3:2 by vznikla elipsa.
`svg-country-flags` (public domain, rendery z Wikipedie) má skutečné poměry a
pokrývá i `xk`, `tw`, `ps`, `va` a `gb-eng`. Poměr stran se odečítá z `viewBox`
zdrojového souboru, takže není psaný z hlavy.

**Zlato nejde proklikat.** Nejvyšší úroveň zvládnutí vyžaduje aspoň jednu
správnou odpověď v režimu Napiš. Ze čtyř možností se dá trefit náhodou.

**Rozřazovací test neplýtvá.** Rychlá správná odpověď kartu odloží daleko do
budoucna, špatná odpověď ji nechá novou (netrestá se neznalost toho, co se
dítě ještě neučilo).

**Jiná existující země nikdy neprojde jako překlep.** „Nigérie“ při otázce na
Niger je chyba, ne překlep – i kdyby byla vzdálenost malá. Viz `match.ts`.

## Co čeká na kontrolu

`REVIEW.md` (generovaný) má 21 otevřených otázek – sporná hlavní města,
dvojznačné názvy (Kongo) a dvě vlajky, které se v posledních letech změnily
(Afghánistán, Sýrie) a zdrojový balíček má jejich starší podobu.
