import { describe, expect, it } from 'vitest';
import type { ResponsePart } from '@microsoft/agent-host-protocol';
import { groupParts, hostSpan, stepDone, summaryLine, type Group } from './activity.js';

const tool = (id: string, status = 'completed', fields: Record<string, unknown> = {}): ResponsePart =>
  ({ kind: 'toolCall', toolCall: { toolCallId: id, toolName: 'Bash', displayName: 'Bash', status, success: true, ...fields } }) as unknown as ResponsePart;
const think = (id: string, content = 'hmm'): ResponsePart => ({ kind: 'reasoning', id, content }) as unknown as ResponsePart;
const text = (id: string, content = 'said'): ResponsePart => ({ kind: 'markdown', id, content }) as unknown as ResponsePart;
const words = (ms: number): string => `${Math.round(ms / 1000)}s`;

describe('groupParts', () => {
  it('gathers each run of calls and thinking, broken by prose', () => {
    const shown = groupParts([think('r1'), tool('a'), tool('b'), text('m1'), tool('c')], false);
    expect(shown.map((one) => (one.kind === 'part' ? `part ${one.index}` : one.steps.map((step) => step.key).join(',')))).toEqual(['r1,a,b', 'part 3', 'c']);
  });

  it('skips blank prose and empty thinking without breaking the run', () => {
    const shown = groupParts([tool('a'), text('m', '  '), think('r', ''), tool('b')], false);
    expect(shown).toHaveLength(1);
    expect((shown[0] as Group).steps.map((step) => step.key)).toEqual(['a', 'b']);
  });

  it('makes only the last run of a running turn live', () => {
    const shown = groupParts([tool('a'), text('m'), tool('b', 'running')], true) as Group[];
    expect([shown[0]!.live, shown[2]!.live]).toEqual([false, true]);
    expect(shown[0]!.ended).toBe(false);
  });

  it('gives a lone run its turn\'s time once the turn ended', () => {
    expect((groupParts([tool('a')], false, 4000)[0] as Group).turnMs).toBe(4000);
    expect((groupParts([tool('a'), text('m'), tool('b')], false, 4000)[0] as Group).turnMs).toBeUndefined();
  });
});

describe('stepDone', () => {
  it('ends a call when it settles or its turn ends, and thinking when something follows', () => {
    const [group] = groupParts([tool('a', 'running'), think('r')], true) as Group[];
    expect(stepDone(group!.steps[0]!, false, group!)).toBe(false);
    expect(stepDone(group!.steps[1]!, true, group!)).toBe(false);
    expect(stepDone(group!.steps[0]!, false, { live: false, ended: true })).toBe(true);
    expect(stepDone(group!.steps[1]!, true, { live: false, ended: false })).toBe(true);
  });
});

describe('hostSpan', () => {
  it('runs from the first start to the last end when every call is timed', () => {
    const meta = (at: string, ms: number) => ({ _meta: { 'ahpd.startedAt': at, 'ahpd.durationMs': ms } });
    const [group] = groupParts([tool('a', 'completed', meta('2026-10-06T10:00:00Z', 2000)), tool('b', 'completed', meta('2026-10-06T10:00:05Z', 1000))], false) as Group[];
    expect(hostSpan(group!.steps)).toBe(6000);
    expect(hostSpan(groupParts([tool('c')], false).flatMap((one) => (one.kind === 'activity' ? one.steps : [])))).toBeUndefined();
  });
});

describe('summaryLine', () => {
  it('says what was done and what is running', () => {
    expect(summaryLine({ done: 5, failed: 0, took: 12000 }, words)).toBe('Completed 5 steps in 12s');
    expect(summaryLine({ done: 1, failed: 1, took: 400 }, words)).toBe('Completed 1 step (1 failed)');
    expect(summaryLine({ done: 2, failed: 0, doing: { what: 'working', name: 'Bash', for: 3000 } }, words)).toBe('Completed 2 steps \u{00B7} Working on Bash for 3s');
    expect(summaryLine({ done: 0, failed: 0, doing: { what: 'waiting', name: 'Edit' } }, words)).toBe('Waiting on Edit');
    expect(summaryLine({ done: 0, failed: 0, doing: { what: 'thinking' } }, words)).toBe('Thinking');
  });
});
