import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AhpErrorCodes } from '@microsoft/agent-host-protocol';
import type { Policy } from '@ahpd/sdk';
import type { Offers } from './offers.js';
import { NO_OFFERS } from './offers.js';
import { limitWords, ownLimits, policiesReducer, servesPolicies, writesPolicies, type LimitFigure } from './policies.js';

const readText = vi.hoisted(() => vi.fn());

vi.mock('./data.js', () => ({ hostBridge: () => ({ readText }) }));

const OFFERS = { providers: { usage: { root: 'usage://' }, policy: { root: 'policy://' } } } as unknown as Offers;

const ROW: Policy = { id: 'A1', scope: 'all', kind: 'agent', effect: 'allow', match: { agent: ['claude'] } };

/** A host whose policy provider allows the operations named. */
const withOperations = (operations: string[]): Offers => ({
  ...NO_OFFERS,
  providers: { policy: { title: 'Policies', root: 'policy://', operations } },
});

/** An `usd` limit over a week, with half of it used. */
const WEEK: LimitFigure = {
  amount: 20,
  measure: 'usd',
  period: 'week',
  pool: 'shared',
  counted: true,
  used: 12.5,
  from: '2026-10-19T04:00:00.000Z',
  resets: '2026-10-26T12:00:00.000Z',
};

beforeEach(() => {
  readText.mockReset();
});

describe('policiesReducer', () => {
  it('adds and changes a row by its id', () => {
    const added = policiesReducer({ records: [] }, { type: 'x-ahpd-policies/added', id: 'A1', record: ROW });
    expect(added.records).toEqual([{ id: 'A1', record: ROW }]);

    const changed = policiesReducer(added, { type: 'x-ahpd-policies/changed', id: 'A1', record: { ...ROW, effect: 'deny' } });
    expect(changed.records).toHaveLength(1);
    expect(changed.records[0]?.record.effect).toBe('deny');
  });

  it('removes a row by its id and leaves another', () => {
    const two = { records: [{ id: 'A1', record: ROW }, { id: 'A2', record: { ...ROW, id: 'A2' } }] };
    expect(policiesReducer(two, { type: 'x-ahpd-policies/removed', id: 'A1' }).records.map((one) => one.id)).toEqual(['A2']);
  });

  it('leaves the state for an action it does not know', () => {
    const state = { records: [{ id: 'A1', record: ROW }] };
    expect(policiesReducer(state, { type: 'x-ahpd-policies/other', id: 'A1' })).toBe(state);
  });
});

describe('the gates', () => {
  it('serves policies when the host offers the channel', () => {
    expect(servesPolicies(NO_OFFERS)).toBe(false);
    expect(servesPolicies({ ...NO_OFFERS, channels: ['x-ahpd-policies'] })).toBe(true);
  });

  it('writes policies when the provider allows a write, under either spelling', () => {
    expect(writesPolicies(NO_OFFERS)).toBe(false);
    expect(writesPolicies(withOperations(['read']))).toBe(false);
    expect(writesPolicies(withOperations(['write']))).toBe(true);
    expect(writesPolicies(withOperations(['put']))).toBe(true);
  });
});

describe('limitWords', () => {
  it('reads a usd week with what it used', () => {
    const words = limitWords(WEEK, 'en-US');
    expect(words.used).toBe('$12.50');
    expect(words.amount).toBe('$20.00');
    expect(words.period).toBe('week');
    expect(words.resets).toBe(new Date('2026-10-26T12:00:00.000Z').toLocaleDateString('en-US'));
    expect(words.fraction).toBe(0.625);
    expect(words.full).toBe(false);
  });

  it('reads a total without a reset', () => {
    const total: LimitFigure = {
      amount: 400,
      measure: 'tokens',
      period: 'total',
      pool: 'shared',
      counted: true,
      used: 120_000,
      from: '2026-01-01T00:00:00.000Z',
    };
    const words = limitWords(total, 'en-US');
    expect(words.used).toBe('120K');
    expect(words.amount).toBe('400');
    expect(words.resets).toBeUndefined();
  });

  it('gives no figure for a measure that is not counted', () => {
    const hours: LimitFigure = {
      amount: 8,
      measure: 'hours',
      period: 'day',
      pool: 'each',
      counted: false,
      from: '2026-10-18T00:00:00.000Z',
      resets: '2026-10-19T00:00:00.000Z',
    };
    const words = limitWords(hours, 'en-US');
    expect(words.used).toBeUndefined();
    expect(words.amount).toBe('8');
    expect(words.fraction).toBe(0);
    expect(words.full).toBe(false);
  });

  it('caps the meter when the used figure is past the amount', () => {
    const words = limitWords({ ...WEEK, used: 27.5 }, 'en-US');
    expect(words.used).toBe('$27.50');
    expect(words.fraction).toBe(1);
    expect(words.full).toBe(true);
  });
});

describe('ownLimits', () => {
  it('reads the list under the usage root', async () => {
    const answer = [{ id: 'A1', kind: 'agent', scope: 'all', limits: [WEEK] }];
    readText.mockResolvedValue({ text: JSON.stringify(answer) });
    await expect(ownLimits('alpha', OFFERS)).resolves.toEqual(answer);
    expect(readText).toHaveBeenCalledWith('usage://limits');
  });

  it('answers undefined when the host has own limits off', async () => {
    readText.mockRejectedValue({ code: AhpErrorCodes.NotFound });
    await expect(ownLimits('alpha', OFFERS)).resolves.toBeUndefined();
  });

  it('throws another refusal', async () => {
    const refusal = { code: -32009, message: 'refused' };
    readText.mockRejectedValue(refusal);
    await expect(ownLimits('alpha', OFFERS)).rejects.toBe(refusal);
  });
});
