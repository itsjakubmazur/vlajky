import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const domainFiles = walk(join(process.cwd(), 'src', 'domain')).filter((f) => f.endsWith('.ts'));

/** Komentáře nás nezajímají – hlídáme skutečný kód. */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

describe('architektura', () => {
  it('doménová logika nesahá na React ani Next', () => {
    for (const file of domainFiles) {
      expect(/from '(react|next)/.test(code(file)), file).toBe(false);
    }
  });

  it('doménová logika nesahá na window ani localStorage', () => {
    for (const file of domainFiles) {
      expect(/\b(window|document|localStorage)\b/.test(code(file)), file).toBe(false);
    }
  });

  it('české texty jsou jen v i18n, ne roztroušené v komponentách', () => {
    const uiFiles = walk(join(process.cwd(), 'src', 'components')).filter((f) => f.endsWith('.tsx'));
    for (const file of uiFiles) {
      // komentáře smíme psát česky, hlídáme jen texty v JSX
      const content = code(file);
      const suspicious = content.match(/>[^<>{}]*[áčďéěíňóřšťúůýž][^<>{}]*</gi) ?? [];
      expect(suspicious, `${file}: ${suspicious.join(' | ')}`).toHaveLength(0);
    }
  });
});
