# CLAUDE.md

Webová aplikace na učení vlajek světa. Česky, bez reklam, pro osmiletého
testera, který už vlajky umí hodně dobře.

## Stav fází

| Fáze | Stav | Co obsahuje |
|---|---|---|
| **1 – MVP** | ✅ hotovo | 5 režimů, album, mapa, rozřazovací test, FSRS, PWA offline |
| **1b – gamifikace** | ✅ hotovo | body a kombo, 4 nové režimy, denní výzva, mise, hodnosti, souboje, odemykání, zvuky |
| **1c – učení** | ✅ hotovo | krátký rozřazovací test, přehled „Jak ti to jde“, režim Slabiny, klávesnice, obrazovky pro chyby |
| **1d – tři osy** | ✅ hotovo | rozdíly podobných vlajek, Hlavní města, Kde to je (mapa), přehled záměn, graf sbírky, hledání v albu |
| **1e – turnaj** | ✅ hotovo | hra více hráčů na jednom zařízení, stejné otázky pro všechny, pořadí podle vyhraných kol |
| **1f – Roztřiď** | ✅ hotovo | pět vlajek najednou na světadíly tažením prstu, názvy až ve vyhodnocení |
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
| `data/differences.ts` | **ruční** věty „čím se ty dvě vlajky liší“ (107 dvojic) |
| `data/countries.json` | GENEROVANÉ – needitovat |
| `scripts/build-countries.ts` | sloučení + validace dat |
| `scripts/flag-source.ts` | jediné místo, kde se řeší zdroj SVG |
| `data/flags-override/` | ručně opravené vlajky – mají přednost před balíčkem |
| `scripts/make-overrides.ts` | generátor těch oprav (spouští se ručně) |
| `src/domain/answer/match.ts` | vyhodnocení napsané odpovědi |
| `src/domain/quiz/` | distraktory, režimy, sestavení hry, vzdálenosti pro mapu |
| `src/domain/srs/` | FSRS, úrovně zvládnutí, rozřazovací vzorek, přehled slabin |
| `src/domain/game/` | body, hodnosti, souboje, denní výzva, mise, odemykání, „co hrát teď“ |
| `src/store/ProgressStore.ts` | rozhraní úložiště (fáze 2 = nová implementace) |
| `src/i18n/cs.ts` | **všechny** texty rozhraní |
| `src/config/app.ts` | název aplikace, složení sady, prahy |
| `src/quiz/useActivePool.ts` | co se zrovna hraje: sada × část světa |
| `src/components/map/geometry.ts` | geometrie světové mapy – jedna projekce pro album, kvíz i detail |

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

## Učení

Gamifikace dává důvod hrát, tahle vrstva dává důvod se něco naučit.

- **Rozřazovací test je vzorek, ne inventura.** 24 otázek napříč pásmy
  obtížnosti místo všech 197 vlajek po dvacítkách. Z výsledku se odhadne
  zbytek pásma (`estimateKnown`) a nové vlajky se pak berou od pásma, které
  šlo nejhůř (`bandSkill` → `buildSession`). Odhad nic netvrdí: na každou
  vlajku se hra stejně zeptá, mění se jen pořadí. Pásmo, na které se test
  nezeptal, zůstává prázdné – dosazovat za něj číslo by bylo vymýšlení.
- **Plánovač je vidět.** Obrazovka „Jak ti to jde“ (`/prehled`) ukazuje
  slabiny (deset vlajek s největším podílem chyb) a „Brzy vyprchá“ – vlajky,
  u kterých do tří dnů spadne pravděpodobnost vybavení pod 80 %. Číslo se
  bere rovnou z FSRS (`get_retrievability`), ne z vlastního vzorce, jinak by
  se přehled rozcházel s tím, co plánovač doopravdy dělá.
- **Režim Slabiny** hraje přesně těch deset vlajek, ignoruje část světa
  (stejně jako opakování) a střídá směr otázky.
- **„Co teď“** (`game/nextUp.ts`) je jedno velké tlačítko na domovské:
  test → denní výzva → co je po termínu → slabiny → klasika. Denní výzva je
  před opakováním schválně – po půlnoci je nenávratně pryč.
- **Po kole je vidět, co uteklo** – dvanáct vlajek, klepnutím se otevře
  detail. Zbytek patří do přehledu slabin.
- **Po chybě je vidět, čím se ty dvě vlajky liší.** Ukázat správnou vlajku
  samo o sobě neřekne, jak ji příště poznat. `data/differences.ts` má větu
  ke každé ze 107 zaměnitelných dvojic, build i test hlídají, že žádná
  nechybí a že neodkazuje na dvojici mimo `similar.ts`. Celá tabulka je
  v REVIEW.md ke kontrole. Chybějící věta = neukáže se nic, nevymýšlí se.
- **S čím si to pleteš.** Do logu se ukládá i špatná odpověď (`given`),
  takže přehled umí říct „Niger sis 4× dal jako Nigérii“ a rovnou k tomu
  přidat větu o rozdílu.
- **Graf sbírky.** Z logu se historie vyčíst nedá (strop 500 odpovědí),
  proto se po každé odpovědi ukládá denní snímek (`meta.history`, 120 dní).
  Nasbírané a zlaté jsou dva grafy pod sebou, ne dvě čáry v jednom – zlaté
  jsou podmnožina nasbíraných, rozdíl mezi čarami by nic neznamenal. Dny
  bez hraní přenášejí poslední hodnotu; sbírka se sama nezmenšuje.

## Tři osy znalosti

Vlajka sama je jen jedna otázka. Data v `countries.json` unesou tři.

| Osa | Režim | Co je v otázce |
|---|---|---|
| vlajka → země | Klasika, Opačně, Napiš, Dvojčata… | vlajka nebo název |
| vlajka → hlavní město | Hlavní města | vlajka i název města (oba směry) |
| vlajka → místo na světě | Kde to je | vlajka a čtyři špendlíky na mapě |
| vlajka → světadíl | Roztřiď | pět vlajek naráz, mapa se zónami |

**Hlavní města ani mapa nehýbou plánovačem vlajek** (`touchesScheduler`).
Vlajka je v obou případech v otázce vidět, takže správná odpověď není důkaz,
že ji dítě pozná, a špatná není důkaz opaku. Body, mise i hodnost se počítají
normálně – jen karta vlajky zůstane, kde byla. Proto se u těchhle otázek
neukazuje ani odznak úrovně: tvrdil by změnu, která se nestala.

**Na mapě rozhoduje vzdálenost, ne podobnost vlajek.** Klepat přímo do obrysů
zemí by na telefonu nešlo (Lucembursko má na světové mapě pár pixelů), takže
se nabídnou čtyři špendlíky vzdálené od sebe aspoň 15° (`MIN_SEPARATION`).
Začátečník dostane body rozházené po světě, pokročilý sousední země.

**Roztřiď je jiný tvar hry, proto má vlastní obrazovku.** Neptá se po jedné
otázce – rozdělí se celá sada pěti vlajek a **název země se ukáže až ve
vyhodnocení**. Dokud se třídí, jsou na obrazovce jen vlajky, takže se nedá
jet po jménech („Chile zní jihoamericky“) a musí se poznat vlajka. Nápad je
osmiletého testera.

- Rozhodnutí, jestli jde o Roztřiď, padá v `QuizScreen` (rozcestník na
  `SortScreen`). Díky tomu **funguje v turnaji úplně stejně** jako ostatní
  režimy a turnaj o něm nemusí vědět nic.
- **Ovládá se dvěma způsoby schválně**: tažením prstu i klepnutím na vlajku
  a pak na světadíl. Tažení je zábavnější, klepání spolehlivější – a na malé
  Evropě je ten rozdíl znát.
- **Nabízí se vždy všech šest světadílů** (`SORT_ZONES`). Nejdřív se
  ukazovaly jen ty, které sada potřebovala, doplněné na čtyři – jenže
  doplňovalo se od začátku seznamu, takže Evropa, Asie, Afrika a Severní
  Amerika byly výplň, kdežto Oceánie a Jižní Amerika nikdy. Objevit se
  Oceánie, byla to nápověda. Šest zón pokaždé neprozradí nic a mapa navíc
  vypadá stejně každou sadu, takže se z ní dá naučit i zeměpis.
- **O trefě rozhoduje vzdálenost ke středu světadílu, ne zásah do terče.**
  Na telefonu má mapa třetinovou šířku a přesné terče by byly pod 30 px.
  Mimo mapu nebo uprostřed oceánu daleko od všeho se vlajka nepustí.
- **Ignoruje vybranou část světa.** Kdyby se hrála jen Evropa, byly by
  všechny vlajky z jednoho světadílu a nebylo by co třídit.
- Jako hlavní města a mapa **nehýbe plánovačem vlajek** – ptá se na zeměpis
  a vlajka je vidět. Sada, ve které sedí všech pět, dává bonus
  (`SORT_PERFECT_BONUS`).

**Plynulé kolo.** V závodních režimech (`RACE_MODES`) se po správné odpovědi
jede dál samo po 1,4 s. Jinde ne: v klasice a opakování má dítě číst
zajímavost a rozdíl. Po chybě nikdy – tam se to „jak je rozeznáš“ dozví.

## Turnaj u jednoho zařízení

Rodina má na dovolené jeden tablet, ne pět. Turnaj (`/turnaj`) se proto hraje
po sobě: kolo si vylosuje seznam vlajek a **každý hráč dostane přesně ten
samý** – jinak by se výsledky nedaly porovnat.

- **Stejné musí být i nabídky pod otázkou**, ne jen seznam vlajek. Semínko
  generátoru se proto odvozuje od kola (`seedFromString(codesKey)`), ne
  z času, a obtížnost distraktorů je pevná (`silver`) místo podle toho, jak
  vlajku umí majitel zařízení.
- **Turnaj se nepočítá nikam** (`offTheRecord`): ani do plánovače, ani do
  logu, bodů, rekordů, série dní a hodnosti. Hraje na tom i táta a babička,
  takže by to jinak rozhodilo synovo učení. Ověřeno: postup před turnajem
  a po něm je bajt po bajtu stejný.
- **Stav turnaje žije v úložišti** (`meta.party`), ne jen v paměti obrazovky –
  tablet se uspí nebo se omylem zavře karta a nikdo nechce přijít o odehraná
  kola.
- **Předávání zařízení má mezikrok.** Kdyby hra naskočila hned, další hráč by
  viděl konec toho předchozího.
- **V pořadí rozhodují vyhraná kola, až při shodě body** – jinak by jedno
  vydařené kolo přebilo tři těsně vyhraná. Shoda bodů dělí první místo,
  nerozhoduje se mincí.
- Turnaj respektuje vybranou **část světa** a dá se hrát v osmi režimech
  (`PARTY_MODES`). Chybí schválně opakování a slabiny (jedou podle paměti
  majitele), denní výzva (je jedna na den), souboj (potřebuje dvojici)
  a maraton (nemá konec).

## Konvence

- **Texty:** žádný český řetězec v komponentách – všechno přes `cs` z `src/i18n/cs.ts`.
  Hlídá to test.
- **Název aplikace** je placeholder v `src/config/app.ts` (`APP_NAME`), syn ho
  teprve vymyslí. Nikde jinde se nepíše natvrdo.
- **Fakta o vlajkách:** raději prázdné než vymyšlené. Když si nejsme jistí,
  `funFact` se vynechá a záznam se objeví v REVIEW.md. Teď má fakt **každá**
  vlajka; ta poslední dvacítka (závislá území) vznikla dohledáním ze zdrojů,
  ne z hlavy, takže stojí za kontrolu v REVIEW.md.
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

**Afghánistán ukazuje vlajku do roku 2021, a je to vědomá volba.** Dnešní
bílou vlajku s vyznáním víry nemá žádný dostupný balíček a kaligrafii nelze
poctivě nakreslit zpaměti. Zastaralá vlajka je pořád lepší než žádná, takže
záznam v datech zůstává a poznámka v REVIEW.md je `ROZHODNUTO`, ne otevřená
otázka.

**Vynechává se jen to, co by udělalo otázku bez správné odpovědi.** Takový
záznam patří i s důvodem do `OMITTED` (`src/config/app.ts`); build kontroluje,
že v datech opravdu není a o kolik se tím snižuje počet členů OSN, a REVIEW.md
ho vypisuje – aby se nemohlo stát, že nějaký zmizí omylem.

- **Severní Irsko** (sada Území má proto 30 záznamů): od roku 1972 nemá
  vlastní úřední vlajku, používá se tam Union Jack – balíček proto dodával
  **bajt po bajtu tentýž soubor** jako pro Spojené království a otázka „která
  země to je“ neměla jedinou správnou odpověď. Ulsterský prapor je vlajka
  zrušené vlády, ne země. Že se žádné dvě vlajky neshodují, hlídá od té doby
  test v `tests/data.test.ts`.

**„Kongo“ se neuznává ani jedné zemi.** Je to v češtině dvojznačné slovo,
takže odpověď dostane výsledek `ambiguous`: nepočítá se jako chyba, jen se
aplikace doptá, která země to má být. Viz `AMBIGUOUS_ANSWERS` v `match.ts`.

**Svazijsko, ne Eswatini.** Král zemi v roce 2018 přejmenoval, ale Eswatini
je jméno anglické a svazijské – **český název se tím nezměnil**. Názvoslovná
komise ČÚZK, ministerstvo zahraničí i česká Wikipedie dál píšou Svazijsko,
takže to je `nameCs`; Eswatini je alias, takže se uzná jako odpověď. Obecně:
`nameCs` je vždycky český název podle českých zdrojů, ne přepis toho, jak si
země říká sama. Hlídá to test v `tests/data.test.ts`.

**Hlavní město = to úřední.** Bez ohledu na to, které město je větší nebo kde
sídlí vláda. Proto Srí Džajavardanapura Kotte, ne Kolombo.

**Zlato nejde proklikat.** Nejvyšší úroveň zvládnutí vyžaduje aspoň jednu
správnou odpověď v režimu Napiš. Ze čtyř možností se dá trefit náhodou –
a klepnutí na našeptávač je taky výběr ze seznamu, ne napsaný název, takže
se do `typedCorrect` nepočítá (`assisted` v `AnswerInput`).

**Měřený čas se zastaví, když dítě odejde jinam.** Body i hodnocení FSRS
stojí na rychlosti odpovědi, takže přepnutí karty uprostřed otázky by z ní
udělalo „pomalou“. `useQuizSession` odečítá čas mimo aplikaci
(`visibilitychange`) a `clampElapsed` navíc drží strop na minutě.

**Maraton míchá pořadí uvnitř pásem obtížnosti.** Pořád začíná od
nejznámějších, ale ne pokaždé stejnou dvacítkou. Pásma zůstávají, takže
rekordy z různých běhů jdou dál srovnat.

**Vabank se sází naslepo.** Vlajka se odhalí až po sázce – jinak by dítě
vsadilo tři jen tam, kde odpověď zná, a o nic by nešlo.

**Rozřazovací test neplýtvá.** Rychlá správná odpověď kartu odloží daleko do
budoucna, špatná odpověď ji nechá novou (netrestá se neznalost toho, co se
dítě ještě neučilo).

**Jiná existující země nikdy neprojde jako překlep.** „Nigérie“ při otázce na
Niger je chyba, ne překlep – i kdyby byla vzdálenost malá. Viz `match.ts`.

## Co čeká na kontrolu

`REVIEW.md` (generovaný) nemá otevřenou otázku. Za přečtení stojí tabulka
**„Čím se zaměnitelné vlajky liší“** (107 vět) – je to to nejdůležitější,
co se z aplikace dá naučit.
