import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = fileURLToPath(new URL('.', import.meta.url));

describe('the plugin', () => {
  // The daemon loads it into its own process, which has its own cofold.
  it('imports nothing from cofold or the CLI', () => {
    const sources = readdirSync(HERE).filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'));
    expect(sources.length).toBeGreaterThan(0);
    for (const file of sources) {
      const text = readFileSync(join(HERE, file), 'utf8');
      expect(text, file).not.toMatch(/from\s+['"]@cofold\//);
      expect(text, file).not.toMatch(/from\s+['"]\.\.\/cli\//);
    }
  });
});
