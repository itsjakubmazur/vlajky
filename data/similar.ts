/**
 * Skupiny zaměnitelných vlajek. Build z nich udělá symetrické pole `similar`
 * u každé země (každý s každým v rámci skupiny).
 *
 * Skupiny se smí překrývat – např. Čad je v modro-žluto-červené skupině
 * i ve dvojici s Rumunskem.
 */
export const similarGroups: string[][] = [
  // --- zadané dvojice a trojice ---
  ['td', 'ro'],
  ['mc', 'id', 'pl'],
  ['sn', 'ml', 'gn'],
  ['ie', 'ci', 'it'],
  ['nl', 'lu'],
  ['au', 'nz'],
  ['si', 'sk', 'ru'],
  ['co', 'ec', 've'],
  ['no', 'is'],
  ['jo', 'ps', 'sd'],
  ['qa', 'bh'],

  // --- doplněné skupiny ---
  ['ro', 'td', 'md', 'ad'],            // modro-žluto-červené svislé pruhy
  ['sn', 'ml', 'gn', 'cm'],            // panafrické svislé pruhy
  ['si', 'sk', 'ru', 'rs'],            // slovanské trikolóry se znakem
  ['is', 'no', 'dk', 'fi', 'se'],      // severské kříže
  ['dk', 'fo', 'ax'],                  // severské kříže (bonus)
  ['jo', 'ps', 'sd', 'kw', 'eh'],      // panarabské s trojúhelníkem u žerdi
  ['ye', 'eg', 'iq'],                  // červeno-bílo-černé pruhy
  // Sýrie sem patřila do roku 2024; nová vlajka je zeleno-bílo-černá.
  ['at', 'lv'],                        // červeno-bílo-červené vodorovné
  ['pe', 'ca'],                        // červeno-bílo-červené svislé
  ['lr', 'us', 'my'],                  // pruhy s kantonem
  ['it', 'ie', 'ci', 'mx'],            // zeleno-bílo-červené svislé
  ['gt', 'ni', 'sv', 'hn'],            // středoamerické modro-bílo-modré
  ['ar', 'uy'],                        // májové slunce
  ['cz', 'ph'],                        // trojúhelník u žerdi
  ['cn', 'vn'],                        // červená se žlutou hvězdou
  ['tr', 'tn', 'dz'],                  // červená s půlměsícem a hvězdou
  ['ne', 'in'],                        // oranžovo-bílo-zelená s kruhem
  ['jp', 'bd', 'pw'],                  // kruh na jednobarevném poli
  ['bo', 'gh', 'et', 'lt', 'mm'],      // zeleno-žluto-červené vodorovné
  ['au', 'nz', 'fj'],                  // Union Jack v kantonu
  ['nl', 'lu', 'py'],                  // červeno-bílo-modré vodorovné
  ['be', 'de'],                         // černo-žluto-červená
  ['ss', 'ke', 'sd'],                  // černo-červeno-zelená s trojúhelníkem
  ['cr', 'th'],                        // pět pruhů se širokým prostředním
  ['ht', 'li'],                        // modro-červená vodorovná
  ['gr', 'uy'],                        // modro-bílé pruhy
  ['cl', 'cu'],                        // modré pole s bílou hvězdou
  ['hu', 'bg'],                        // bílo-zeleno-červená / bílo-zeleno-červená
  ['ae', 'kw'],                        // panarabské s pruhem u žerdi
  ['gb', 'gb-eng', 'gb-sct'],          // Union Jack a jeho části
];
