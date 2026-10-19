import { expect, test } from 'vitest';
import { NO_OFFERS } from './offers.js';
import { comparePolicies, policiesReducer, policyActive, policyGroup, policyManifest, policyUri, servesPolicies, writesPolicies, type Policy } from './policies.js';

const row = (id: string, kind: Policy['kind'], scope: Policy['scope'], more: Partial<Policy> = {}): Policy => ({ id, kind, scope, effect: 'allow', match: {}, ...more });

test('the policies channel folds added, changed and removed', () => {
  let state = policiesReducer({ records: [] }, { type: 'x-ahpd-policies/added', id: 'M1', record: row('M1', 'model', 'all') });
  state = policiesReducer(state, { type: 'x-ahpd-policies/changed', id: 'M1', record: row('M1', 'model', 'all', { effect: 'deny' }) });
  expect(state.records).toEqual([{ id: 'M1', record: row('M1', 'model', 'all', { effect: 'deny' }) }]);
  state = policiesReducer(state, { type: 'x-ahpd-policies/removed', id: 'M1' });
  expect(state.records).toEqual([]);
  // Another channel's action is not this one's.
  expect(policiesReducer(state, { type: 'x-ahpd-users/added', id: 'x', record: row('x', 'model', 'all') })).toBe(state);
});

test('a host serves policies on its channel, takes writes where its provider allows them, and names their form', () => {
  const manifest = { type: 'object', properties: {} };
  const offers = { ...NO_OFFERS, channels: ['x-ahpd-policies'], providers: { policy: { title: 'Policies', root: 'policy://', operations: ['list', 'read', 'write', 'delete'], manifest } } };
  expect(servesPolicies(offers)).toBe(true);
  expect(servesPolicies(NO_OFFERS)).toBe(false);
  expect(writesPolicies(offers)).toBe(true);
  expect(writesPolicies({ ...offers, providers: { policy: { ...offers.providers.policy, operations: ['list', 'read'] } } })).toBe(false);
  expect(policyManifest(offers)).toBe(manifest);
  expect(policyManifest(NO_OFFERS)).toBeUndefined();
  expect(policyUri(offers, 'A 1')).toBe('policy://A%201');
  expect(policyUri(NO_OFFERS, 'A2', 'limits')).toBe('policy://A2/limits');
});

test('rows group by kind in the host\'s order, by scope with all first, or not at all', () => {
  const rows = [row('C1', 'computer', 'team:ops'), row('A2', 'agent', 'all'), row('M1', 'model', 'user:ana'), row('A1', 'agent', 'team:ops')];
  expect([...rows].sort(comparePolicies('kind')).map((one) => one.id)).toEqual(['M1', 'A1', 'A2', 'C1']);
  expect([...rows].sort(comparePolicies('scope')).map((one) => one.id)).toEqual(['A2', 'A1', 'C1', 'M1']);
  expect([...rows].sort(comparePolicies('none')).map((one) => one.id)).toEqual(['A1', 'A2', 'C1', 'M1']);
  expect(policyGroup(rows[0]!, 'scope')).toBe('team:ops');
  expect(policyGroup(rows[0]!, 'none')).toBeUndefined();
});

test('a row is active from its from and until its until', () => {
  const now = new Date('2026-10-19T12:00:00Z');
  expect(policyActive(row('a', 'model', 'all'), now)).toBe(true);
  expect(policyActive(row('a', 'model', 'all', { from: '2026-10-20T00:00:00Z' }), now)).toBe(false);
  expect(policyActive(row('a', 'model', 'all', { until: '2026-10-19T12:00:00Z' }), now)).toBe(false);
  expect(policyActive(row('a', 'model', 'all', { from: '2026-10-01T00:00:00Z', until: '2026-11-01T00:00:00Z' }), now)).toBe(true);
});
