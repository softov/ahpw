import { describe, expect, it } from 'vitest';
import { yamlOf, yamlProblem } from './yamlView.js';

describe('yamlProblem', () => {
  it('reads a mapping back to the value it was written from', () => {
    const value = { env: { ANTHROPIC_MODEL: 'deepseek-flash', KEY: { fromEnv: 'DEEPSEEK_API_KEY' }, GONE: null }, models: ['a', { id: 'b' }], thinking: true };
    expect(yamlProblem(yamlOf(value))).toEqual({ parsed: value, error: null });
  });

  it('writes an empty value as empty text and reads it back as one', () => {
    expect(yamlOf({})).toBe('');
    expect(yamlProblem('  \n')).toEqual({ parsed: {}, error: null });
  });

  it('says why text that is not a mapping is refused', () => {
    expect(yamlProblem('- a\n- b').error).toBe('The YAML must be a mapping.');
    expect(yamlProblem('a: [1, 2').error).toMatch(/at line 1, column \d+:$/);
  });
});
