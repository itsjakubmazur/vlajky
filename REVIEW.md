# REVIEW – kontrola dat

> Tenhle soubor je **generovaný** (`npm run data`). Opravy piš do `data/cs/*.ts`, ne sem.

## Co je potřeba zkontrolovat

1. **České názvy zemí** – jestli sedí s tím, jak se to říká/píše u nás.
2. **Hlavní města** – hlavně tam, kde je víc možností (viz otevřené otázky níž).
3. **Zajímavosti o vlajkách** – jestli jsou pravdivé a srozumitelné pro osmiletého.
4. **Aliasy** – co všechno se má uznat jako správná odpověď.

Co je potřeba opravit, napiš k tomu poznámku – projdu to a přepíšu ve zdrojových datech.

## Přehled

- Zdroj vlajek: svg-country-flags (public domain, zdroj Wikipedia)
- Států v sadě „Svět“: **197** (193 členů OSN + Vatikán, Palestina, Kosovo, Tchaj-wan)
- Území v bonusové sadě: **30**
- Zajímavost o vlajce chybí u **0** záznamů
- Otevřených otázek k rozhodnutí: **0**

### Co NENÍ ověřené

- **Souřadnice (`lat`, `lng`)** jsou přibližné středy zemí. Slouží k obarvení mapy a později k nápovědě „směr + vzdálenost“. Na metry přesné nejsou a být nemusí.
- **Obtížnost 1–5** je odhad (jak je vlajka podobná jiným + jak je země známá), ne měřený údaj. Až bude dost odehraných odpovědí, dá se nahradit reálnými daty.
- **Poměr stran** je odečtený z `viewBox` zdrojového SVG, takže odpovídá tomu, co zdroj kreslí – ne nutně tomu, co je v zákoně dané země.

## Otevřené otázky

_Žádné._

## Rozhodnutá sporná místa

Tady už je rozhodnuto, zapsané jen pro paměť.

- **Afghánistán** (`af`) – ukazujeme černo-červeno-zelenou vlajku Islámské republiky, platnou do roku 2021. Dnešní bílou vlajku s vyznáním víry nemá žádný dostupný balíček a kaligrafii nelze poctivě nakreslit zpaměti – tohle je vědomá volba, ne otevřená otázka.
- **Konžská republika** (`cg`) – samotné „Kongo“ neuznáváme ani jedné zemi – aplikace se doptá, která to má být.
- **Kypr** (`cy`) – zeměpisně leží v Asii, politicky patří k Evropě (EU). Vedeme ho v Evropě.
- **Západní Sahara** (`eh`) – sporné území, je jen v bonusové sadě.
- **Spojené království** (`gb`) – Anglie záměrně není alias, je to samostatná vlajka v bonusové sadě.
- **Mexiko** (`mx`) – hlavní město se česky píše různě, vybráno Mexico City.
- **Rusko** (`ru`) – zeměpisný střed leží na Sibiři, vedeme ho v Evropě podle zvyklosti.
- **Turecko** (`tr`) – leží v Asii i v Evropě, vedeme ho v Asii.

## Schválně vynechané záznamy

Vlajku, kterou nemáme jak ukázat správně, je lepší neukazovat vůbec.
Až bude po ruce poctivé SVG, stačí záznam vrátit do `data/cs/*.ts`.

- `gb-nir` – Severní Irsko – od roku 1972 nemá vlastní úřední vlajku, používá se tam Union Jack. Balíček proto dodává tentýž soubor jako pro Spojené království a otázka „která země to je“ by neměla jedinou správnou odpověď. Ulsterský prapor je vlajka zrušené vlády, ne země.

## Chybějící zajímavosti

U těchhle vlajek jsem nenašel fakt, za který bych ručil. Radši prázdné než vymyšlené –
když něco víš, doplníme. Aplikace funguje i bez nich (ukáže se jen velká vlajka).

_Žádné._

## Evropa (46)

| Kód | Český název | Úřední název | Aliasy | Hlavní město | Obtížnost | Poměr | Zajímavost o vlajce |
|---|---|---|---|---|---|---|---|
| `al` | **Albánie** | – | – | Tirana | 3 | 1.40:1 | Na albánské vlajce je černý dvouhlavý orel. |
| `ad` | **Andorra** | – | – | Andorra la Vella | 4 | 1.43:1 | Ve znaku uprostřed andorrské vlajky jsou dvě červené krávy. |
| `be` | **Belgie** | Belgické království | – | Brusel | 2 | 1.15:1 | Belgická vlajka je skoro čtvercová – je jen o kousek širší, než vyšší. |
| `by` | **Bělorusko** | Běloruská republika | – | Minsk | 3 | 2.00:1 | U žerdi má běloruská vlajka červený vzor převzatý z lidové výšivky. |
| `ba` | **Bosna a Hercegovina** | – | Bosna | Sarajevo | 3 | 2.00:1 | Hvězdy na vlajce Bosny a Hercegoviny jsou na krajích useknuté, jako by jich byla nekonečná řada. |
| `bg` | **Bulharsko** | Bulharská republika | – | Sofie | 2 | 1.67:1 | Bulharská vlajka vychází z ruské trikolóry, jen modrý pruh v ní nahradila zelená. |
| `me` | **Černá Hora** | – | – | Podgorica | 4 | 2.00:1 | Černohorská vlajka má zlatý okraj a uprostřed zlatého dvouhlavého orla. |
| `cz` | **Česko** | Česká republika | Česká republika, ČR | Praha | 1 | 1.50:1 | Modrý klín se k bílo-červené vlajce přidal až v roce 1920. |
| `dk` | **Dánsko** | Dánské království | – | Kodaň | 2 | 1.32:1 | Dánská vlajka Dannebrog je nejstarší státní vlajka, která se dodnes používá. |
| `ee` | **Estonsko** | Estonská republika | – | Tallinn | 3 | 1.57:1 | Modrou, černou a bílou si v roce 1881 zvolil spolek estonských studentů. |
| `fi` | **Finsko** | Finská republika | – | Helsinky | 2 | 1.64:1 | Modrá na finské vlajce znamená tisíce finských jezer a bílá sníh. |
| `fr` | **Francie** | Francouzská republika | – | Paříž | 1 | 1.50:1 | Modrá a červená jsou barvy Paříže, bílá byla barva francouzských králů. |
| `hr` | **Chorvatsko** | Chorvatská republika | – | Záhřeb | 2 | 2.00:1 | Uprostřed chorvatské vlajky je červeno-bílá šachovnice, které se říká šahovnica. |
| `ie` | **Irsko** | – | – | Dublin | 2 | 2.00:1 | Bílý pruh uprostřed irské vlajky znamená mír mezi zelenými katolíky a oranžovými protestanty. |
| `is` | **Island** | Islandská republika | – | Reykjavík | 3 | 1.39:1 | Islandská vlajka má stejný tvar jako norská, jen s prohozenou modrou a červenou. |
| `it` | **Itálie** | Italská republika | – | Řím | 1 | 1.50:1 | Italská i irská vlajka mají u žerdi zelenou – italská má ale jako třetí barvu červenou, irská oranžovou. |
| `xk` | **Kosovo** | Republika Kosovo | – | Priština | 4 | 1.40:1 | Na kosovské vlajce je obrys země a nad ním šest hvězd. |
| `cy` | **Kypr** | Kyperská republika | – | Nikósie | 4 | 1.50:1 | Kypr má na vlajce nakreslený obrys vlastního ostrova – to má na světě jen pár zemí. |
| `li` | **Lichtenštejnsko** | Lichtenštejnské knížectví | – | Vaduz | 4 | 1.67:1 | Zlatá koruna se na vlajku přidala až poté, co se na olympiádě v roce 1936 ukázalo, že Lichtenštejnsko má stejnou vlajku jako Haiti. |
| `lt` | **Litva** | Litevská republika | – | Vilnius | 3 | 1.67:1 | Žlutá na litevské vlajce znamená slunce, zelená lesy a červená odvahu. |
| `lv` | **Lotyšsko** | Lotyšská republika | – | Riga | 3 | 2.00:1 | Lotyšská vlajka má tak tmavou červenou, že se jí říká lotyšská červeň. |
| `lu` | **Lucembursko** | Lucemburské velkovévodství | – | Lucemburk | 4 | 1.67:1 | Lucemburská vlajka se od nizozemské liší světlejším modrým pruhem. |
| `hu` | **Maďarsko** | – | – | Budapešť | 2 | 2.00:1 | Maďarská vlajka má stejné barvy jako italská, jen pruhy leží vodorovně. |
| `mt` | **Malta** | Maltská republika | – | Valletta | 4 | 1.50:1 | V rohu maltské vlajky je Jiřího kříž, britské vyznamenání za statečnost z druhé světové války. |
| `md` | **Moldavsko** | Moldavská republika | – | Kišiněv | 4 | 2.00:1 | Ve znaku uprostřed moldavské vlajky je hlava zubra. |
| `mc` | **Monako** | Monacké knížectví | – | Monako | 4 | 1.25:1 | Monacká vlajka vypadá jako indonéská, je ale skoro čtvercová. |
| `de` | **Německo** | Spolková republika Německo | SRN | Berlín | 1 | 1.67:1 | Černá, červená a zlatá se v Německu používají jako národní barvy už od 19. století. |
| `nl` | **Nizozemsko** | Nizozemské království | Holandsko | Amsterdam | 2 | 1.50:1 | Nizozemská vlajka měla původně místo červeného pruhu oranžový. |
| `no` | **Norsko** | Norské království | – | Oslo | 2 | 1.38:1 | Norská vlajka vznikla z dánské tím, že do bílého kříže přidali ještě modrý. |
| `pl` | **Polsko** | Polská republika | – | Varšava | 1 | 1.60:1 | Polská vlajka má bílou nahoře – přesně obráceně než monacká a indonéská. |
| `pt` | **Portugalsko** | Portugalská republika | – | Lisabon | 2 | 1.50:1 | Na portugalské vlajce je armilární sféra, přístroj starých mořeplavců. |
| `at` | **Rakousko** | Rakouská republika | – | Vídeň | 2 | 1.50:1 | Červeno-bílo-červené pruhy patří k nejstarším vlajkovým vzorům v Evropě, používají se už od středověku. |
| `ro` | **Rumunsko** | – | – | Bukurešť | 2 | 1.50:1 | Rumunská vlajka se od čadské liší jen odstínem modré – rumunská ji má světlejší. |
| `ru` | **Rusko** | Ruská federace | – | Moskva | 1 | 1.50:1 | Ruskou trikolóru zavedl car Petr Veliký podle nizozemské vlajky. |
| `gr` | **Řecko** | Řecká republika | – | Atény | 2 | 1.50:1 | Devět pruhů na řecké vlajce odpovídá devíti slabikám hesla Svoboda, nebo smrt. |
| `sm` | **San Marino** | – | – | San Marino | 4 | 1.33:1 | Ve znaku San Marina jsou tři věže, které opravdu stojí na hoře Titano. |
| `mk` | **Severní Makedonie** | – | – | Skopje | 4 | 2.00:1 | Slunce na vlajce Severní Makedonie má osm paprsků, které sahají až k okrajům. |
| `sk` | **Slovensko** | Slovenská republika | SR | Bratislava | 2 | 1.50:1 | Slovenská vlajka má znak posunutý k žerdi, aby se nepletla s ruskou a slovinskou. |
| `si` | **Slovinsko** | Slovinská republika | – | Lublaň | 3 | 2.00:1 | Ve slovinském znaku je hora Triglav a pod ní dvě vlnky – moře a řeky. |
| `gb` | **Spojené království** | Spojené království Velké Británie a Severního Irska | Velká Británie, Británie, UK | Londýn | 1 | 2.00:1 | Union Jack vznikl složením tří křížů – anglického, skotského a irského. Wales v něm není. |
| `rs` | **Srbsko** | Srbská republika | – | Bělehrad | 3 | 1.50:1 | Srbská vlajka má stejné barvy jako ruská, ale v opačném pořadí. |
| `es` | **Španělsko** | Španělské království | – | Madrid | 1 | 1.50:1 | Ve španělském znaku jsou dva sloupy s nápisem Plus Ultra, tedy dál za obzor. |
| `se` | **Švédsko** | Švédské království | – | Stockholm | 2 | 1.60:1 | Švédská vlajka má stejný tvar kříže jako dánská, jen v modré a žluté. |
| `ch` | **Švýcarsko** | Švýcarská konfederace | – | Bern | 2 | 1.00:1 | Švýcarská vlajka je čtvercová – kromě vatikánské je jediná taková na světě. |
| `ua` | **Ukrajina** | – | – | Kyjev | 2 | 1.50:1 | Modrá na ukrajinské vlajce je nebe a žlutá lán obilí pod ním. |
| `va` | **Vatikán** | Městský stát Vatikán | – | Vatikán | 3 | 1.00:1 | Vatikánská vlajka je spolu se švýcarskou jediná čtvercová a jsou na ní zkřížené klíče. |

## Asie (48)

| Kód | Český název | Úřední název | Aliasy | Hlavní město | Obtížnost | Poměr | Zajímavost o vlajce |
|---|---|---|---|---|---|---|---|
| `af` | **Afghánistán** | Afghánská islámská republika | – | Kábul | 4 | 1.50:1 | Na afghánské vlajce je mešita s modlitební nikou a kazatelnou – budova, jakou na vlajce jinde nenajdeš. |
| `am` | **Arménie** | Arménská republika | – | Jerevan | 3 | 2.00:1 | Spodní pruh arménské vlajky se úředně popisuje jako meruňkový. |
| `az` | **Ázerbájdžán** | Ázerbájdžánská republika | – | Baku | 4 | 2.00:1 | Na ázerbájdžánské vlajce je půlměsíc a hvězda s osmi cípy. |
| `bh` | **Bahrajn** | Bahrajnské království | – | Manáma | 4 | 1.67:1 | Bílou a červenou odděluje na bahrajnské vlajce pět zubů – jeden za každý pilíř islámu. |
| `bd` | **Bangladéš** | Bangladéšská lidová republika | – | Dháka | 3 | 1.67:1 | Červený kruh je posunutý kousek k žerdi, aby při vlání vypadal přesně uprostřed. |
| `bt` | **Bhútán** | Bhútánské království | – | Thimphú | 3 | 1.50:1 | Na bhútánské vlajce je bílý drak, který v tlapách svírá klenoty. |
| `bn` | **Brunej** | Brunej Darussalam | – | Bandar Seri Begawan | 5 | 2.00:1 | Žlutá je v Bruneji barva sultána. |
| `cn` | **Čína** | Čínská lidová republika | ČLR | Peking | 1 | 1.50:1 | Velká hvězda na čínské vlajce znamená komunistickou stranu a čtyři malé lid. |
| `ph` | **Filipíny** | Filipínská republika | – | Manila | 3 | 2.00:1 | Za války se filipínská vlajka otáčí vzhůru nohama, aby byla nahoře červená. |
| `ge` | **Gruzie** | – | – | Tbilisi | 4 | 1.50:1 | Na gruzínské vlajce je pět křížů – jeden velký a čtyři malé v rozích. |
| `in` | **Indie** | Indická republika | – | Nové Dillí | 1 | 1.50:1 | Uprostřed indické vlajky je modré kolo s 24 paprsky, Ašókova čakra. |
| `id` | **Indonésie** | Indonéská republika | – | Jakarta | 2 | 1.50:1 | Indonéská vlajka je stejná jako monacká, jen je delší. |
| `iq` | **Irák** | Irácká republika | – | Bagdád | 3 | 1.50:1 | Uprostřed irácké vlajky je zeleným písmem nápis Alláh akbar. |
| `ir` | **Írán** | Íránská islámská republika | – | Teherán | 3 | 1.75:1 | Podél pruhů íránské vlajky je 22krát drobně napsané Alláh akbar. |
| `il` | **Izrael** | Stát Izrael | – | Jeruzalém | 2 | 1.38:1 | Modré pruhy na izraelské vlajce připomínají modlitební šál talit. |
| `jp` | **Japonsko** | – | – | Tokio | 1 | 1.50:1 | Japonské vlajce se říká Hinomaru, což znamená sluneční kotouč. |
| `ye` | **Jemen** | Jemenská republika | – | Saná | 4 | 1.50:1 | Jemenská vlajka jsou jen tři pruhy – červený, bílý a černý, bez jakéhokoli znaku. |
| `kr` | **Jižní Korea** | Korejská republika | – | Soul | 2 | 1.50:1 | Uprostřed jihokorejské vlajky je červeno-modrý symbol jin a jang. |
| `jo` | **Jordánsko** | Jordánské hášimovské království | – | Ammán | 4 | 2.00:1 | Na červeném trojúhelníku jordánské vlajky je bílá sedmicípá hvězda – palestinská vlajka ji nemá. |
| `kh` | **Kambodža** | Kambodžské království | – | Phnompenh | 3 | 1.56:1 | Uprostřed kambodžské vlajky je chrám Angkor Vat. |
| `qa` | **Katar** | Stát Katar | – | Dauhá | 3 | 2.55:1 | Katarská vlajka je ze všech nejdelší – je skoro třikrát delší, než vysoká. |
| `kz` | **Kazachstán** | Republika Kazachstán | – | Astana | 3 | 2.00:1 | Na kazašské vlajce letí pod sluncem zlatý orel a u žerdi je národní vzor. |
| `kw` | **Kuvajt** | Stát Kuvajt | – | Kuvajt | 4 | 2.00:1 | U žerdi kuvajtské vlajky je černý lichoběžník, ne trojúhelník. |
| `kg` | **Kyrgyzstán** | Kyrgyzská republika | – | Biškek | 4 | 1.67:1 | Uvnitř slunce na kyrgyzské vlajce je pohled na střechu jurty. |
| `la` | **Laos** | Laoská lidově demokratická republika | – | Vientiane | 4 | 1.50:1 | Bílý kruh na laoské vlajce představuje měsíc nad řekou Mekong. |
| `lb` | **Libanon** | Libanonská republika | – | Bejrút | 3 | 1.50:1 | Uprostřed libanonské vlajky je cedr – žádná jiná země strom na vlajce nemá. |
| `my` | **Malajsie** | – | – | Kuala Lumpur | 3 | 2.00:1 | Malajsijská vlajka má 14 pruhů a hvězdu se 14 cípy za 13 států a hlavní město. |
| `mv` | **Maledivy** | Maledivská republika | – | Male | 4 | 1.50:1 | Maledivská vlajka má červený okraj, zelený obdélník a v něm bílý půlměsíc. |
| `mn` | **Mongolsko** | – | – | Ulánbátar | 3 | 2.00:1 | U žerdi mongolské vlajky je zlatý znak sojombo. |
| `mm` | **Myanmar** | Republika Myanmarský svaz | Barma | Neipyijto | 4 | 1.50:1 | Myanmar používá vlajku s velkou bílou hvězdou až od roku 2010. |
| `np` | **Nepál** | – | – | Káthmándú | 2 | 0.82:1 | Nepálská vlajka je jediná na světě, která není obdélník – jsou to dva trojúhelníky nad sebou. |
| `om` | **Omán** | Sultanát Omán | – | Maskat | 4 | 2.00:1 | Ve znaku ománské vlajky jsou dvě zkřížené šavle a zahnutá dýka chandžar. |
| `pk` | **Pákistán** | Pákistánská islámská republika | – | Islámábád | 2 | 1.50:1 | Bílý pruh u žerdi pákistánské vlajky patří nemuslimským menšinám. |
| `ps` | **Palestina** | Stát Palestina | – | Východní Jeruzalém | 4 | 2.00:1 | Palestinská vlajka vypadá jako jordánská, jen na červeném trojúhelníku nemá hvězdu. |
| `sa` | **Saúdská Arábie** | Království Saúdská Arábie | – | Rijád | 3 | 1.50:1 | Kvůli posvátnému nápisu se saúdská vlajka nikdy nespouští na půl žerdi. |
| `kp` | **Severní Korea** | Korejská lidově demokratická republika | KLDR | Pchjongjang | 3 | 2.00:1 | Na severokorejské vlajce je červená hvězda v bílém kruhu. |
| `sg` | **Singapur** | Singapurská republika | – | Singapur | 3 | 1.50:1 | Na singapurské vlajce je půlměsíc a pět hvězd srovnaných do kroužku. |
| `ae` | **Spojené arabské emiráty** | – | SAE, Emiráty | Abú Zabí | 3 | 2.00:1 | Červená, zelená, bílá a černá jsou panarabské barvy, které má na vlajce víc arabských zemí. |
| `lk` | **Srí Lanka** | Srílanská demokratická socialistická republika | – | Srí Džajavardanapura Kotte | 4 | 2.00:1 | Na srílanské vlajce je lev s mečem a v rozích čtyři lístky fíkovníku. |
| `sy` | **Sýrie** | Syrská arabská republika | – | Damašek | 3 | 1.50:1 | Sýrie má od konce roku 2024 zeleno-bílo-černou vlajku se třemi červenými hvězdami; předtím měla červeno-bílo-černou se dvěma zelenými. |
| `tj` | **Tádžikistán** | Republika Tádžikistán | – | Dušanbe | 5 | 2.00:1 | Uprostřed tádžické vlajky je koruna se sedmi hvězdami. |
| `th` | **Thajsko** | Thajské království | – | Bangkok | 2 | 1.50:1 | Thajská vlajka má pět pruhů a prostřední modrý je dvakrát širší než ostatní. |
| `tw` | **Tchaj-wan** | Čínská republika | – | Tchaj-pej | 3 | 1.50:1 | V rohu tchajwanské vlajky je bílé slunce s dvanácti paprsky. |
| `tr` | **Turecko** | Turecká republika | Türkiye | Ankara | 1 | 1.50:1 | Půlměsíc s hvězdou z turecké vlajky převzala později řada dalších zemí. |
| `tm` | **Turkmenistán** | – | – | Ašchabad | 5 | 1.50:1 | U žerdi turkmenské vlajky je pruh s pěti kobercovými vzory – bývá označovaná za nejsložitější vlajku světa. |
| `uz` | **Uzbekistán** | Republika Uzbekistán | – | Taškent | 4 | 2.00:1 | Na uzbecké vlajce je půlměsíc a dvanáct hvězd. |
| `vn` | **Vietnam** | Vietnamská socialistická republika | – | Hanoj | 2 | 1.50:1 | Žlutá hvězda na vietnamské vlajce má pět cípů za pět skupin obyvatel. |
| `tl` | **Východní Timor** | Demokratická republika Východní Timor | Timor-Leste | Dili | 5 | 2.00:1 | Na vlajce Východního Timoru leží přes sebe dva trojúhelníky – žlutý a černý s bílou hvězdou. |

## Afrika (54)

| Kód | Český název | Úřední název | Aliasy | Hlavní město | Obtížnost | Poměr | Zajímavost o vlajce |
|---|---|---|---|---|---|---|---|
| `dz` | **Alžírsko** | Alžírská demokratická a lidová republika | – | Alžír | 3 | 1.50:1 | Na hranici zeleného a bílého pole alžírské vlajky je červený půlměsíc s hvězdou. |
| `ao` | **Angola** | Angolská republika | – | Luanda | 4 | 1.50:1 | Uprostřed angolské vlajky je mačeta a půlka ozubeného kola. |
| `bj` | **Benin** | Beninská republika | – | Porto-Novo | 4 | 1.50:1 | Benin má panafrické barvy poskládané jinak než sousedé – zelený pruh stojí nastojato u žerdi. |
| `bw` | **Botswana** | Botswanská republika | – | Gaborone | 4 | 1.50:1 | Modrá na botswanské vlajce znamená vodu a déšť – v zemi s pouští Kalahari je vzácný. |
| `bf` | **Burkina Faso** | – | – | Ouagadougou | 4 | 1.50:1 | Mezi červeným a zeleným pruhem vlajky Burkiny Faso svítí žlutá hvězda. |
| `bi` | **Burundi** | Burundská republika | – | Gitega | 5 | 1.67:1 | Uprostřed burundské vlajky jsou v bílém kruhu tři červené hvězdy. |
| `td` | **Čad** | Čadská republika | – | Ndžamena | 3 | 1.50:1 | Čadská vlajka se od rumunské liší jen tím, že má tmavší modrou. |
| `cd` | **Demokratická republika Kongo** | – | DR Kongo, DRK, Kongo-Kinshasa | Kinshasa | 4 | 1.33:1 | Modrou vlajku DR Kongo přetíná šikmý červený pruh se žlutým lemem a v rohu je žlutá hvězda. |
| `dj` | **Džibutsko** | Džibutská republika | – | Džibuti | 5 | 1.50:1 | Na džibutské vlajce je bílý trojúhelník s červenou hvězdou. |
| `eg` | **Egypt** | Egyptská arabská republika | – | Káhira | 2 | 1.50:1 | Uprostřed egyptské vlajky je zlatý Saladinův orel. |
| `er` | **Eritrea** | Stát Eritrea | – | Asmara | 5 | 2.00:1 | V červeném trojúhelníku eritrejské vlajky je zlatá olivová ratolest ve věnci. |
| `sz` | **Eswatini** | Království Eswatini | Svazijsko | Mbabane | 5 | 1.50:1 | Na vlajce Eswatini leží naležato válečný štít a dvě kopí. |
| `et` | **Etiopie** | Etiopská federativní demokratická republika | – | Addis Abeba | 3 | 2.00:1 | Etiopská zelená, žlutá a červená posloužila jako vzor vlajkám mnoha dalších afrických zemí. |
| `ga` | **Gabon** | Gabonská republika | – | Libreville | 4 | 1.33:1 | Žlutý pruh uprostřed gabonské vlajky připomíná rovník, který zemí prochází. |
| `gm` | **Gambie** | Gambijská republika | – | Banjul | 4 | 1.50:1 | Modrý pruh uprostřed gambijské vlajky je řeka Gambie, kolem které se celá země táhne. |
| `gh` | **Ghana** | Ghanská republika | – | Akkra | 3 | 1.50:1 | Ghana si jako první africká země po osamostatnění zvolila panafrické barvy a k nim černou hvězdu. |
| `gn` | **Guinea** | Guinejská republika | – | Konakry | 4 | 1.50:1 | Guinejská vlajka je jako malijská, jen má barvy v opačném pořadí. |
| `gw` | **Guinea-Bissau** | – | – | Bissau | 5 | 2.00:1 | Guinea-Bissau má u žerdi červený svislý pruh s černou hvězdou. |
| `za` | **Jihoafrická republika** | – | JAR, Jižní Afrika | Pretoria | 2 | 1.50:1 | Jihoafrická vlajka má šest barev – víc než kterákoli jiná státní vlajka. |
| `ss` | **Jižní Súdán** | Jihosúdánská republika | – | Džuba | 4 | 2.00:1 | Vlajka Jižního Súdánu má šest barev a v modrém trojúhelníku žlutou hvězdu. |
| `cm` | **Kamerun** | Kamerunská republika | – | Yaoundé | 3 | 1.50:1 | Kamerunská vlajka má hvězdu uprostřed žlutého svislého pruhu. |
| `cv` | **Kapverdy** | Kapverdská republika | Kapverdské ostrovy, Cabo Verde | Praia | 5 | 1.70:1 | Na kapverdské vlajce je kruh z deseti hvězd – jedna za každý ostrov. |
| `ke` | **Keňa** | Keňská republika | – | Nairobi | 3 | 1.50:1 | Uprostřed keňské vlajky je masajský štít a dvě zkřížená kopí. |
| `km` | **Komory** | Komorský svaz | – | Moroni | 5 | 1.67:1 | Čtyři hvězdy na komorské vlajce jsou čtyři ostrovy souostroví. |
| `cg` | **Konžská republika** | – | Kongo-Brazzaville | Brazzaville | 4 | 1.50:1 | Vlajku Konžské republiky dělí šikmý žlutý pruh mezi zelenou a červenou. |
| `ls` | **Lesotho** | Lesothské království | – | Maseru | 5 | 1.50:1 | Uprostřed vlajky Lesotha je černý slaměný klobouk mokorotlo. |
| `lr` | **Libérie** | Liberijská republika | – | Monrovia | 4 | 1.90:1 | Libérijská vlajka vypadá jako americká, má ale jen jedenáct pruhů a jedinou hvězdu. |
| `ly` | **Libye** | Stát Libye | – | Tripolis | 4 | 2.00:1 | Libye měla v letech 1977 až 2011 celou vlajku jednolitě zelenou, bez jediného znaku. |
| `mg` | **Madagaskar** | Madagaskarská republika | – | Antananarivo | 4 | 1.50:1 | Madagaskarská vlajka má bílý pruh nastojato u žerdi a vedle něj červený a zelený. |
| `mw` | **Malawi** | Malawiská republika | – | Lilongwe | 5 | 1.50:1 | V černém pruhu malawijské vlajky vychází rudé slunce. |
| `ml` | **Mali** | Republika Mali | – | Bamako | 4 | 1.50:1 | Malijská vlajka má u žerdi zelenou, guinejská červenou – jinak jsou stejné. |
| `ma` | **Maroko** | Marocké království | – | Rabat | 2 | 1.50:1 | Zelená hvězda na marocké vlajce je nakreslená jedním propleteným tahem. |
| `mu` | **Mauricius** | Mauricijská republika | – | Port Louis | 5 | 1.50:1 | Mauricijská vlajka má čtyři stejně široké pruhy: červený, modrý, žlutý a zelený. |
| `mr` | **Mauritánie** | Mauritánská islámská republika | – | Nuakšott | 5 | 1.50:1 | K zlatému půlměsíci s hvězdou přibyly mauritánské vlajce v roce 2017 dva červené pruhy. |
| `mz` | **Mosambik** | Mosambická republika | – | Maputo | 4 | 1.50:1 | Na mosambické vlajce je kniha, motyka a puška. |
| `na` | **Namibie** | Namibijská republika | – | Windhoek | 4 | 1.50:1 | V modrém rohu namibijské vlajky svítí zlaté slunce s dvanácti paprsky. |
| `ne` | **Niger** | Nigerská republika | – | Niamey | 4 | 1.17:1 | Oranžový kruh uprostřed nigerské vlajky je slunce nad Saharou. |
| `ng` | **Nigérie** | Nigerijská federativní republika | – | Abuja | 3 | 2.00:1 | Nigerijská vlajka má tři svislé pruhy – zelený, bílý a zelený. |
| `ci` | **Pobřeží slonoviny** | – | Cote d Ivoire, Côte d Ivoire | Yamoussoukro | 3 | 1.50:1 | Pobřeží slonoviny má stejné barvy jako Irsko, ale obráceně – u žerdi oranžovou. |
| `gq` | **Rovníková Guinea** | – | – | Malabo | 5 | 1.50:1 | Ve znaku Rovníkové Guineje je strom kapok. |
| `rw` | **Rwanda** | Rwandská republika | – | Kigali | 4 | 1.50:1 | V rohu rwandské vlajky svítí zlaté slunce s 24 paprsky. |
| `sn` | **Senegal** | Senegalská republika | – | Dakar | 4 | 1.50:1 | Senegalská vlajka je jako malijská, jen má uprostřed zelenou hvězdu. |
| `sc` | **Seychely** | Seychelská republika | – | Victoria | 5 | 2.00:1 | Ze seychelské vlajky vybíhá pět barevných paprsků z jednoho rohu. |
| `sl` | **Sierra Leone** | Republika Sierra Leone | – | Freetown | 5 | 1.50:1 | Modrý pruh dole na vlajce Sierry Leone znamená přístav ve Freetownu. |
| `so` | **Somálsko** | Somálská federativní republika | – | Mogadišo | 4 | 1.50:1 | Bílá hvězda na somálské vlajce má pět cípů za pět území, kde žijí Somálci. |
| `cf` | **Středoafrická republika** | – | – | Bangui | 5 | 1.50:1 | Vlajka Středoafrické republiky spojuje panafrické barvy s francouzskou trikolórou – svislý červený pruh je protíná. |
| `sd` | **Súdán** | Súdánská republika | – | Chartúm | 4 | 2.00:1 | Súdánská vlajka má u žerdi zelený trojúhelník, palestinská červený. |
| `st` | **Svatý Tomáš a Princův ostrov** | – | – | São Tomé | 5 | 2.00:1 | Dvě černé hvězdy na vlajce znamenají dva hlavní ostrovy země. |
| `tz` | **Tanzanie** | Sjednocená republika Tanzanie | – | Dodoma | 4 | 1.50:1 | Tanzanskou vlajku dělí šikmý černý pruh se žlutými okraji. |
| `tg` | **Togo** | Tožská republika | – | Lomé | 5 | 1.62:1 | Togo má pět pruhů a v červeném rohu bílou hvězdu. |
| `tn` | **Tunisko** | Tuniská republika | – | Tunis | 3 | 1.50:1 | Uprostřed tuniské vlajky je v bílém kruhu červený půlměsíc s hvězdou. |
| `ug` | **Uganda** | Ugandská republika | – | Kampala | 4 | 1.50:1 | Uprostřed ugandské vlajky stojí v bílém kruhu jeřáb královský. |
| `zm` | **Zambie** | Zambijská republika | – | Lusaka | 5 | 1.50:1 | Zambijská vlajka má barevné pruhy jen v rohu a nad nimi oranžového orla. |
| `zw` | **Zimbabwe** | Zimbabwská republika | – | Harare | 4 | 2.00:1 | Na zimbabwské vlajce je Zimbabwský pták vytesaný z kamene. |

## Severní Amerika (23)

| Kód | Český název | Úřední název | Aliasy | Hlavní město | Obtížnost | Poměr | Zajímavost o vlajce |
|---|---|---|---|---|---|---|---|
| `ag` | **Antigua a Barbuda** | – | – | Saint John's | 5 | 1.50:1 | Na vlajce Antiguy a Barbudy vychází zlaté slunce nad černým pruhem. |
| `bs` | **Bahamy** | Bahamské společenství | – | Nassau | 4 | 2.00:1 | Bahamská vlajka má tři vodorovné pruhy a u žerdi černý trojúhelník. |
| `bb` | **Barbados** | – | – | Bridgetown | 4 | 1.50:1 | Uprostřed barbadoské vlajky je černý trojzubec, kterému chybí násada. |
| `bz` | **Belize** | – | – | Belmopan | 5 | 1.67:1 | Belize je jediná země, která má na vlajce nakreslené lidi. |
| `dm` | **Dominika** | Dominické společenství | – | Roseau | 5 | 2.00:1 | Uprostřed vlajky Dominiky sedí papoušek amazoňan císařský. |
| `do` | **Dominikánská republika** | – | – | Santo Domingo | 4 | 1.50:1 | Dominikánská republika je jediná země, která má na vlajce otevřenou bibli. |
| `gd` | **Grenada** | – | – | Saint George's | 5 | 1.67:1 | Na grenadské vlajce je muškátový oříšek, kterým je ostrov proslulý. |
| `gt` | **Guatemala** | Guatemalská republika | – | Guatemala | 4 | 1.60:1 | Guatemalská vlajka má pruhy nastojato a ve znaku ptáka kvesala. |
| `ht` | **Haiti** | Republika Haiti | – | Port-au-Prince | 4 | 1.67:1 | Haiti mívalo stejnou vlajku jako Lichtenštejnsko, dokud si Lichtenštejnsko nepřidalo korunu. |
| `hn` | **Honduras** | Honduraská republika | – | Tegucigalpa | 5 | 2.00:1 | Pět hvězd uprostřed honduraské vlajky je pět zemí bývalé středoamerické federace. |
| `jm` | **Jamajka** | – | – | Kingston | 3 | 2.00:1 | Jamajská vlajka je jediná na světě, na které není ani červená, ani bílá, ani modrá. |
| `ca` | **Kanada** | – | – | Ottawa | 1 | 2.00:1 | Javorový list na kanadské vlajce má jedenáct cípů. |
| `cr` | **Kostarika** | Kostarická republika | – | San José | 4 | 1.67:1 | Kostarika si k modro-bílé vlajce přidala červený pruh podle francouzské trikolóry. |
| `cu` | **Kuba** | Kubánská republika | – | Havana | 2 | 2.00:1 | Kubánská vlajka má pět pruhů a v červeném trojúhelníku jednu bílou hvězdu. |
| `mx` | **Mexiko** | Spojené státy mexické | – | Mexico City | 2 | 1.75:1 | Uprostřed mexické vlajky sedí orel na kaktusu a v zobáku drží hada. |
| `ni` | **Nikaragua** | Nikaragujská republika | – | Managua | 5 | 1.67:1 | Ve znaku Nikaraguy se klene duha nad pěti sopkami. |
| `pa` | **Panama** | Panamská republika | – | Panama | 4 | 1.50:1 | Panamská vlajka je rozdělená na čtyři pole a jsou v ní dvě hvězdy. |
| `sv` | **Salvador** | Salvadorská republika | – | San Salvador | 5 | 1.77:1 | Salvador, Nikaragua i Honduras mají modro-bílo-modrou vlajku po společné středoamerické federaci. |
| `us` | **Spojené státy americké** | – | USA, Amerika, Spojené státy | Washington | 1 | 1.90:1 | Americká vlajka má 13 pruhů za původní kolonie a 50 hvězd za dnešní státy. |
| `lc` | **Svatá Lucie** | – | – | Castries | 5 | 2.00:1 | Trojúhelníky na vlajce Svaté Lucie představují sopečné štíty Pitons. |
| `kn` | **Svatý Kryštof a Nevis** | – | – | Basseterre | 5 | 1.50:1 | Vlajku Svatého Kryštofa a Nevisu přetíná šikmý černý pruh se dvěma bílými hvězdami. |
| `vc` | **Svatý Vincenc a Grenadiny** | – | – | Kingstown | 5 | 1.50:1 | Uprostřed vlajky jsou tři zelené kosočtverce poskládané do písmene V. |
| `tt` | **Trinidad a Tobago** | – | – | Port of Spain | 4 | 1.67:1 | Červenou vlajku Trinidadu a Tobaga přetíná šikmý černý pruh s bílým lemem. |

## Jižní Amerika (12)

| Kód | Český název | Úřední název | Aliasy | Hlavní město | Obtížnost | Poměr | Zajímavost o vlajce |
|---|---|---|---|---|---|---|---|
| `ar` | **Argentina** | Argentinská republika | – | Buenos Aires | 2 | 1.60:1 | Uprostřed argentinské vlajky svítí zlaté Májové slunce s obličejem. |
| `bo` | **Bolívie** | Mnohonárodnostní stát Bolívie | – | Sucre | 4 | 1.47:1 | Ve znaku bolivijské vlajky je lama a stříbrná hora Cerro Rico. |
| `br` | **Brazílie** | Brazilská federativní republika | – | Brasília | 1 | 1.43:1 | Hvězdy na brazilské vlajce ukazují skutečnou noční oblohu nad Rio de Janeirem v den vyhlášení republiky. |
| `ec` | **Ekvádor** | Ekvádorská republika | – | Quito | 4 | 1.50:1 | Ekvádorská vlajka má stejné pruhy jako kolumbijská, ale uprostřed znak s kondorem. |
| `gy` | **Guyana** | Guyanská kooperativní republika | – | Georgetown | 5 | 1.67:1 | Guyanské vlajce se říká Zlatý šíp. |
| `cl` | **Chile** | Chilská republika | – | Santiago de Chile | 3 | 1.50:1 | Chilská vlajka má v modrém čtverci jedinou bílou hvězdu. |
| `co` | **Kolumbie** | Kolumbijská republika | – | Bogotá | 3 | 1.50:1 | Žlutý pruh na kolumbijské vlajce je dvakrát širší než modrý a červený. |
| `py` | **Paraguay** | Paraguayská republika | – | Asunción | 4 | 1.82:1 | Paraguayská vlajka má na každé straně jiný znak – jako jediná na světě. |
| `pe` | **Peru** | Peruánská republika | – | Lima | 3 | 1.50:1 | Peru i Kanada mají pruhy červený, bílý a červený – Kanada má uprostřed javorový list, Peru znak s vikuňou. |
| `sr` | **Surinam** | Republika Surinam | – | Paramaribo | 5 | 1.50:1 | Uprostřed surinamské vlajky je velká žlutá hvězda. |
| `uy` | **Uruguay** | Uruguayská východní republika | – | Montevideo | 4 | 1.50:1 | Uruguayská vlajka má devět pruhů a v rohu Májové slunce jako Argentina. |
| `ve` | **Venezuela** | Venezuelská bolívarovská republika | – | Caracas | 3 | 1.50:1 | Uprostřed venezuelské vlajky je oblouk z osmi bílých hvězd. |

## Oceánie (14)

| Kód | Český název | Úřední název | Aliasy | Hlavní město | Obtížnost | Poměr | Zajímavost o vlajce |
|---|---|---|---|---|---|---|---|
| `au` | **Austrálie** | Australské společenství | – | Canberra | 1 | 2.00:1 | Pod Union Jackem má australská vlajka velkou hvězdu Commonwealthu a vedle ní Jižní kříž. |
| `fj` | **Fidži** | Republika Fidži | – | Suva | 4 | 2.00:1 | Fidžijská vlajka je světle modrá a v rohu má britský Union Jack. |
| `ki` | **Kiribati** | Republika Kiribati | – | Jižní Tarawa | 5 | 2.00:1 | Na vlajce Kiribati letí fregatka nad vycházejícím sluncem. |
| `mh` | **Marshallovy ostrovy** | – | – | Majuro | 5 | 1.90:1 | Vlajku Marshallových ostrovů přetínají dva šikmé pruhy a v rohu je hvězda s 24 paprsky. |
| `fm` | **Mikronésie** | Federativní státy Mikronésie | – | Palikir | 5 | 1.90:1 | Čtyři bílé hvězdy na vlajce Mikronésie jsou čtyři státy federace. |
| `nr` | **Nauru** | Republika Nauru | – | Yaren | 5 | 2.00:1 | Žlutý pruh na naurské vlajce je rovník a hvězda pod ním ukazuje, kde ostrov leží. |
| `nz` | **Nový Zéland** | – | – | Wellington | 2 | 2.00:1 | Novozélandská vlajka má čtyři červené hvězdy, australská pět bílých. |
| `pw` | **Palau** | Republika Palau | – | Ngerulmud | 5 | 1.60:1 | Žlutý kruh na palauské vlajce je měsíc a schválně není přesně uprostřed. |
| `pg` | **Papua-Nová Guinea** | Nezávislý stát Papua-Nová Guinea | – | Port Moresby | 4 | 1.33:1 | Vlajka Papuy-Nové Guineje je rozdělená úhlopříčně – nahoře rajka, dole Jižní kříž. |
| `ws` | **Samoa** | Nezávislý stát Samoa | – | Apia | 5 | 2.00:1 | V modrém rohu samojské vlajky svítí Jižní kříž z pěti hvězd. |
| `sb` | **Šalomounovy ostrovy** | – | – | Honiara | 5 | 2.00:1 | Pět hvězd na vlajce Šalomounových ostrovů je pět původních provincií. |
| `to` | **Tonga** | Království Tonga | – | Nukualofa | 5 | 2.00:1 | V rohu tonžské vlajky je červený kříž na bílém poli. |
| `tv` | **Tuvalu** | – | – | Funafuti | 5 | 2.00:1 | Devět hvězd na tuvalské vlajce je rozmístěných jako devět ostrovů v moři. |
| `vu` | **Vanuatu** | Republika Vanuatu | – | Port Vila | 5 | 1.67:1 | Na vlajce Vanuatu je zahnutý prasečí kel a dva listy kapradiny. |

## Bonusová sada: Území (30)

| Kód | Český název | Úřední název | Aliasy | Hlavní město | Obtížnost | Poměr | Zajímavost o vlajce |
|---|---|---|---|---|---|---|---|
| `ax` | **Ålandy** | – | – | Mariehamn | 5 | 1.53:1 | Je to švédská vlajka s červeným křížem navíc: Ålandy jsou švédsky mluvící část Finska, tak mají v jedné vlajce obě země. |
| `as` | **Americká Samoa** | – | – | Pago Pago | 5 | 2.00:1 | Orel drží samojské odznaky moci: válečný kyj a oháňku z kokosových vláken. |
| `vi` | **Americké Panenské ostrovy** | – | – | Charlotte Amalie | 5 | 1.50:1 | Mezi písmeny V a I drží orel tři modré šípy – tři hlavní ostrovy: Saint Croix, Saint Thomas a Saint John. |
| `gb-eng` | **Anglie** | – | – | Londýn | 2 | 1.67:1 | Anglická vlajka je červený kříž svatého Jiří – ve Union Jacku tvoří tu rovnou část. |
| `ai` | **Anguilla** | – | – | The Valley | 5 | 2.00:1 | Tři oranžoví delfíni plavou v kruhu – kruh má znamenat, že ostrov drží pohromadě. |
| `aw` | **Aruba** | – | – | Oranjestad | 5 | 1.50:1 | Hvězda má čtyři cípy jako čtyři světové strany – na Arubu se lidé sjeli odevšad. Dva žluté pruhy jsou turisté a nerosty, ze kterých ostrov žije. |
| `bm` | **Bermudy** | – | – | Hamilton | 4 | 2.00:1 | Britská území mívají modré pole, Bermudy mají červené – to byla vlajka obchodních lodí. Ve znaku je lev a loď Sea Venture, která tu v roce 1609 ztroskotala. |
| `vg` | **Britské Panenské ostrovy** | – | – | Road Town | 5 | 2.00:1 | Na štítu je svatá Uršula a jedenáct lamp. Kolumbus ostrovy pojmenoval po ní a jejích jedenácti tisících družkách – jedna lampa je tisíc. |
| `ck` | **Cookovy ostrovy** | – | – | Avarua | 5 | 2.00:1 | Patnáct hvězd v kruhu je patnáct ostrovů. Předtím byla vlajka zelená a hvězdy zlaté. |
| `cw` | **Curaçao** | – | – | Willemstad | 5 | 1.50:1 | Dvě hvězdy jsou dva ostrovy: velké Curaçao a malé Klein Curaçao, na kterém nikdo nebydlí. |
| `fo` | **Faerské ostrovy** | – | – | Tórshavn | 4 | 1.38:1 | Faerská vlajka má severský kříž v červené a modré na bílém poli. |
| `fk` | **Falklandy** | – | – | Stanley | 5 | 2.00:1 | Ve znaku je beran kvůli ovcím a loď Desire, ze které ostrovy v roce 1592 poprvé uviděli. |
| `pf` | **Francouzská Polynésie** | – | – | Papeete | 5 | 1.50:1 | Na vlnách pluje dvojitá kánoe a v ní pět postav – pět souostroví, ze kterých se Francouzská Polynésie skládá. |
| `gi` | **Gibraltar** | – | – | Gibraltar | 4 | 2.00:1 | Na gibraltarské vlajce je hrad se zlatým klíčem, který visí z brány. |
| `gl` | **Grónsko** | – | – | Nuuk | 3 | 1.50:1 | Grónská vlajka má kruh napůl červený a napůl bílý – jako slunce nad ledem. |
| `gu` | **Guam** | – | – | Hagåtña | 5 | 1.86:1 | Znak má tvar prakového kamene, jaký používali staří Čamorové. Pluje v něm rychlá plachetnice proa. |
| `gg` | **Guernsey** | – | – | Saint Peter Port | 5 | 1.50:1 | Zlatý kříž uvnitř anglického přibyl až v roce 1985 – do té doby měli Guernsey i Anglie na sportovních akcích úplně stejnou vlajku a pletlo se to. |
| `hk` | **Hongkong** | – | – | Hongkong | 3 | 1.50:1 | Na hongkongské vlajce je bílý květ blahovičníku s pěti okvětními lístky. |
| `je` | **Jersey** | – | – | Saint Helier | 5 | 1.67:1 | Šikmý červený kříž má Jersey od 30. let 19. století, koruna přibyla až v roce 1981. |
| `ky` | **Kajmanské ostrovy** | – | – | George Town | 5 | 2.00:1 | Tři zelené hvězdy jsou tři ostrovy. Nad štítem je želva a ananas – ananas kvůli poutu s Jamajkou. |
| `mo` | **Macao** | – | – | Macao | 5 | 1.50:1 | Lotos má tři okvětní lístky jako tři části Macaa: poloostrov a dva ostrovy. Pod ním je most, který je spojuje. |
| `ms` | **Montserrat** | – | – | Plymouth | 5 | 2.00:1 | Žena s harfou na štítu je Erin, symbol Irska. Na Montserrat se Irové stěhovali už od roku 1632. |
| `nc` | **Nová Kaledonie** | – | – | Nouméa | 5 | 2.00:1 | Nová Kaledonie používá dvě vlajky vedle sebe – francouzskou a tuhle kanackou. Na žlutém kotouči je flèche faîtière, vyřezávaná špice z vrcholu kanackého domu. |
| `im` | **Ostrov Man** | – | – | Douglas | 4 | 2.00:1 | Na vlajce Ostrova Man jsou tři nohy v brnění spojené do kolečka. |
| `pr` | **Portoriko** | – | – | San Juan | 3 | 1.50:1 | Portorická vlajka vypadá jako kubánská s prohozenou modrou a červenou. |
| `mp` | **Severní Mariany** | – | – | Saipan | 5 | 2.00:1 | Šedý kámen latte je podstavec, na jakém stály čamorské domy. Kolem hvězdy je mwar – věnec z živých květů. |
| `gb-sct` | **Skotsko** | – | – | Edinburgh | 3 | 1.67:1 | Skotská vlajka je bílý šikmý kříž svatého Ondřeje na modré. |
| `tc` | **Turks a Caicos** | – | – | Cockburn Town | 5 | 2.00:1 | Na štítu je mušle, langusta a kaktus zvaný turkova hlava – právě po něm se ostrovy Turks nejspíš jmenují. |
| `gb-wls` | **Wales** | – | – | Cardiff | 3 | 1.67:1 | Na velšské vlajce je červený drak – a ve Union Jacku není vůbec zastoupený. |
| `eh` | **Západní Sahara** | – | – | Al-Ajún | 5 | 2.00:1 | Má barvy, které nosí většina arabských vlajek – černou, bílou, zelenou a červenou. |

## Skupiny zaměnitelných vlajek

Podle nich se vybírají distraktory a staví režim Dvojčata. Čím víc přesných skupin, tím lepší trénink.

- Čad · Rumunsko
- Monako · Indonésie · Polsko
- Senegal · Mali · Guinea
- Irsko · Pobřeží slonoviny · Itálie
- Nizozemsko · Lucembursko
- Austrálie · Nový Zéland
- Slovinsko · Slovensko · Rusko
- Kolumbie · Ekvádor · Venezuela
- Norsko · Island
- Jordánsko · Palestina · Súdán
- Katar · Bahrajn
- Rumunsko · Čad · Moldavsko · Andorra
- Senegal · Mali · Guinea · Kamerun
- Slovinsko · Slovensko · Rusko · Srbsko
- Island · Norsko · Dánsko · Finsko · Švédsko
- Dánsko · Faerské ostrovy · Ålandy
- Jordánsko · Palestina · Súdán · Kuvajt · Západní Sahara
- Jemen · Egypt · Irák
- Rakousko · Lotyšsko
- Peru · Kanada
- Libérie · Spojené státy americké · Malajsie
- Itálie · Irsko · Pobřeží slonoviny · Mexiko
- Guatemala · Nikaragua · Salvador · Honduras
- Argentina · Uruguay
- Česko · Filipíny
- Čína · Vietnam
- Turecko · Tunisko · Alžírsko
- Niger · Indie
- Japonsko · Bangladéš · Palau
- Bolívie · Ghana · Etiopie · Litva · Myanmar
- Austrálie · Nový Zéland · Fidži
- Nizozemsko · Lucembursko · Paraguay
- Belgie · Německo
- Jižní Súdán · Keňa · Súdán
- Kostarika · Thajsko
- Haiti · Lichtenštejnsko
- Řecko · Uruguay
- Chile · Kuba
- Maďarsko · Bulharsko
- Spojené arabské emiráty · Kuvajt
- Spojené království · Anglie · Skotsko

## Čím se zaměnitelné vlajky liší

Tyhle věty se ukazují po chybě, když dítě zamění dvě podobné vlajky.
Zkontroluj je prosím – je to to nejdůležitější, co se z aplikace učí.

| Dvojice | Čím se liší |
|---|---|
| Rumunsko · Čad | Čad má modrou tmavší, skoro námořní. Rumunsko světlejší. Jinak jsou stejné. |
| Monako · Polsko | Monako má červenou nahoře, Polsko bílou. |
| Indonésie · Monako | Liší se jen tvarem: Indonésie je delší (3:2), Monako skoro čtvercové (4:5). |
| Indonésie · Polsko | Indonésie má červenou nahoře, Polsko bílou. |
| Mali · Senegal | Senegal má uprostřed zelenou hvězdu, Mali je bez ní. |
| Guinea · Senegal | Senegal má uprostřed zelenou hvězdu a u žerdi zelenou, Guinea červenou a bez hvězdy. |
| Guinea · Mali | Guinea má u žerdi červenou, Mali zelenou. |
| Irsko · Itálie | Irsko má na konci oranžovou, Itálie červenou. |
| Pobřeží slonoviny · Irsko | Irsko má u žerdi zelenou, Pobřeží slonoviny oranžovou. |
| Pobřeží slonoviny · Itálie | Itálie má u žerdi zelenou a na konci červenou, Pobřeží slonoviny oranžovou a zelenou. |
| Lucembursko · Nizozemsko | Lucembursko má modrou světlejší a vlajku delší, Nizozemsko tmavě modrou. |
| Austrálie · Nový Zéland | Nový Zéland má čtyři červené hvězdy, Austrálie šest bílých a jednu velkou pod Union Jackem. |
| Slovinsko · Slovensko | Slovinsko má ve znaku bílou horu a hvězdy, Slovensko dvojkříž na třech vršcích. |
| Rusko · Slovinsko | Slovinsko má u žerdi znak s horou Triglav, Rusko je bez znaku. |
| Rusko · Slovensko | Slovensko má znak s dvojkřížem na třech kopcích, Rusko je bez znaku. |
| Kolumbie · Ekvádor | Ekvádor má uprostřed znak s kondorem, Kolumbie je bez znaku. |
| Kolumbie · Venezuela | Venezuela má pruhy stejně široké a oblouk bílých hvězd, Kolumbie žlutý pruh přes půlku vlajky. |
| Ekvádor · Venezuela | Ekvádor má široký žlutý pruh a znak, Venezuela stejné pruhy a hvězdy. |
| Island · Norsko | Island má modré pole a červený kříž, Norsko červené pole a modrý kříž. |
| Jordánsko · Palestina | Jordánsko má v trojúhelníku bílou sedmicípou hvězdu, Palestina trojúhelník prázdný. |
| Jordánsko · Súdán | Jordánsko má červený trojúhelník s hvězdou a černou nahoře, Súdán zelený trojúhelník a červenou nahoře. |
| Palestina · Súdán | Palestina má černou nahoře a červený trojúhelník, Súdán červenou nahoře a zelený trojúhelník. |
| Bahrajn · Katar | Katar je vínový, hodně dlouhý a má devět zubů, Bahrajn červený a pět. |
| Moldavsko · Rumunsko | Moldavsko má uprostřed orla se štítem, Rumunsko je bez znaku. |
| Moldavsko · Čad | Moldavsko má uprostřed orla, Čad je bez znaku a má tmavší modrou. |
| Andorra · Rumunsko | Andorra má uprostřed znak se dvěma mitrami a kravami, Rumunsko je bez znaku. |
| Andorra · Čad | Andorra má uprostřed znak, Čad je bez znaku a má tmavší modrou. |
| Andorra · Moldavsko | Andorra má ve znaku mitry a krávy, Moldavsko orla s hlavou zubra. |
| Kamerun · Senegal | Kamerun má žlutou hvězdu na červeném pruhu, Senegal zelenou hvězdu na žlutém. |
| Kamerun · Mali | Kamerun má uprostřed červený pruh se žlutou hvězdou, Mali žlutý pruh bez hvězdy. |
| Kamerun · Guinea | Kamerun má u žerdi zelenou a uprostřed žlutou hvězdu, Guinea červenou a bez hvězdy. |
| Srbsko · Slovinsko | Srbsko má červenou nahoře, Slovinsko bílou a znak u žerdi. |
| Srbsko · Slovensko | Srbsko má červenou nahoře, Slovensko bílou a znak s dvojkřížem. |
| Srbsko · Rusko | Srbsko má červenou nahoře a uprostřed znak, Rusko bílou nahoře a nic. |
| Island · Švédsko | Švédsko má žlutý kříž bez lemu, Island červený kříž v bílém lemu. |
| Norsko · Švédsko | Norsko má červené pole a modrý kříž v bílém lemu, Švédsko modré pole a žlutý kříž. |
| Dánsko · Island | Island má modré pole a červený kříž v bílém lemu, Dánsko červené pole a bílý kříž. |
| Dánsko · Norsko | Norsko má modrý kříž v bílém lemu, Dánsko jen bílý kříž. |
| Dánsko · Finsko | Finsko má bílé pole a modrý kříž, Dánsko červené pole a bílý kříž. |
| Dánsko · Švédsko | Švédsko má modré pole a žlutý kříž, Dánsko červené pole a bílý kříž. |
| Finsko · Island | Finsko má bílé pole a modrý kříž, Island modré pole a červený kříž. |
| Finsko · Norsko | Norsko má červené pole, Finsko bílé. |
| Finsko · Švédsko | Švédsko má modré pole a žlutý kříž, Finsko bílé pole a modrý kříž. |
| Dánsko · Faerské ostrovy | Faerské ostrovy mají bílé pole a červený kříž v modrém lemu, Dánsko červené pole a bílý kříž. |
| Ålandy · Dánsko | Ålandy mají modré pole a žlutý kříž s červeným uvnitř, Dánsko červené pole a bílý kříž. |
| Ålandy · Faerské ostrovy | Ålandy mají modré pole a žlutý kříž, Faerské ostrovy bílé pole a červený kříž. |
| Jordánsko · Kuvajt | Jordánsko má u žerdi trojúhelník s bílou hvězdou, Kuvajt černý lichoběžník bez hvězdy. |
| Kuvajt · Palestina | Kuvajt má zelenou nahoře a u žerdi černý lichoběžník, Palestina černou nahoře a trojúhelník. |
| Kuvajt · Súdán | Kuvajt má zelenou nahoře a černý lichoběžník, Súdán červenou nahoře a zelený trojúhelník. |
| Západní Sahara · Jordánsko | Západní Sahara má červený půlměsíc s hvězdou uprostřed vlajky, Jordánsko bílou hvězdu v trojúhelníku. |
| Západní Sahara · Palestina | Západní Sahara má uprostřed červený půlměsíc s hvězdou, Palestina nic. |
| Západní Sahara · Súdán | Západní Sahara má černou nahoře a červený trojúhelník, Súdán červenou nahoře a zelený trojúhelník. |
| Západní Sahara · Kuvajt | Západní Sahara má černou nahoře a červený trojúhelník, Kuvajt zelenou nahoře a černý lichoběžník. |
| Egypt · Jemen | Egypt má uprostřed zlatého orla, Jemen je bez znaku. |
| Egypt · Irák | Egypt má uprostřed zlatého orla, Irák zelený nápis. |
| Irák · Jemen | Irák má uprostřed zelený nápis, Jemen nic. |
| Rakousko · Lotyšsko | Lotyšsko má tmavě karmínovou a užší bílý pruh, Rakousko sytě červenou a pruhy stejně široké. |
| Kanada · Peru | Kanada má uprostřed javorový list, Peru ho nemá. |
| Libérie · Spojené státy americké | USA mají v kantonu padesát hvězd, Libérie jednu velkou. |
| Libérie · Malajsie | Malajsie má v kantonu půlměsíc a hvězdu, Libérie jednu bílou hvězdu. |
| Malajsie · Spojené státy americké | USA mají padesát hvězd, Malajsie půlměsíc a jednu čtrnácticípou. |
| Itálie · Mexiko | Mexiko má uprostřed orla na kaktusu, Itálie prostřední pruh prázdný. |
| Irsko · Mexiko | Mexiko má uprostřed orla a na konci červenou, Irsko nic a oranžovou. |
| Pobřeží slonoviny · Mexiko | Mexiko má uprostřed orla na kaktusu, Pobřeží slonoviny nic – a jiné pořadí barev. |
| Guatemala · Nikaragua | Guatemala má pruhy svislé, Nikaragua vodorovné a uprostřed trojúhelník s duhou. |
| Guatemala · Salvador | Guatemala má pruhy svislé, Salvador vodorovné. |
| Guatemala · Honduras | Guatemala má pruhy svislé, Honduras vodorovné s pěti modrými hvězdami. |
| Nikaragua · Salvador | Nikaragua má ve znaku duhu, Salvador nápis DIOS UNION LIBERTAD. |
| Honduras · Nikaragua | Honduras má uprostřed pět modrých hvězd, Nikaragua trojúhelník s duhou. |
| Honduras · Salvador | Honduras má pět hvězd, Salvador znak s trojúhelníkem a nápisem. |
| Argentina · Uruguay | Argentina má tři pruhy a slunce uprostřed, Uruguay devět pruhů a slunce v bílém rohu. |
| Česko · Filipíny | Filipíny mají v trojúhelníku slunce a hvězdy a pruhy modrý a červený, Česko modrý klín bez kresby. |
| Čína · Vietnam | Čína má pět žlutých hvězd v rohu, Vietnam jednu velkou uprostřed. |
| Tunisko · Turecko | Tunisko má půlměsíc v bílém kruhu, Turecko přímo na červené. |
| Alžírsko · Turecko | Alžírsko je zeleno-bílé, Turecko celé červené. |
| Alžírsko · Tunisko | Alžírsko je zeleno-bílé s červeným půlměsícem, Tunisko celé červené s bílým kruhem. |
| Indie · Niger | Indie má uprostřed modré kolo s paprsky, Niger oranžový kruh. |
| Japonsko · Palau | Japonsko má bílé pole a červený kruh uprostřed, Palau modré pole a žlutý kruh u žerdi. |
| Bangladéš · Japonsko | Bangladéš má zelené pole a kruh posunutý k žerdi, Japonsko bílé pole a kruh uprostřed. |
| Bangladéš · Palau | Bangladéš má zelené pole a červený kruh, Palau světle modré a žlutý. |
| Bolívie · Ghana | Ghana má uprostřed černou hvězdu, Bolívie znak se lamou a horou. |
| Bolívie · Etiopie | Bolívie má červenou nahoře a znak, Etiopie zelenou nahoře a modrý kruh s hvězdou. |
| Bolívie · Litva | Bolívie má červenou nahoře a znak, Litva žlutou nahoře a nic. |
| Bolívie · Myanmar | Bolívie má červenou nahoře a znak, Myanmar žlutou nahoře a velkou bílou hvězdu. |
| Ghana · Litva | Ghana má červenou nahoře a černou hvězdu, Litva žlutou nahoře a nic. |
| Ghana · Myanmar | Ghana má červenou nahoře a černou hvězdu, Myanmar žlutou nahoře a velkou bílou. |
| Etiopie · Ghana | Etiopie má zelenou nahoře a modrý kruh s hvězdou, Ghana červenou nahoře a černou hvězdu. |
| Etiopie · Litva | Etiopie má zelenou nahoře a modrý kruh, Litva žlutou nahoře a nic. |
| Etiopie · Myanmar | Etiopie má zelenou nahoře a modrý kruh, Myanmar žlutou nahoře a bílou hvězdu. |
| Litva · Myanmar | Myanmar má uprostřed velkou bílou hvězdu, Litva nic. |
| Austrálie · Fidži | Fidži má světle modré pole a vpravo štít, Austrálie tmavě modré a hvězdy Jižního kříže. |
| Fidži · Nový Zéland | Fidži má světle modré pole a štít, Nový Zéland tmavě modré a čtyři červené hvězdy. |
| Nizozemsko · Paraguay | Paraguay má uprostřed znak, Nizozemsko je bez něj. |
| Lucembursko · Paraguay | Paraguay má uprostřed znak, Lucembursko je bez něj. |
| Belgie · Německo | Belgie má pruhy svislé, Německo vodorovné – a v jiném pořadí. |
| Keňa · Jižní Súdán | Jižní Súdán má u žerdi modrý trojúhelník se žlutou hvězdou, Keňa uprostřed štít. |
| Keňa · Súdán | Keňa má uprostřed masajský štít s oštěpy, Súdán zelený trojúhelník u žerdi. |
| Súdán · Jižní Súdán | Jižní Súdán má modrý trojúhelník se žlutou hvězdou, Súdán zelený bez hvězdy. |
| Kostarika · Thajsko | Kostarika má široký prostřední pruh červený, Thajsko modrý. |
| Haiti · Lichtenštejnsko | Lichtenštejnsko má u žerdi zlatou korunu, Haiti ji nemá. |
| Řecko · Uruguay | Řecko má v rohu bílý kříž na modré, Uruguay zlaté slunce na bílé. |
| Chile · Kuba | Chile má dva pruhy a modrý čtverec u žerdi, Kuba pět pruhů a červený trojúhelník. |
| Bulharsko · Maďarsko | Bulharsko má bílou nahoře a zelenou uprostřed, Maďarsko červenou nahoře. |
| Spojené arabské emiráty · Kuvajt | SAE mají u žerdi svislý červený pruh, Kuvajt černý lichoběžník – a dole červenou místo černé. |
| Spojené království · Anglie | Anglie je jen červený kříž na bílé, Spojené království má tři kříže přes sebe. |
| Spojené království · Skotsko | Skotsko je bílý šikmý kříž na modré, Spojené království má přes sebe i červené kříže. |
| Anglie · Skotsko | Anglie má bílé pole a rovný červený kříž, Skotsko modré pole a bílý kříž našikmo. |
