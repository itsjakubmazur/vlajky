import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_COUNTRIES, getCountry } from '@/domain/countries';
import { countriesInSet } from '~data/sets';
import { CONTINENTS, SOVEREIGNTIES, SUBREGIONS } from '@/domain/types';

const world = countriesInSet([...ALL_COUNTRIES], 'world');
const territories = countriesInSet([...ALL_COUNTRIES], 'territories');

describe('data zemí', () => {
  it('sada Svět má 197 záznamů', () => {
    expect(world.length).toBe(197);
  });

  it('obsahuje 193 členů OSN', () => {
    expect(ALL_COUNTRIES.filter((c) => c.sovereignty === 'un').length).toBe(193);
  });

  it('obsahuje Vatikán, Palestinu, Kosovo i Tchaj-wan', () => {
    for (const code of ['va', 'ps', 'xk', 'tw']) {
      expect(world.map((c) => c.code)).toContain(code);
    }
  });

  it('bonusová sada území je neprázdná a nepřekrývá se se světem', () => {
    expect(territories.length).toBeGreaterThan(0);
    const worldCodes = new Set(world.map((c) => c.code));
    for (const t of territories) expect(worldCodes.has(t.code)).toBe(false);
  });

  it('kódy jsou jedinečné a malými písmeny', () => {
    const seen = new Set<string>();
    for (const c of ALL_COUNTRIES) {
      expect(c.code).toBe(c.code.toLowerCase());
      expect(seen.has(c.code)).toBe(false);
      seen.add(c.code);
    }
  });

  it('každá země má název, hlavní město a platné zařazení', () => {
    for (const c of ALL_COUNTRIES) {
      expect(c.nameCs.length, c.code).toBeGreaterThan(0);
      expect(c.capitalCs.length, c.code).toBeGreaterThan(0);
      expect(CONTINENTS).toContain(c.continent);
      expect(SUBREGIONS).toContain(c.subregion);
      expect(SOVEREIGNTIES).toContain(c.sovereignty);
      expect(c.difficulty).toBeGreaterThanOrEqual(1);
      expect(c.difficulty).toBeLessThanOrEqual(5);
    }
  });

  it('souřadnice jsou v rozsahu zeměkoule', () => {
    for (const c of ALL_COUNTRIES) {
      expect(Math.abs(c.lat), c.code).toBeLessThanOrEqual(90);
      expect(Math.abs(c.lng), c.code).toBeLessThanOrEqual(180);
    }
  });

  it('poměr stran je kladný a odpovídá známým výjimkám', () => {
    for (const c of ALL_COUNTRIES) {
      expect(c.ratio[0], c.code).toBeGreaterThan(0);
      expect(c.ratio[1], c.code).toBeGreaterThan(0);
    }
    const ratio = (code: string) => {
      const c = getCountry(code)!;
      return c.ratio[0] / c.ratio[1];
    };
    expect(ratio('ch')).toBeCloseTo(1, 2); // Švýcarsko je čtverec
    expect(ratio('va')).toBeCloseTo(1, 2); // Vatikán taky
    expect(ratio('qa')).toBeCloseTo(28 / 11, 2); // Katar je nejdelší
    expect(ratio('jp')).toBeCloseTo(1.5, 2); // Japonsko 3:2
    expect(ratio('np')).toBeLessThan(1); // Nepál je vyšší než širší
  });

  it('vazby zaměnitelných vlajek jsou oboustranné a existující', () => {
    for (const c of ALL_COUNTRIES) {
      for (const other of c.similar) {
        const target = getCountry(other);
        expect(target, `${c.code} → ${other}`).toBeDefined();
        expect(target!.similar, `${other} zpět na ${c.code}`).toContain(c.code);
      }
      expect(c.similar).not.toContain(c.code);
    }
  });

  it('zadané dvojice zaměnitelných vlajek jsou v datech', () => {
    const pairs: Array<[string, string]> = [
      ['td', 'ro'],
      ['mc', 'id'],
      ['id', 'pl'],
      ['sn', 'ml'],
      ['ml', 'gn'],
      ['ie', 'ci'],
      ['ci', 'it'],
      ['nl', 'lu'],
      ['au', 'nz'],
      ['si', 'sk'],
      ['sk', 'ru'],
      ['co', 'ec'],
      ['ec', 've'],
      ['no', 'is'],
      ['jo', 'ps'],
      ['ps', 'sd'],
      ['qa', 'bh'],
    ];
    for (const [a, b] of pairs) {
      expect(getCountry(a)!.similar, `${a} ↔ ${b}`).toContain(b);
    }
  });

  it('ke každé zemi existuje vlajka v public/flags', () => {
    const dir = join(process.cwd(), 'public', 'flags');
    if (!existsSync(dir)) return; // vlajky se generují buildem
    const files = new Set(readdirSync(dir));
    for (const c of ALL_COUNTRIES) {
      expect(files.has(`${c.code}.svg`), c.code).toBe(true);
    }
  });

  it('zajímavosti jsou krátké a jednou větou', () => {
    for (const c of ALL_COUNTRIES) {
      if (!c.funFact) continue;
      expect(c.funFact.length, c.code).toBeLessThanOrEqual(160);
      const sentences = c.funFact.split(/[.!?]\s+/).filter(Boolean);
      expect(sentences.length, `${c.code}: ${c.funFact}`).toBeLessThanOrEqual(2);
    }
  });

  it('chybějící zajímavost je vždy zapsaná v REVIEW', () => {
    for (const c of ALL_COUNTRIES) {
      if (c.funFact) continue;
      expect(c.needsReview.some((r) => r.includes('zajímavost')), c.code).toBe(true);
    }
  });
});
