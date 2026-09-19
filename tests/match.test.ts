import { describe, expect, it } from 'vitest';
import { ALL_COUNTRIES } from '@/domain/countries';
import { buildAnswerIndex, checkAnswer } from '@/domain/answer/match';

const index = buildAnswerIndex(ALL_COUNTRIES);
const check = (input: string, target: string) => checkAnswer(input, target, index);

describe('porovnání odpovědi – základ', () => {
  it('uzná přesnou shodu bez ohledu na diakritiku a mezery', () => {
    expect(check('Čad', 'td').correct).toBe(true);
    expect(check('cad', 'td').correct).toBe(true);
    expect(check('  ČAD. ', 'td').correct).toBe(true);
  });

  it('uzná úřední název i alias', () => {
    expect(check('Česko', 'cz').correct).toBe(true);
    expect(check('Česká republika', 'cz').correct).toBe(true);
    expect(check('ČR', 'cz').correct).toBe(true);
    expect(check('USA', 'us').correct).toBe(true);
    expect(check('Amerika', 'us').correct).toBe(true);
    expect(check('Holandsko', 'nl').correct).toBe(true);
    expect(check('Barma', 'mm').correct).toBe(true);
  });

  it('prázdný vstup není odpověď', () => {
    expect(check('', 'td').verdict).toBe('empty');
    expect(check('   ', 'td').verdict).toBe('empty');
  });

  it('nesmysl je neznámá odpověď, ne chybná země', () => {
    expect(check('qwertz', 'td').verdict).toBe('unknown');
  });
});

describe('porovnání odpovědi – tolerance překlepu', () => {
  it('uzná drobný překlep u dlouhých názvů', () => {
    expect(check('Portugalskoo', 'pt').verdict).toBe('typo');
    expect(check('Španielsko', 'es').verdict).toBe('typo');
    expect(check('Kazachstan', 'kz').correct).toBe(true);
    expect(check('Nizozemsko', 'nl').correct).toBe(true);
  });

  it('u krátkých názvů trvá na přesnosti', () => {
    // „Čad“ má 3 znaky – jediné písmeno navíc už uznat nelze
    expect(check('cadd', 'td').correct).toBe(false);
    expect(check('mali', 'ml').correct).toBe(true);
    expect(check('malii', 'ml').correct).toBe(false);
  });
});

describe('porovnání odpovědi – jiná země nikdy neprojde', () => {
  const pairs: Array<[input: string, target: string, matched: string]> = [
    ['Nigérie', 'ne', 'ng'],
    ['Niger', 'ng', 'ne'],
    ['Guinea', 'gw', 'gn'],
    ['Guinea', 'gq', 'gn'],
    ['Guinea-Bissau', 'gn', 'gw'],
    ['Rovníková Guinea', 'gn', 'gq'],
    ['Dominika', 'do', 'dm'],
    ['Dominikánská republika', 'dm', 'do'],
    ['Rakousko', 'au', 'at'],
    ['Austrálie', 'at', 'au'],
    ['Slovinsko', 'sk', 'si'],
    ['Slovensko', 'si', 'sk'],
    ['Irák', 'ir', 'iq'],
    ['Írán', 'iq', 'ir'],
    ['Malawi', 'ml', 'mw'],
    ['Maledivy', 'ml', 'mv'],
    ['Mali', 'mw', 'ml'],
    ['Severní Korea', 'kr', 'kp'],
    ['Jižní Korea', 'kp', 'kr'],
    ['Súdán', 'ss', 'sd'],
    ['Jižní Súdán', 'sd', 'ss'],
  ];

  it.each(pairs)('„%s“ při otázce na %s je chyba (napsal %s)', (input, target, matched) => {
    const result = check(input, target);
    expect(result.correct).toBe(false);
    expect(result.verdict).toBe('wrongCountry');
    expect(result.matchedCode).toBe(matched);
  });

  it('samotné Kongo se nepočítá ani jedné zemi – aplikace se doptá', () => {
    for (const target of ['cg', 'cd']) {
      const result = check('Kongo', target);
      expect(result.verdict, target).toBe('ambiguous');
      expect(result.correct, target).toBe(false);
      expect(result.candidates, target).toEqual(['cg', 'cd']);
    }
  });

  it('upřesněné Kongo už projde', () => {
    expect(check('Konžská republika', 'cg').correct).toBe(true);
    expect(check('Kongo-Brazzaville', 'cg').correct).toBe(true);
    expect(check('DR Kongo', 'cd').correct).toBe(true);
    expect(check('Demokratická republika Kongo', 'cd').correct).toBe(true);
  });

  it('dvojznačnost platí jen tam, kde dává smysl', () => {
    // u otázky na Japonsko je „Kongo“ prostě špatná odpověď, ne nejasná
    expect(check('Kongo', 'jp').verdict).not.toBe('ambiguous');
  });

  it('Anglie není Spojené království', () => {
    const result = check('Anglie', 'gb');
    expect(result.correct).toBe(false);
    expect(result.matchedCode).toBe('gb-eng');
    expect(check('Velká Británie', 'gb').correct).toBe(true);
    expect(check('Anglie', 'gb-eng').correct).toBe(true);
  });

  it('překlep se neuzná, pokud je stejně blízko jiná země', () => {
    // „Irsko“ a „Rusko“ dělí jediné písmeno – ani jedno nesmí projít za druhé
    expect(check('Rusko', 'ie').correct).toBe(false);
    expect(check('Irsko', 'ru').correct).toBe(false);
  });
});

describe('rejstřík odpovědí', () => {
  it('žádný normalizovaný název nepatří dvěma zemím', () => {
    for (const [label, codes] of index.byLabel) {
      expect(codes.length, `„${label}“ → ${codes.join(', ')}`).toBe(1);
    }
  });

  it('každá země má aspoň jeden tvar odpovědi', () => {
    for (const country of ALL_COUNTRIES) {
      expect(index.labelsByCode.get(country.code)?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('každá země projde sama za sebe', () => {
    for (const country of ALL_COUNTRIES) {
      expect(check(country.nameCs, country.code).correct, country.nameCs).toBe(true);
    }
  });
});
