import { describe, expect, it } from 'vitest';
import type { SessionModelInfo } from '@microsoft/agent-host-protocol';
import { contextReadout, footerSide } from './footer.js';

const setting = (scope?: string) => ({ key: 'k', schema: { type: 'string' as const, title: 'K', ...(scope === undefined ? {} : { scope }) }, value: undefined });
const model = (maxContextWindow?: number): SessionModelInfo => ({ id: 'opus', provider: 'claude', name: 'Opus', ...(maxContextWindow === undefined ? {} : { maxContextWindow }) } as SessionModelInfo);

describe('footerSide', () => {
  it('puts a chat setting right, and a session setting or one with no scope left', () => {
    expect(footerSide(setting('chat'))).toBe('right');
    expect(footerSide(setting('session'))).toBe('left');
    expect(footerSide(setting())).toBe('left');
  });
});

describe('contextReadout', () => {
  it('says nothing without a context window', () => {
    expect(contextReadout(undefined, undefined)).toBeNull();
    expect(contextReadout(model(), { inputTokens: 10 })).toBeNull();
  });

  it('gives the window alone before a turn', () => {
    expect(contextReadout(model(200000), undefined)?.text).toBe('200k');
  });

  it('gives the last turn\'s input and cache over the window, with the exact counts in the title', () => {
    const got = contextReadout(model(200000), { inputTokens: 9000, cacheReadTokens: 3000 });
    expect(got?.text).toBe('12k / 200k');
    expect(got?.title).toBe('12,000 of 200,000 tokens used, as of the last turn');
  });
});
