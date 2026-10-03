import type { CsCountry } from '../schema';

/**
 * Bonusová sada „Organizace“ – vlajky mezinárodních organizací.
 *
 * Nemají hlavní město, světadíl ani souřadnice, a schválně: OSN nepatří do
 * Severní Ameriky, jen tam sídlí. Build to hlídá (`build-countries.ts`), takže
 * se sem nedá omylem dopsat „sídlo“ jako hlavní město.
 *
 * **Jak přidat další vlajku** (NATO, olympijské kruhy, Commonwealth, Africká
 * unie, Červený kříž – ty tu chybí, protože se k jejich SVG nedá v tomhle
 * prostředí dostat):
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

  { code: 'arab', nameCs: 'Liga arabských států', aliases: ['Arabská liga'],
    sovereignty: 'organization', difficulty: 5,
    funFact: 'Zlatý řetěz kolem nápisu měl při přijetí vlajky tolik článků, kolik měla liga členů – dvaadvacet.',
    review: ['ROZHODNUTO: poměr 2:3 podle Flags of the World; pole dopočítané, znak přenesený z flag-icons.'] },

  { code: 'asean', nameCs: 'ASEAN', nameCsOfficial: 'Sdružení národů jihovýchodní Asie',
    aliases: ['Sdružení národů jihovýchodní Asie'],
    sovereignty: 'organization', difficulty: 5,
    funFact: 'Uprostřed je deset stébel rýže svázaných dohromady – deset stébel za deset členských zemí.',
    review: ['ROZHODNUTO: poměr 2:3 podle Flags of the World; pole dopočítané, znak přenesený z flag-icons.'] },
];
