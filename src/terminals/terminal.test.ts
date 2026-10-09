import { describe, expect, it } from 'vitest';
import { deltaOf, foldTerminal, holderOf, joinParts, newTerminalUri, normalizeState } from './terminal.js';

describe('terminal', () => {
  it('joins parts by their type', () => {
    expect(joinParts([
      { type: 'unclassified', value: 'a' },
      { type: 'command', commandId: 'c', commandLine: 'ls', output: 'b', isComplete: false },
    ] as never)).toBe('ab');
  });

  it('fills the fields the reducer reads', () => {
    const state = normalizeState({ title: 'sh' });
    expect(state.content).toEqual([]);
    expect(state.lifecycle).toEqual({ status: 'running' });
    expect((state.claim as { kind: string }).kind).toBe('client');
  });

  it('folds data into a snapshot that had no content', () => {
    const state = foldTerminal({ title: 'sh' }, { type: 'terminal/data', data: 'hi' });
    expect(joinParts(state.content)).toBe('hi');
  });

  it('writes the tail, or everything after a clear', () => {
    expect(deltaOf('abc', 'abcde')).toEqual({ reset: false, text: 'de' });
    expect(deltaOf('abc', 'x')).toEqual({ reset: true, text: 'x' });
  });

  it('says who holds the keyboard', () => {
    expect(holderOf({ kind: 'client', clientId: 'me' }, 'me')).toEqual({ kind: 'you' });
    expect(holderOf({ kind: 'client', clientId: 'other' }, 'me')).toEqual({ kind: 'another' });
    expect(holderOf({ kind: 'session', session: 's://1' }, 'me')).toEqual({ kind: 'session', session: 's://1' });
  });

  it('mints distinct terminal URIs', () => {
    expect(newTerminalUri()).not.toBe(newTerminalUri());
    expect(newTerminalUri()).toMatch(/^ahp-terminal:\//);
  });
});
