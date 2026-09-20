# CLAUDE.md

Webová aplikace na učení vlajek světa. Česky, bez reklam, pro osmiletého
testera, který už vlajky umí hodně dobře.

## Stav fází

| Fáze | Stav | Co obsahuje |
|---|---|---|
| **1 – MVP** | ✅ hotovo | 5 režimů, album, mapa, rozřazovací test, FSRS, PWA offline |
| **1b – gamifikace** | ✅ hotovo | body a kombo, 4 nové režimy, denní výzva, mise, hodnosti, souboje, odemykání, zvuky |
| 2 – Supabase | ⬜ nezačato | rodinné profily (přezdívka + avatar + PIN), statistiky, denní vlajka, odznaky, série |
| 3 – kreativní režimy | ⬜ nezačato | Vybarvi vlajku, Kresli zpaměti, Detektiv, Maraton, Duel přes kód místnosti |
| 4 – balíčky navíc | ⬜ nezačato | kraje ČR, historické vlajky, zvuky, animace, tmavý režim |

Sada „Území“ (31 závislých území včetně Anglie, Skotska, Walesu) už v datech je
a jde zapnout v Nastavení.

**Část světa** se vybírá na domovské obrazovce a platí pro všechny režimy
naráz (`meta.region`, `useActivePool`). Denní výzva a souboje ji schválně
ignorují: denní výzva musí být pro všechny stejná, jinak by nešla porovnat,
a souboje spojují i vlajky z různých světadílů (Irsko a Pobřeží slonoviny).
Rekordy se vedou zvlášť pro každou část světa (`mode:region`), aby se
maraton po Evropě nemísil s maratonem přes celý svět.

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
| `data/flags-override/` | ručně opravené vlajky – mají přednost před balíčkem |
| `scripts/make-overrides.ts` | generátor těch oprav (spouští se ručně) |
| `src/domain/answer/match.ts` | vyhodnocení napsané odpovědi |
| `src/domain/quiz/` | distraktory, režimy, sestavení hry |
| `src/domain/srs/` | FSRS, úrovně zvládnutí |
| `src/domain/game/` | body, hodnosti, souboje, denní výzva, mise, odemykání |
| `src/store/ProgressStore.ts` | rozhraní úložiště (fáze 2 = nová implementace) |
| `src/i18n/cs.ts` | **všechny** texty rozhraní |
| `src/config/app.ts` | název aplikace, složení sady, prahy |
| `src/quiz/useActivePool.ts` | co se zrovna hraje: sada × část světa |

## Vizuální systém

Aplikace má jeden vizuální svět – **noční atlas**. Teze, ze které se odvíjí
všechno ostatní: *vlajky jsou jediná sytá barva na obrazovce, rozhraní je sklo.*

- **Podklad:** tmavá `--color-abyss` a nad ní polární záře ze tří měkkých
  gradientů (`body::before`, žádný obrázek). Bez ní by sklo nemělo co matnit.
- **Sklo ve třech silách** podle role, ne plošně: `glass-raised` pro panel
  s hlavní akcí, `glass` pro běžné panely, `glass-thin` pro čipy a štítky.
  Ne každý blok je karta.
- **Barvy:** `mint` je jediná plná barva rozhraní (hlavní akce, správná
  odpověď), `gold` je nejvyšší úroveň a oslava, `coral` chyba. Šedé jsou
  laděné do modra, ne neutrální.
- **Písmo:** Figtree, jedna rodina na všechno. Nadpisy se od textu liší jen
  tloušťkou a proklikem (utilita `display`), ne jiným písmem – v tak malém
  rozhraní dělaly dvě rodiny víc hluku než užitku. Self-hostované ze
  `public/fonts/` – Google Fonts by porušily pravidlo o žádných externích
  požadavcích. Řez **latin-ext je pro češtinu povinný**.
- **Vlajky svítí:** každá má v datech pole `accent` – výraznou barvu odečtenou
  ze svého SVG při buildu (`scripts/flag-source.ts`). Halo za vlajkou je ze
  dvou vrstev: široká rozlitá záře a těsné jasné jádro. Bez toho jádra to
  vypadá jako mlha, ne jako světlo. Stejná barva drží prstenec samolepky.
- **Světlý režim záměrně není.** Na světlém podkladu sklo nemá co matnit
  a vlajky přestanou svítit. Kdyby ho někdo chtěl, všechno jsou tokeny
  v `@theme`, takže je to práce na jednom bloku – ale je to změna identity,
  ne přepínač.
- **Pohyb střídmě:** přechod mezi obrazovkami (`PageTransition`), nástup
  panelů a nabídky po řadě (`stagger`), odhalení vlajky v otázce
  (`animate-flag-reveal`), přejezd světla po správné odpovědi, roztřesení po
  chybě, pulz hala u zlaté vlajky a napočítání výsledku (`useCountUp`).
  Všechno respektuje `prefers-reduced-motion`.
- **Líné načítání:** `FlagImage` má `loading="lazy"` všude kromě vlajek
  v otázce (`priority`). Album má navíc `content-visibility: auto`, takže
  z 197 dlaždic se opravdu načte jen to, co je vidět (ověřeno: 36).

## Rozvržení na mobilu

Obrazovka kvízu má **pevnou výšku a roluje se jen obsah pod hlavičkou**
(`QuizShell`). Dřív byla hlavička `sticky` nad rolující se stránkou a na
iPhonu se přes ni po pár pixelech posunu schoval nadpis otázky.

- **systémové lišty se řeší jednou na `body`** (`padding` z `env(safe-area-inset-*)`),
  ne v každé obrazovce zvlášť; obrazovky přes celou výšku používají token
  `--safe-height`
- výška je v **`svh`**, ne `dvh` – jinak se rozvržení přepočítá, když vyjede
  klávesnice, a obraz „poskočí“
- `main` je sám sloupcový flex; procentní výška by v rolovacím kontejneru
  nefungovala
- **vstupy mají minimálně 16 px** (pravidlo ve vrstvě `base`), jinak Safari
  na iPhonu při zaostření stránku přizoomuje
- po zaostření vstupu se pole odroluje na střed, až když klávesnice vyjede
- dvě rozvržení otázky: je-li v ní vlajka, drží střed a odpovědi jsou dole
  u palce; když v ní vlajka není, tvoří zadání a nabídka jednu skupinu
  uprostřed
- **nabídka je vždy 2×2**: medián českého názvu má 8 znaků a 90 % se vejde
  do 16, takže sloupec pod sebou plýtval šířkou. Mřížka navíc zkracuje oční
  dráhu, což se při bodování za rychlost počítá.

## Gamifikace

Osmiletý tester zná skoro všechny vlajky, takže kvíz se čtyřmi možnostmi
pro něj neměl žádné napětí – doslova řekl, že je to „jak kvíz na Seznamu“.
Řešením nebylo přilepit body na nudnou smyčku, ale **změnit, o co se hraje**.

- **Body = správnost × rychlost × série.** Pod 1,5 s je trojnásobek, série
  přidá až 3×. Znalost sama o sobě přestala stačit. Viz `game/score.ts`.
- **Vlajka po termínu vynáší víc** (`DUE_BONUS`). Zábava a učení tak táhnou
  stejným směrem místo aby si konkurovaly – to je záměrně jádro návrhu.
- **Životy** v Maratonu (3) a v Souboji (1); `livesFor()` v `quiz/modes.ts`.
- **Denní výzva** je seedovaná datem, takže všichni mají stejných 10 vlajek
  a výsledek se dá poslat – **bez serveru**. Viz `game/daily.ts`.
- **Souboje** vznikají ze skupin zaměnitelných vlajek, které už v datech
  byly kvůli distraktorům. Jméno se skládá ze zemí, nic se nevymýšlí.
- **Mise** jsou tři na den, seedované datem, počítají se z dnešního logu.
- **Hodnosti** rostou z bodů, které se nikdy neodečítají.
- **Odemykání** (rámečky, témata) mění jen vzhled, nikdy hru.
- **Zvuky** se generují ve Web Audio, žádné soubory – drží to pravidlo
  o nulových externích požadavcích a nezvětšuje offline cache.

## Konvence

- **Texty:** žádný český řetězec v komponentách – všechno přes `cs` z `src/i18n/cs.ts`.
  Hlídá to test.
- **Název aplikace** je placeholder v `src/config/app.ts` (`APP_NAME`), syn ho
  teprve vymyslí. Nikde jinde se nepíše natvrdo.
- **Fakta o vlajkách:** raději prázdné než vymyšlené. Když si nejsme jistí,
  `funFact` se vynechá a záznam se objeví v REVIEW.md. Teď chybí u 23 vlajek,
  skoro samá závislá území.
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

**Zastaralé vlajky se opravují přes `data/flags-override/`.** Hlavní balíček
`svg-country-flags` se od roku 2021 neaktualizuje, takže u zemí, které si
mezitím vlajku změnily, má přednost soubor z téhle složky. Generuje je
`scripts/make-overrides.ts`: pole vlajky (pruhy, kříž) se nakreslí ve
skutečném poměru stran a složitý znak se přenese z udržovaného `flag-icons`
rovnoměrným zvětšením kolem středu – znak je kruhový a vztažený k výšce,
takže se tím nedeformuje. Výsledky jsou v repozitáři, build tedy nepotřebuje
síť. Opravené: **Sýrie** (2024), **Kyrgyzstán** (2023), **Dominika**.

**Vnořený `<svg>` se při buildu zplošťuje do `<g>`.** `transform` na elementu
`<svg>` je až SVG 2 a Safari ho ignoruje – znak se pak vykreslí jinde a jinak
velký než v Chromu. Přesně tím trpělo Slovinsko. `scripts/copy-flags.ts`
spočítá odpovídající transformaci z `viewBox` (včetně výchozího
`preserveAspectRatio`) a zapíše ji na `<g>`. Když narazí na vnořený `<svg>`,
který přepsat nejde, **skončí chybou** – radši hlasitě spadnout než tiše vydat
rozbitou vlajku. Hlídá to i test v `tests/data.test.ts`.

**„Kongo“ se neuznává ani jedné zemi.** Je to v češtině dvojznačné slovo,
takže odpověď dostane výsledek `ambiguous`: nepočítá se jako chyba, jen se
aplikace doptá, která země to má být. Viz `AMBIGUOUS_ANSWERS` v `match.ts`.

**Hlavní město = to úřední.** Bez ohledu na to, které město je větší nebo kde
sídlí vláda. Proto Srí Džajavardanapura Kotte, ne Kolombo.

**Zlato nejde proklikat.** Nejvyšší úroveň zvládnutí vyžaduje aspoň jednu
správnou odpověď v režimu Napiš. Ze čtyř možností se dá trefit náhodou.

**Rozřazovací test neplýtvá.** Rychlá správná odpověď kartu odloží daleko do
budoucna, špatná odpověď ji nechá novou (netrestá se neznalost toho, co se
dítě ještě neučilo).

**Jiná existující země nikdy neprojde jako překlep.** „Nigérie“ při otázce na
Niger je chyba, ne překlep – i kdyby byla vzdálenost malá. Viz `match.ts`.

## Co čeká na kontrolu

`REVIEW.md` (generovaný) má **jednu** otevřenou otázku: **Afghánistán**.
Aplikace ukazuje vlajku Islámské republiky (do roku 2021). Dnešní bílou vlajku
s vyznáním víry nemá žádný dostupný balíček a arabská kaligrafie se nedá
poctivě nakreslit zpaměti. Až se SVG sežene, stačí ho uložit jako
`data/flags-override/af.svg` a spustit `npm run data`.
