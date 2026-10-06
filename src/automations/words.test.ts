import { describe, expect, it } from 'vitest';
import type { AutomationEntry } from '@microsoft/agent-host-protocol';
import { cronWords, definitionOf, draftOf, draftProblem, runFacts, stateOf } from './words.js';

const entry = (fields: Record<string, unknown> = {}, definition: Record<string, unknown> = {}): AutomationEntry => ({
  resource: 'ahp-automation:/a',
  definition: {
    title: 'Nightly',
    message: { text: 'Run the tests', origin: { kind: 'automation' } },
    session: { provider: 'claude', model: { id: 'opus' }, workingDirectories: ['file:///src/app'] },
    enabled: true,
    triggers: [
      { id: 'schedule', kind: 'schedule', schedule: { expression: '0 9 * * *', timeZone: 'America/Campo_Grande' } },
      { id: 'pr', kind: 'event', type: 'github', title: 'On a pull request', events: [] },
    ],
    disableConditions: [{ kind: 'afterRuns', max: 3 }],
    ...definition,
  },
  runs: [],
  operations: ['update', 'remove', 'run'],
  createdAt: '2026-10-01T00:00:00.000Z',
  modifiedAt: '2026-10-01T00:00:00.000Z',
  ...fields,
}) as unknown as AutomationEntry;

const run = (status: string, at: string, extra: Record<string, unknown> = {}) => ({
  resource: `run:${at}`,
  automation: 'ahp-automation:/a',
  origin: { kind: 'manual' },
  lifecycle: { status, createdAt: at, startedAt: at, ...extra },
  sessionCount: 1,
});

describe('cronWords', () => {
  it('says the common shapes in words', () => {
    expect(cronWords('*/10 * * * *')).toBe('Every 10 minutes');
    expect(cronWords('0 */6 * * *')).toBe('Every 6 hours');
    expect(cronWords('0 9 * * *')).toBe('Every day at 09:00');
    expect(cronWords('30 5 * * 1')).toBe('Every Monday at 05:30');
    expect(cronWords('0 9 * * 1-5')).toBe('Weekdays at 09:00');
  });

  it('leaves anything else as written', () => {
    expect(cronWords('0 9 1 * *')).toBe('0 9 1 * *');
  });
});

describe('runFacts and stateOf', () => {
  it('reads how long a finished run took and why it failed', () => {
    const facts = runFacts(run('failed', '2026-10-06T10:00:00.000Z', { completedAt: '2026-10-06T10:00:05.000Z', error: { message: 'boom' } }) as never);
    expect(facts).toMatchObject({ status: 'failed', took: 5000, error: 'boom' });
  });

  it('puts a running run first, then off, then a failed last run', () => {
    expect(stateOf(entry({ runs: [run('running', '2026-10-06T10:00:00.000Z')] }))).toBe('running');
    expect(stateOf(entry({}, { enabled: false }))).toBe('off');
    expect(stateOf(entry({ runs: [run('completed', '2026-10-05T10:00:00.000Z'), run('failed', '2026-10-06T10:00:00.000Z')] }))).toBe('failed');
    expect(stateOf(entry())).toBe('on');
  });
});

describe('draftOf and definitionOf', () => {
  it('round-trips an automation through the form, keeping the event trigger it does not edit', () => {
    const kept = entry();
    const definition = definitionOf(draftOf(kept), kept.definition);
    expect(definition.triggers).toEqual(kept.definition.triggers.map((trigger) => ('schedule' in trigger ? { ...trigger, misfirePolicy: 'skip' } : trigger)));
    expect(definition.session).toEqual(kept.definition.session);
    expect(definition.disableConditions).toEqual([{ kind: 'afterRuns', max: 3 }]);
  });

  it('clears what the form clears', () => {
    const kept = entry();
    const draft = { ...draftOf(kept), model: '', folder: '', expression: '', afterRuns: '' };
    const definition = definitionOf(draft, kept.definition);
    expect(definition.session).toEqual({ provider: 'claude' });
    expect(definition.triggers.map((trigger) => trigger.id)).toEqual(['pr']);
    expect(definition.disableConditions).toBeUndefined();
  });

  it('names what is missing', () => {
    const empty = draftOf(undefined);
    expect(draftProblem(empty)).toBe('Give it a title.');
    expect(draftProblem({ ...empty, title: 't', message: 'm', expression: '0 9 *' })).toMatch(/five fields/);
    expect(draftProblem({ ...empty, title: 't', message: 'm' })).toBeUndefined();
  });
});
