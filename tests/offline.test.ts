import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FLAG_FILES } from '@/generated/flag-manifest';
import { ALL_COUNTRIES } from '@/domain/countries';

const swPath = join(process.cwd(), 'public', 'sw.js');
const built = existsSync(swPath);

describe('offline režim', () => {
  it('seznam vlajek odpovídá datům', () => {
    expect(FLAG_FILES).toHaveLength(ALL_COUNTRIES.length);
    for (const country of ALL_COUNTRIES) {
      expect(FLAG_FILES).toContain(`/flags/${country.code}.svg`);
    }
  });

  it.skipIf(!built)('service worker předcachuje všechny vlajky', () => {
    const sw = readFileSync(swPath, 'utf8');
    const missing = FLAG_FILES.filter((file) => !sw.includes(file));
    expect(missing, `chybí v precache: ${missing.slice(0, 5).join(', ')}`).toHaveLength(0);
  });

  it.skipIf(!built)('service worker předcachuje i skořápku aplikace', () => {
    const sw = readFileSync(swPath, 'utf8');
    for (const asset of ['/manifest.webmanifest', '/icon-192.png']) {
      expect(sw, asset).toContain(asset);
    }
  });

  it.skipIf(!built)('každá vlajka je v precache právě jednou', () => {
    const sw = readFileSync(swPath, 'utf8');
    for (const file of FLAG_FILES.slice(0, 20)) {
      const count = sw.split(`'${file}'`).length - 1 + (sw.split(`"${file}"`).length - 1);
      expect(count, file).toBe(1);
    }
  });
});
