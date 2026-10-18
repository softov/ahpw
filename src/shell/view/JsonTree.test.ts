import { expect, test } from 'vitest';
import { previewOf } from './JsonTree.js';

test('a closed object shows its first keys and values, a nested branch as its braces', () => {
  expect(previewOf({ kind: 'mcp', customizationId: 'mcp:ahp' })).toBe('{kind: "mcp", customizationId: "mcp:ahp"}');
  expect(previewOf({ a: 1, b: null, c: { d: true }, e: [1] })).toBe('{a: 1, b: null, c: {…}, e: […]}');
});

test('a closed array shows its length and first items', () => {
  expect(previewOf([{ type: 'text' }, 2])).toBe('(2) [{…}, 2]');
});

test('a long preview is cut where an entry no longer fits, and says there is more', () => {
  expect(previewOf({ text: 'x'.repeat(10), more: 'y'.repeat(60) }, 30)).toBe('{text: "xxxxxxxxxx", …}');
  expect(previewOf({ only: 'z'.repeat(80) }, 20)).toBe('{only: "zzzzzzzzzzzzz, …}');
});
