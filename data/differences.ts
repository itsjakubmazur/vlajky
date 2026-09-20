/**
 * Čím se od sebe zaměnitelné vlajky liší.
 *
 * Ukázat po chybě správnou vlajku dítěti neřekne, jak ji má příště poznat.
 * Tyhle věty ano. Klíč je dvojice kódů seřazená abecedně a spojená `|`,
 * takže na pořadí nezáleží.
 *
 * Pravidlo je stejné jako u zajímavostí: **radši prázdné než vymyšlené.**
 * Dvojice bez věty se objeví v REVIEW.md a v aplikaci se prostě neukáže nic.
 * Každá věta říká rozdíl u obou zemí, ne jen u jedné – dítě se ptá „která
 * z těch dvou to je“, ne „jaká je ta jedna“.
 */
export const flagDifferences: Record<string, string> = {
  // --- modro-žluto-červené svislé pruhy ---
  'ro|td': 'Čad má modrou tmavší, skoro námořní. Rumunsko světlejší. Jinak jsou stejné.',
  'ad|ro': 'Andorra má uprostřed znak se dvěma mitrami a kravami, Rumunsko je bez znaku.',
  'ad|td': 'Andorra má uprostřed znak, Čad je bez znaku a má tmavší modrou.',
  'ad|md': 'Andorra má ve znaku mitry a krávy, Moldavsko orla s hlavou zubra.',
  'md|ro': 'Moldavsko má uprostřed orla se štítem, Rumunsko je bez znaku.',
  'md|td': 'Moldavsko má uprostřed orla, Čad je bez znaku a má tmavší modrou.',

  // --- panafrické svislé pruhy ---
  'gn|ml': 'Guinea má u žerdi červenou, Mali zelenou.',
  'gn|sn': 'Senegal má uprostřed zelenou hvězdu a u žerdi zelenou, Guinea červenou a bez hvězdy.',
  'ml|sn': 'Senegal má uprostřed zelenou hvězdu, Mali je bez ní.',
  'cm|gn': 'Kamerun má u žerdi zelenou a uprostřed žlutou hvězdu, Guinea červenou a bez hvězdy.',
  'cm|ml': 'Kamerun má uprostřed červený pruh se žlutou hvězdou, Mali žlutý pruh bez hvězdy.',
  'cm|sn': 'Kamerun má žlutou hvězdu na červeném pruhu, Senegal zelenou hvězdu na žlutém.',

  // --- zeleno-bílo-červené svislé ---
  'ci|ie': 'Irsko má u žerdi zelenou, Pobřeží slonoviny oranžovou.',
  'ci|it': 'Itálie má u žerdi zelenou a na konci červenou, Pobřeží slonoviny oranžovou a zelenou.',
  'ci|mx': 'Mexiko má uprostřed orla na kaktusu, Pobřeží slonoviny nic – a jiné pořadí barev.',
  'ie|it': 'Irsko má na konci oranžovou, Itálie červenou.',
  'ie|mx': 'Mexiko má uprostřed orla a na konci červenou, Irsko nic a oranžovou.',
  'it|mx': 'Mexiko má uprostřed orla na kaktusu, Itálie prostřední pruh prázdný.',

  // --- červeno-bílo-modré vodorovné ---
  'lu|nl': 'Lucembursko má modrou světlejší a vlajku delší, Nizozemsko tmavě modrou.',
  'lu|py': 'Paraguay má uprostřed znak, Lucembursko je bez něj.',
  'nl|py': 'Paraguay má uprostřed znak, Nizozemsko je bez něj.',

  // --- červeno-bílé ---
  'id|mc': 'Liší se jen tvarem: Indonésie je delší (3:2), Monako skoro čtvercové (4:5).',
  'id|pl': 'Indonésie má červenou nahoře, Polsko bílou.',
  'mc|pl': 'Monako má červenou nahoře, Polsko bílou.',
  'at|lv': 'Lotyšsko má tmavě karmínovou a užší bílý pruh, Rakousko sytě červenou a pruhy stejně široké.',
  'ca|pe': 'Kanada má uprostřed javorový list, Peru ho nemá.',

  // --- slovanské trikolóry ---
  'ru|si': 'Slovinsko má u žerdi znak s horou Triglav, Rusko je bez znaku.',
  'ru|sk': 'Slovensko má znak s dvojkřížem na třech kopcích, Rusko je bez znaku.',
  'si|sk': 'Slovinsko má ve znaku bílou horu a hvězdy, Slovensko dvojkříž na třech vršcích.',
  'rs|ru': 'Srbsko má červenou nahoře a uprostřed znak, Rusko bílou nahoře a nic.',
  'rs|si': 'Srbsko má červenou nahoře, Slovinsko bílou a znak u žerdi.',
  'rs|sk': 'Srbsko má červenou nahoře, Slovensko bílou a znak s dvojkřížem.',

  // --- severské kříže ---
  'dk|is': 'Island má modré pole a červený kříž v bílém lemu, Dánsko červené pole a bílý kříž.',
  'dk|no': 'Norsko má modrý kříž v bílém lemu, Dánsko jen bílý kříž.',
  'dk|se': 'Švédsko má modré pole a žlutý kříž, Dánsko červené pole a bílý kříž.',
  'dk|fi': 'Finsko má bílé pole a modrý kříž, Dánsko červené pole a bílý kříž.',
  'fi|is': 'Finsko má bílé pole a modrý kříž, Island modré pole a červený kříž.',
  'fi|no': 'Norsko má červené pole, Finsko bílé.',
  'fi|se': 'Švédsko má modré pole a žlutý kříž, Finsko bílé pole a modrý kříž.',
  'is|no': 'Island má modré pole a červený kříž, Norsko červené pole a modrý kříž.',
  'is|se': 'Švédsko má žlutý kříž bez lemu, Island červený kříž v bílém lemu.',
  'no|se': 'Norsko má červené pole a modrý kříž v bílém lemu, Švédsko modré pole a žlutý kříž.',
  'ax|dk': 'Ålandy mají modré pole a žlutý kříž s červeným uvnitř, Dánsko červené pole a bílý kříž.',
  'dk|fo': 'Faerské ostrovy mají bílé pole a červený kříž v modrém lemu, Dánsko červené pole a bílý kříž.',
  'ax|fo': 'Ålandy mají modré pole a žlutý kříž, Faerské ostrovy bílé pole a červený kříž.',

  // --- panarabské s trojúhelníkem u žerdi ---
  'jo|ps': 'Jordánsko má v trojúhelníku bílou sedmicípou hvězdu, Palestina trojúhelník prázdný.',
  'jo|sd': 'Jordánsko má červený trojúhelník s hvězdou a černou nahoře, Súdán zelený trojúhelník a červenou nahoře.',
  'ps|sd': 'Palestina má černou nahoře a červený trojúhelník, Súdán červenou nahoře a zelený trojúhelník.',
  'jo|kw': 'Jordánsko má u žerdi trojúhelník s bílou hvězdou, Kuvajt černý lichoběžník bez hvězdy.',
  'kw|ps': 'Kuvajt má zelenou nahoře a u žerdi černý lichoběžník, Palestina černou nahoře a trojúhelník.',
  'kw|sd': 'Kuvajt má zelenou nahoře a černý lichoběžník, Súdán červenou nahoře a zelený trojúhelník.',
  'eh|jo': 'Západní Sahara má červený půlměsíc s hvězdou uprostřed vlajky, Jordánsko bílou hvězdu v trojúhelníku.',
  'eh|kw': 'Západní Sahara má černou nahoře a červený trojúhelník, Kuvajt zelenou nahoře a černý lichoběžník.',
  'eh|ps': 'Západní Sahara má uprostřed červený půlměsíc s hvězdou, Palestina nic.',
  'eh|sd': 'Západní Sahara má černou nahoře a červený trojúhelník, Súdán červenou nahoře a zelený trojúhelník.',
  'ae|kw': 'SAE mají u žerdi svislý červený pruh, Kuvajt černý lichoběžník – a dole červenou místo černé.',

  // --- černo-červeno-zelené s trojúhelníkem ---
  'ke|sd': 'Keňa má uprostřed masajský štít s oštěpy, Súdán zelený trojúhelník u žerdi.',
  'ke|ss': 'Jižní Súdán má u žerdi modrý trojúhelník se žlutou hvězdou, Keňa uprostřed štít.',
  'sd|ss': 'Jižní Súdán má modrý trojúhelník se žlutou hvězdou, Súdán zelený bez hvězdy.',

  // --- červeno-bílo-černé pruhy ---
  'eg|iq': 'Egypt má uprostřed zlatého orla, Irák zelený nápis.',
  'eg|ye': 'Egypt má uprostřed zlatého orla, Jemen je bez znaku.',
  'iq|ye': 'Irák má uprostřed zelený nápis, Jemen nic.',

  // --- zeleno-žluto-červené vodorovné ---
  'bo|et': 'Bolívie má červenou nahoře a znak, Etiopie zelenou nahoře a modrý kruh s hvězdou.',
  'bo|gh': 'Ghana má uprostřed černou hvězdu, Bolívie znak se lamou a horou.',
  'bo|lt': 'Bolívie má červenou nahoře a znak, Litva žlutou nahoře a nic.',
  'bo|mm': 'Bolívie má červenou nahoře a znak, Myanmar žlutou nahoře a velkou bílou hvězdu.',
  'et|gh': 'Etiopie má zelenou nahoře a modrý kruh s hvězdou, Ghana červenou nahoře a černou hvězdu.',
  'et|lt': 'Etiopie má zelenou nahoře a modrý kruh, Litva žlutou nahoře a nic.',
  'et|mm': 'Etiopie má zelenou nahoře a modrý kruh, Myanmar žlutou nahoře a bílou hvězdu.',
  'gh|lt': 'Ghana má červenou nahoře a černou hvězdu, Litva žlutou nahoře a nic.',
  'gh|mm': 'Ghana má červenou nahoře a černou hvězdu, Myanmar žlutou nahoře a velkou bílou.',
  'lt|mm': 'Myanmar má uprostřed velkou bílou hvězdu, Litva nic.',

  // --- kruh na jednobarevném poli ---
  'bd|jp': 'Bangladéš má zelené pole a kruh posunutý k žerdi, Japonsko bílé pole a kruh uprostřed.',
  'bd|pw': 'Bangladéš má zelené pole a červený kruh, Palau světle modré a žlutý.',
  'jp|pw': 'Japonsko má bílé pole a červený kruh uprostřed, Palau modré pole a žlutý kruh u žerdi.',
  'in|ne': 'Indie má uprostřed modré kolo s paprsky, Niger oranžový kruh.',

  // --- Union Jack v kantonu ---
  'au|nz': 'Nový Zéland má čtyři červené hvězdy, Austrálie šest bílých a jednu velkou pod Union Jackem.',
  'au|fj': 'Fidži má světle modré pole a vpravo štít, Austrálie tmavě modré a hvězdy Jižního kříže.',
  'fj|nz': 'Fidži má světle modré pole a štít, Nový Zéland tmavě modré a čtyři červené hvězdy.',
  'gb|gb-eng': 'Anglie je jen červený kříž na bílé, Spojené království má tři kříže přes sebe.',
  'gb|gb-sct': 'Skotsko je bílý šikmý kříž na modré, Spojené království má přes sebe i červené kříže.',
  'gb-eng|gb-sct': 'Anglie má bílé pole a rovný červený kříž, Skotsko modré pole a bílý kříž našikmo.',

  // --- pruhy s kantonem ---
  'lr|us': 'USA mají v kantonu padesát hvězd, Libérie jednu velkou.',
  'lr|my': 'Malajsie má v kantonu půlměsíc a hvězdu, Libérie jednu bílou hvězdu.',
  'my|us': 'USA mají padesát hvězd, Malajsie půlměsíc a jednu čtrnácticípou.',

  // --- středoamerické modro-bílo-modré ---
  'gt|hn': 'Guatemala má pruhy svislé, Honduras vodorovné s pěti modrými hvězdami.',
  'gt|ni': 'Guatemala má pruhy svislé, Nikaragua vodorovné a uprostřed trojúhelník s duhou.',
  'gt|sv': 'Guatemala má pruhy svislé, Salvador vodorovné.',
  'hn|ni': 'Honduras má uprostřed pět modrých hvězd, Nikaragua trojúhelník s duhou.',
  'hn|sv': 'Honduras má pět hvězd, Salvador znak s trojúhelníkem a nápisem.',
  'ni|sv': 'Nikaragua má ve znaku duhu, Salvador nápis DIOS UNION LIBERTAD.',

  // --- ostatní dvojice ---
  'co|ec': 'Ekvádor má uprostřed znak s kondorem, Kolumbie je bez znaku.',
  'co|ve': 'Venezuela má pruhy stejně široké a oblouk bílých hvězd, Kolumbie žlutý pruh přes půlku vlajky.',
  'ec|ve': 'Ekvádor má široký žlutý pruh a znak, Venezuela stejné pruhy a hvězdy.',
  'ar|uy': 'Argentina má tři pruhy a slunce uprostřed, Uruguay devět pruhů a slunce v bílém rohu.',
  'gr|uy': 'Řecko má v rohu bílý kříž na modré, Uruguay zlaté slunce na bílé.',
  'cl|cu': 'Chile má dva pruhy a modrý čtverec u žerdi, Kuba pět pruhů a červený trojúhelník.',
  'cn|vn': 'Čína má pět žlutých hvězd v rohu, Vietnam jednu velkou uprostřed.',
  'cz|ph': 'Filipíny mají v trojúhelníku slunce a hvězdy a pruhy modrý a červený, Česko modrý klín bez kresby.',
  'cr|th': 'Kostarika má široký prostřední pruh červený, Thajsko modrý.',
  'be|de': 'Belgie má pruhy svislé, Německo vodorovné – a v jiném pořadí.',
  'bg|hu': 'Bulharsko má bílou nahoře a zelenou uprostřed, Maďarsko červenou nahoře.',
  'bh|qa': 'Katar je vínový, hodně dlouhý a má devět zubů, Bahrajn červený a pět.',
  'dz|tn': 'Alžírsko je zeleno-bílé s červeným půlměsícem, Tunisko celé červené s bílým kruhem.',
  'dz|tr': 'Alžírsko je zeleno-bílé, Turecko celé červené.',
  'tn|tr': 'Tunisko má půlměsíc v bílém kruhu, Turecko přímo na červené.',
  'ht|li': 'Lichtenštejnsko má u žerdi zlatou korunu, Haiti ji nemá.',
};

/** Klíč dvojice – na pořadí kódů nezáleží. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Věta o rozdílu, nebo `null`, když ji pro dvojici nemáme. */
export function differenceFor(a: string, b: string): string | null {
  return flagDifferences[pairKey(a, b)] ?? null;
}
