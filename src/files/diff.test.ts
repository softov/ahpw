import { describe, expect, it } from 'vitest';
import { countChanges, diffLines, splitLines } from './diff.js';

describe('splitLines', () => {
  it('ends the last line at a trailing newline and gives an empty file no lines', () => {
    expect(splitLines('a\nb\n')).toEqual(['a', 'b']);
    expect(splitLines('')).toEqual([]);
  });
});

describe('diffLines', () => {
  it('finds one changed line among unchanged ones, with numbers on each side', () => {
    const before = ['one', 'two', 'three', 'four', 'five'].join('\n');
    const after = ['one', 'two', 'THREE', 'four', 'five'].join('\n');
    const hunks = diffLines(before, after);
    expect(hunks).toHaveLength(1);
    const changed = hunks[0]!.lines.filter((line) => line.kind !== 'context');
    expect(changed).toEqual([
      { kind: 'del', before: 3, after: null, text: 'three' },
      { kind: 'add', before: null, after: 3, text: 'THREE' },
    ]);
    expect(countChanges(hunks)).toEqual({ added: 1, removed: 1 });
  });

  it('reads a new file as every line added', () => {
    expect(countChanges(diffLines('', 'a\nb\n'))).toEqual({ added: 2, removed: 0 });
  });

  it('has nothing to say about two equal files', () => {
    expect(diffLines('same\n', 'same\n')).toEqual([]);
  });
});
