import { expect, test } from 'vitest';
import { draftOf, renamedFor } from './draft.js';
import { bodyName } from './look.js';

test('a body offers bood\'s name for it, through an old tag too, and nothing for a body bood does not draw', () => {
  expect(bodyName('robot')).toBe('Boppo');
  expect(bodyName(' Semicircle ')).toBe('Jello');
  expect(bodyName('rectangle')).toBe('Brik');
  expect(bodyName('teapot')).toBe('');
});

test('a new bot starts with its body\'s name', () => {
  const draft = draftOf(undefined, []);
  expect(draft.name).toBe(bodyName(draft.body));
});

test('a changed body takes the name along while it is empty or the old body\'s, and keeps one somebody typed', () => {
  expect(renamedFor('Boppo', 'robot', 'cloud')).toBe('Nimbo');
  expect(renamedFor('  ', 'robot', 'cloud')).toBe('Nimbo');
  expect(renamedFor('Boppo', 'robot', 'teapot')).toBe('');
  expect(renamedFor('Ana', 'robot', 'cloud')).toBe('Ana');
});
