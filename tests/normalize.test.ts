import { describe, expect, it } from 'vitest';
import { normalize, normalizeTight } from '@/domain/text/normalize';
import { levenshtein, typoTolerance } from '@/domain/text/levenshtein';

describe('normalizace', () => {
  it('odstraní diakritiku', () => {
    expect(normalize('Čad')).toBe('cad');
    expect(normalize('Ázerbájdžán')).toBe('azerbajdzan');
    expect(normalize('Pobřeží slonoviny')).toBe('pobrezi slonoviny');
    expect(normalize('Švýcarsko')).toBe('svycarsko');
  });

  it('srovná velikost písmen, mezery a interpunkci', () => {
    expect(normalize('  ČAD.  ')).toBe('cad');
    expect(normalize('Česká   republika!')).toBe('ceska republika');
    expect(normalize('U.S.A.')).toBe('u s a');
  });

  it('bere spojovník jako mezeru, ne jako nic', () => {
    expect(normalize('Guinea-Bissau')).toBe('guinea bissau');
    expect(normalize('Guinea Bissau')).toBe('guinea bissau');
    expect(normalize('Papua-Nová Guinea')).toBe('papua nova guinea');
  });

  it('zvládne prázdný vstup', () => {
    expect(normalize('')).toBe('');
    expect(normalize('   ')).toBe('');
    expect(normalize('...')).toBe('');
  });

  it('normalizeTight zahodí i mezery', () => {
    expect(normalizeTight('Nový Zéland')).toBe('novyzeland');
  });
});

describe('levenshtein', () => {
  it('počítá vzdálenost', () => {
    expect(levenshtein('cad', 'cad')).toBe(0);
    expect(levenshtein('niger', 'nigerie')).toBe(2);
    expect(levenshtein('kongo', 'dr kongo')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('odřízne výpočet nad limitem', () => {
    expect(levenshtein('abcdefgh', 'zzzzzzzz', 2)).toBe(3);
  });

  it('tolerance roste s délkou názvu', () => {
    expect(typoTolerance(3)).toBe(0);
    expect(typoTolerance(5)).toBe(0);
    expect(typoTolerance(6)).toBe(1);
    expect(typoTolerance(10)).toBe(1);
    expect(typoTolerance(11)).toBe(2);
  });
});
