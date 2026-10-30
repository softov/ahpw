import { describe, expect, it } from 'vitest';
import { messageOf } from './Composer.js';

describe('messageOf', () => {
  it('names the chosen custom agent', () => {
    expect(messageOf('hi', undefined, [], 'file:///home/me/.claude/agents/review.md')).toEqual({
      text: 'hi',
      origin: { kind: 'user' },
      agent: { uri: 'file:///home/me/.claude/agents/review.md' },
    });
  });

  it('leaves the agent out for the harness default', () => {
    expect(messageOf('hi', 'sonnet', [])).toEqual({ text: 'hi', origin: { kind: 'user' }, model: { id: 'sonnet' } });
  });
});
