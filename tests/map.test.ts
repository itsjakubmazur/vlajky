import { describe, expect, it } from 'vitest';
import { ALL_COUNTRIES } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { rotationFor, worldGeometry } from '@/components/map/geometry';

const world = countriesInSet([...ALL_COUNTRIES], 'world');
const codesIn = (continent: string) =>
  world.filter((c) => c.continent === continent).map((c) => c.code);

describe('pootočení projekce', () => {
  it('části světa, které nelámou šev, se neotáčejí', () => {
    // Jejich mapa musí zůstat přesně taková, jaká byla.
    for (const continent of ['europe', 'asia', 'africa', 'northAmerica', 'southAmerica']) {
      expect(rotationFor(codesIn(continent)), continent).toBe(0);
    }
    expect(rotationFor(world.map((c) => c.code))).toBe(0);
  });

  it('Oceánie se vystředí na Pacifik', () => {
    const rotation = rotationFor(codesIn('oceania'));
    expect(rotation).not.toBe(0);
    // Střed Oceánie leží kolem 161° v. d., takže se otáčí o tolik zpátky.
    expect(rotation).toBeGreaterThan(-175);
    expect(rotation).toBeLessThan(-145);
  });

  it('jedna země ani prázdný seznam neotáčí ničím', () => {
    expect(rotationFor(['cz'])).toBe(0);
    expect(rotationFor([])).toBe(0);
  });
});

describe('výřez pro Oceánii', () => {
  const codes = codesIn('oceania');

  it('bez pootočení se roztáhne přes celý svět', () => {
    const plain = worldGeometry(0);
    const frame = plain.frameFor(codes);
    expect(frame.scale).toBe(1);
  });

  it('s pootočením se zmenší na Pacifik', () => {
    const turned = worldGeometry(rotationFor(codes));
    const frame = turned.frameFor(codes);
    expect(frame.scale).toBeLessThan(0.5);
  });

  it('a všechny oceánské země se do něj vejdou', () => {
    const turned = worldGeometry(rotationFor(codes));
    const [x, y, width, height] = turned.frameFor(codes).viewBox.split(' ').map(Number) as [
      number,
      number,
      number,
      number,
    ];
    for (const code of codes) {
      const country = world.find((c) => c.code === code)!;
      const point = turned.project(country.lng, country.lat);
      expect(point, country.nameCs).not.toBeNull();
      expect(point![0], country.nameCs).toBeGreaterThanOrEqual(x);
      expect(point![0], country.nameCs).toBeLessThanOrEqual(x + width);
      expect(point![1], country.nameCs).toBeGreaterThanOrEqual(y);
      expect(point![1], country.nameCs).toBeLessThanOrEqual(y + height);
    }
  });
});
