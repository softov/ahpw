import { describe, expect, it } from 'vitest';
import type { Turn } from '@microsoft/agent-host-protocol';
import { factsOf, tokens, totalsOf } from './turn.js';

const turn = (fields: Record<string, unknown>): Turn => ({
  id: 't',
  message: { text: 'hi', origin: { kind: 'user' } },
  responseParts: [],
  usage: undefined,
  state: 'complete',
  ...fields,
}) as unknown as Turn;

describe('factsOf', () => {
  it('reads time, model, tokens and tool calls', () => {
    const facts = factsOf(turn({
      startedAt: '2026-10-06T10:00:00.000Z',
      duration: 4200,
      usage: { inputTokens: 1200, outputTokens: 80, model: 'sonnet' },
      responseParts: [{ kind: 'toolCall' }, { kind: 'markdown' }, { kind: 'toolCall' }],
    }));
    expect(facts).toEqual({ startedAt: Date.parse('2026-10-06T10:00:00.000Z'), duration: 4200, model: 'sonnet', input: 1200, output: 80, tools: 2 });
  });

  it('takes the model the message chose over the one usage reports', () => {
    expect(factsOf(turn({ message: { text: '', origin: { kind: 'user' }, model: { id: 'opus' } }, usage: { model: 'sonnet' } })).model).toBe('opus');
  });
});

describe('tokens', () => {
  it('shortens large counts', () => {
    expect(tokens(950)).toBe('950');
    expect(tokens(1234)).toBe('1.2k');
    expect(tokens(45_600)).toBe('46k');
    expect(tokens(1_250_000)).toBe('1.3M');
    expect(tokens(8000)).toBe('8k');
    expect(tokens(2_000_000)).toBe('2M');
  });
});

describe('totalsOf', () => {
  it('adds the turns up and lists each model once', () => {
    const totals = totalsOf([
      turn({ duration: 1000, usage: { inputTokens: 10, outputTokens: 1, model: 'a' } }),
      turn({ duration: 2000, usage: { inputTokens: 5, outputTokens: 2, model: 'a' } }),
    ]);
    expect(totals).toEqual({ turns: 2, working: 3000, input: 15, output: 3, tools: 0, models: ['a'] });
  });
});
