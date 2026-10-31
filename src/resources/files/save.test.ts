import { describe, expect, it } from 'vitest';
import { AhpErrorCodes } from '@microsoft/agent-host-protocol';
import { changedOnHost, MAX_CHARS, readFailure, refusesWrite, shownText } from './save.js';

describe('file save', () => {
  it('shows a file whole up to the cap, and cuts it past', () => {
    expect(shownText('a\nb')).toEqual({ text: 'a\nb', cut: false });
    const long = shownText('x'.repeat(MAX_CHARS + 1));
    expect(long.cut).toBe(true);
    expect(long.text.length).toBe(MAX_CHARS);
  });

  it('tells a refused write from one that failed', () => {
    expect(refusesWrite(Object.assign(new Error('denied'), { code: -32009 }))).toBe(true);
    expect(refusesWrite(Object.assign(new Error('missing'), { code: -32008 }))).toBe(false);
    expect(refusesWrite(new Error('Not connected to the host.'))).toBe(false);
    expect(refusesWrite(null)).toBe(false);
  });

  it('tells a file changed on the host from other failures', () => {
    expect(changedOnHost(Object.assign(new Error('changed'), { code: -32011 }))).toBe(true);
    expect(changedOnHost(Object.assign(new Error('denied'), { code: -32009 }))).toBe(false);
    expect(changedOnHost('nope')).toBe(false);
  });
});

describe('readFailure', () => {
  it('says a file gone or refused in words, and keeps any other message as the host gave it', () => {
    expect(readFailure({ code: AhpErrorCodes.NotFound, message: 'RPC error -32008: No file at file:///x' })).toBe('This file no longer exists.');
    expect(readFailure({ code: AhpErrorCodes.PermissionDenied })).toBe("You don't have permission to read this file.");
    expect(readFailure(new Error('Not connected to the host.'))).toBe('Not connected to the host.');
  });
});
