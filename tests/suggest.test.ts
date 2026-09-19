import { describe, expect, it } from 'vitest';
import { ALL_COUNTRIES } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { suggestCountries } from '@/domain/answer/suggest';

const world = countriesInSet([...ALL_COUNTRIES], 'world');
const codes = (input: string, limit?: number) =>
  suggestCountries(input, world, limit).map((s) => s.country.code);

describe('našeptávač', () => {
  it('mlčí pod dva znaky', () => {
    expect(suggestCountries('', world)).toEqual([]);
    expect(suggestCountries('c', world)).toEqual([]);
  });

  it('napovídá od dvou znaků', () => {
    expect(codes('ni')).toContain('ne');
    expect(codes('ni')).toContain('ng');
  });

  it('nezáleží na diakritice', () => {
    expect(codes('cad')).toContain('td');
    expect(codes('čad')).toContain('td');
    expect(codes('spanel')).toContain('es');
  });

  it('dává přednost shodě od začátku názvu', () => {
    expect(codes('slov')[0]).toBe('sk');
    expect(codes('slov')).toContain('si');
  });

  it('najde zemi i podle aliasu', () => {
    expect(codes('holand')).toContain('nl');
    expect(codes('usa')).toContain('us');
  });

  it('najde i podle druhého slova v názvu', () => {
    expect(codes('slonoviny')).toContain('ci');
  });

  it('snese překlep u delšího dotazu', () => {
    expect(codes('portugalskoo')).toContain('pt');
  });

  it('nikdy nevrátí víc než limit', () => {
    expect(codes('a', 6).length).toBeLessThanOrEqual(6);
    expect(codes('an', 3).length).toBeLessThanOrEqual(3);
  });

  it('nenabízí země mimo aktivní sadu', () => {
    // Anglie je v bonusové sadě území, ne ve světě
    expect(codes('angli')).not.toContain('gb-eng');
  });
});
