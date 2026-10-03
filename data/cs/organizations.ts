import type { CsCountry } from '../schema';

/**
 * Bonusová sada „Organizace“ – vlajky mezinárodních organizací.
 *
 * Nemají hlavní město, světadíl ani souřadnice, a schválně: OSN nepatří do
 * Severní Ameriky, jen tam sídlí. Build to hlídá (`build-countries.ts`), takže
 * se sem nedá omylem dopsat „sídlo“ jako hlavní město.
 *
 * **Jak přidat další vlajku:**
 *
 * 1. Stáhnout SVG z Wikimedia Commons (vlajky organizací tam bývají public
 *    domain – ověřit u konkrétního souboru) a uložit do
 *    `data/flags-override/<kod>.svg` i s poznámkou odkud.
 * 2. Zkontrolovat, že `viewBox` odpovídá **skutečnému** poměru stran vlajky.
 *    Poměr se z něj odečítá; překreslená vlajka ve 4:3 by sem patřit neměla.
 * 3. Přidat sem řádek a pustit `npm run data`.
 */
export const organizations: CsCountry[] = [
  { code: 'un', nameCs: 'OSN', nameCsOfficial: 'Organizace spojených národů',
    aliases: ['Organizace spojených národů', 'Spojené národy', 'United Nations'],
    sovereignty: 'organization', difficulty: 2,
    funFact: 'Mapa světa na vlajce OSN je vidět shora od severního pólu a olivové větve kolem ní znamenají mír.',
    review: ['ROZHODNUTO: vlajka převzatá z noto-emoji (render z Wikipedie, public domain), poměr 2:3 podle vlajkového předpisu OSN.'] },

  { code: 'eu', nameCs: 'Evropská unie', aliases: ['EU', 'Unie'],
    sovereignty: 'organization', difficulty: 2,
    funFact: 'Hvězd je dvanáct bez ohledu na to, kolik je členských zemí – dvanáctka odjakživa znamená úplnost.',
    review: ['ROZHODNUTO: vlajka převzatá z noto-emoji (render z Wikipedie, public domain), poměr 2:3. Tutéž vlajku používá i Rada Evropy, která ji vymyslela.'] },

  { code: 'nato', nameCs: 'NATO', nameCsOfficial: 'Severoatlantická aliance',
    aliases: ['Severoatlantická aliance', 'Severoatlantický pakt'],
    sovereignty: 'organization', difficulty: 2,
    funFact: 'Tmavě modrá je Atlantický oceán, kruh znamená, že členové drží spolu, a kompasová růžice ukazuje společnou cestu k míru.',
    review: ['ROZHODNUTO: vlajka převzatá z Wikimedia Commons, poměr 4:3 podle předpisu z roku 1959 (400×300 jednotek).'] },

  { code: 'olympic', nameCs: 'Olympijské hry', aliases: ['olympijská vlajka', 'olympijské kruhy', 'olympiáda', 'MOV'],
    sovereignty: 'organization', difficulty: 1,
    funFact: 'Pět kruhů znamená pět světadílů. Barvy jsou vybrané tak, aby aspoň jedna z nich byla na vlajce každé země – žádný kruh přitom nepatří jednomu světadílu.',
    review: ['ROZHODNUTO: vlajka převzatá z Wikimedia Commons, poměr 2:3. Kruhy se schválně nepřiřazují ke světadílům – Coubertin to tak nemyslel.'] },

  { code: 'redcross', nameCs: 'Červený kříž', nameCsOfficial: 'Mezinárodní hnutí Červeného kříže',
    aliases: ['Mezinárodní červený kříž'],
    sovereignty: 'organization', difficulty: 2,
    funFact: 'Je to švýcarská vlajka s prohozenými barvami – na počest Švýcarska, kde hnutí vzniklo.',
    review: ['ROZHODNUTO: vlajka převzatá z Wikimedia Commons, poměr 2:3.'] },

  { code: 'african-union', nameCs: 'Africká unie', aliases: ['AU'],
    sovereignty: 'organization', difficulty: 4,
    funFact: 'Uprostřed je obrys Afriky a kolem něj 53 zlatých hvězd – tolik měla unie členů, když v roce 2010 vlajku přijala.',
    review: ['ROZHODNUTO: vlajka převzatá z Wikimedia Commons, poměr 2:3. Dnes má unie 55 členů, hvězd zůstalo 53.'] },

  { code: 'unesco', nameCs: 'UNESCO', sovereignty: 'organization', difficulty: 3,
    funFact: 'Bílý chrám na vlajce je složený z vlastního názvu: písmena U-N-E-S-C-O tvoří jeho sloupy.',
    review: ['ROZHODNUTO: vlajka převzatá z Wikimedia Commons, poměr 2:3.'] },

  { code: 'arab', nameCs: 'Liga arabských států', aliases: ['Arabská liga'],
    sovereignty: 'organization', difficulty: 5,
    funFact: 'Zlatý řetěz kolem nápisu měl při přijetí vlajky tolik článků, kolik měla liga členů – dvaadvacet.',
    review: ['ROZHODNUTO: poměr 2:3 podle Flags of the World. Pole dopočítané a znak přenesený z flag-icons, protože soubor z Commons míchá viewBox 2:1 s rozměry 3:2 – poměr by z něj vyšel špatně.'] },

  { code: 'asean', nameCs: 'ASEAN', nameCsOfficial: 'Sdružení národů jihovýchodní Asie',
    aliases: ['Sdružení národů jihovýchodní Asie'],
    sovereignty: 'organization', difficulty: 5,
    funFact: 'Uprostřed je deset stébel rýže svázaných dohromady – deset stébel za deset členských zemí.',
    review: ['ROZHODNUTO: vlajka převzatá z Wikimedia Commons, poměr 2:3.'] },
];
