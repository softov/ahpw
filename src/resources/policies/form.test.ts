import { describe, expect, it } from 'vitest';
import { choicesOf, draftOf, fitLimits, matchTypesFor, measuresFor, policyBody, problemsOf, type PolicyDraft } from './form.js';

/** The `policy:` manifest as ahpd's `packages/sdk/src/policy.ts` writes it, with only what these checks read. */
const MANIFEST: Record<string, unknown> = {
  type: 'object',
  properties: {
    kind: { enum: ['model', 'agent', 'computer'] },
    effect: { enum: ['allow', 'deny'] },
    match: { type: 'object', properties: { model: {}, proxy: {}, agent: {}, computer: {} } },
    limits: {
      type: 'array',
      items: {
        properties: {
          measure: { enum: ['usd', 'tokens', 'calls', 'turns', 'hours', 'sessions'] },
          period: { enum: ['day', 'week', 'month', 'total'] },
          pool: { enum: ['shared', 'each'] },
        },
      },
    },
  },
  allOf: [
    { if: { properties: { kind: { const: 'model' } }, required: ['kind'] }, then: { properties: { limits: { items: { properties: { measure: { enum: ['usd', 'tokens', 'calls'] } } } }, match: { propertyNames: { enum: ['model', 'proxy'] } } } } },
    { if: { properties: { kind: { const: 'agent' } }, required: ['kind'] }, then: { properties: { limits: { items: { properties: { measure: { enum: ['usd', 'tokens', 'turns', 'hours'] } } } }, match: { propertyNames: { enum: ['agent', 'model', 'computer'] } } } } },
    { if: { properties: { kind: { const: 'computer' } }, required: ['kind'] }, then: { properties: { limits: { items: { properties: { measure: { enum: ['hours', 'sessions'] } } } }, match: { propertyNames: { enum: ['computer'] } } } } },
  ],
};

/** A draft with one limit and one match value, which nothing is wrong with. */
const DRAFT: PolicyDraft = {
  id: 'A1',
  scope: 'all',
  kind: 'agent',
  effect: 'allow',
  match: { agent: 'claude', model: '' },
  limits: [{ amount: '20', measure: 'usd', period: 'week', pool: 'shared' }],
  pool: '',
  cap: false,
  from: '',
  until: '',
};

describe('the manifest pickers', () => {
  it('reads the enums the manifest names', () => {
    expect(choicesOf(MANIFEST)).toEqual({
      kinds: ['model', 'agent', 'computer'],
      effects: ['allow', 'deny'],
      measures: ['usd', 'tokens', 'calls', 'turns', 'hours', 'sessions'],
      periods: ['day', 'week', 'month', 'total'],
      pools: ['shared', 'each'],
      matchTypes: ['model', 'proxy', 'agent', 'computer'],
    });
  });

  it('narrows a computer to the measures its kind takes', () => {
    expect(measuresFor(MANIFEST, 'computer')).toEqual(['hours', 'sessions']);
  });

  it('narrows the match types the way the manifest says', () => {
    expect(matchTypesFor(MANIFEST, 'model')).toEqual(['model', 'proxy']);
    expect(matchTypesFor(MANIFEST, 'computer')).toEqual(['computer']);
  });

  it('offers the wider match types when a host narrows a computer to them', () => {
    const wider = {
      ...MANIFEST,
      allOf: [
        { if: { properties: { kind: { const: 'computer' } }, required: ['kind'] }, then: { properties: { match: { propertyNames: { enum: ['agent', 'computer'] } } } } },
      ],
    };
    expect(matchTypesFor(wider, 'computer')).toEqual(['agent', 'computer']);
  });
});

describe('fitLimits', () => {
  it('drops the limit rows whose measure the new kind does not take', () => {
    const limits = [
      { amount: '20', measure: 'usd', period: 'week', pool: 'shared' },
      { amount: '8', measure: 'hours', period: 'day', pool: 'shared' },
      { amount: '2', measure: 'turns', period: 'day', pool: 'shared' },
    ];
    expect(fitLimits(limits, measuresFor(MANIFEST, 'model')).map((one) => one.measure)).toEqual(['usd']);
  });

  it('keeps every row when the kind takes them all', () => {
    const limits = [
      { amount: '20', measure: 'usd', period: 'week', pool: 'shared' },
      { amount: '8', measure: 'hours', period: 'day', pool: 'shared' },
    ];
    expect(fitLimits(limits, measuresFor(MANIFEST, 'agent'))).toEqual(limits);
  });
});

describe('problemsOf', () => {
  it('catches a negative amount before the save', () => {
    const held = problemsOf({ ...DRAFT, limits: [{ ...DRAFT.limits[0]!, amount: '-1' }] }, false);
    expect(held.amounts).toEqual({ 0: 'negative' });
    expect(held.any).toBe(true);
  });

  it('catches an empty match line before the save', () => {
    const held = problemsOf({ ...DRAFT, match: { agent: 'claude\n\npi' } }, false);
    expect(held.match).toEqual({ agent: [2] });
    expect(held.any).toBe(true);
  });

  it('does not flag a trailing newline after the last value', () => {
    expect(problemsOf({ ...DRAFT, match: { agent: 'claude\n' } }, false).match).toEqual({});
  });

  it('allows a whole match box that is empty', () => {
    expect(problemsOf({ ...DRAFT, match: { agent: '', model: '' } }, false).any).toBe(false);
  });

  it('catches a fresh policy without an id', () => {
    expect(problemsOf({ ...DRAFT, id: '' }, true).id).toBe(true);
  });
});

describe('policyBody', () => {
  it('drops an empty match type and names the dates it holds', () => {
    const body = policyBody({ ...DRAFT, from: '2026-10-01', until: '' });
    expect(body).toMatchObject({
      scope: 'all',
      kind: 'agent',
      effect: 'allow',
      match: { agent: ['claude'] },
      limits: [{ amount: 20, measure: 'usd', period: 'week', pool: 'shared' }],
      cap: false,
      from: '2026-10-01',
      until: null,
    });
    expect(body).not.toHaveProperty('pool');
  });
});

describe('draftOf', () => {
  it('keeps a match type a row holds even when the manifest leaves it out', () => {
    const draft = draftOf(
      { id: 'A1', scope: 'all', kind: 'computer', effect: 'deny', match: { agent: ['claude'] } },
      MANIFEST,
    );
    expect(draft.match).toEqual({ computer: '', agent: 'claude' });
  });
});
