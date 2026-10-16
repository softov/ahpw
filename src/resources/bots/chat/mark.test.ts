import { describe, expect, it } from 'vitest';
import type { Turn } from '@microsoft/agent-host-protocol';
import { botMarkOf, chatItems } from './mark.js';

const turn = (text: string, parts: unknown[]): Turn => ({ id: 't1', message: { text }, responseParts: parts } as unknown as Turn);

describe('botMarkOf', () => {
  it('reads the mark a chat session carries, and nothing from a session without one', () => {
    expect(botMarkOf({ bot: 'backer', name: 'Backer', color: 'teal', labels: ['ops', 3], body: 'cloud', kind: 'direct' }))
      .toEqual({ bot: 'backer', name: 'Backer', color: 'teal', labels: ['ops'], body: 'cloud', kind: 'direct' });
    expect(botMarkOf({ bot: 'x' })).toEqual({ bot: 'x', name: 'x', labels: [], body: 'robot', kind: 'direct' });
    expect(botMarkOf({ git: { branch: 'main' } })).toBeUndefined();
    expect(botMarkOf(undefined)).toBeUndefined();
  });
});

describe('chatItems', () => {
  it('shows what is said, the reply text and files in one bubble, and notices apart; tools stay out', () => {
    expect(chatItems(turn('the report, please', [
      { kind: 'toolCall', toolCall: {} },
      { kind: 'markdown', id: 'm1', content: 'here are the files you asked for' },
      { kind: 'contentRef', uri: 'file:///out/sales-october.pdf', contentType: 'application/pdf' },
      { kind: 'reasoning', content: 'thinking' },
      { kind: 'systemNotification', content: { markdown: 'Backer was paused' } },
      { kind: 'markdown', id: 'm2', content: 'and one more' },
    ]), false)).toEqual([
      { kind: 'said', text: 'the report, please' },
      { kind: 'reply', texts: ['here are the files you asked for'], files: [{ uri: 'file:///out/sales-october.pdf', name: 'sales-october.pdf', contentType: 'application/pdf' }] },
      { kind: 'notice', text: 'Backer was paused', tone: 'quiet' },
      { kind: 'reply', texts: ['and one more'], files: [] },
    ]);
  });

  it('says a finished turn had no reply, but not while it runs', () => {
    expect(chatItems(turn('hi', []), false)).toEqual([{ kind: 'said', text: 'hi' }, { kind: 'noReply' }]);
    expect(chatItems(turn('hi', []), true)).toEqual([{ kind: 'said', text: 'hi' }]);
  });

  it('shows an error as a red notice', () => {
    expect(chatItems(turn('hi', [{ kind: 'error', error: { message: 'out of credit' } }]), false))
      .toEqual([{ kind: 'said', text: 'hi' }, { kind: 'notice', text: 'out of credit', tone: 'danger' }]);
  });
});
