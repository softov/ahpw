import { expect, test } from 'vitest';
import { NO_OFFERS } from './offers.js';
import { everyRole, membersOf, membershipOf, membershipOptions, peopleReducer, personUri, servesPeople, userBody, userFields, writesPeople } from './people.js';

test('a domain channel folds added, changed and removed', () => {
  const fold = peopleReducer('teams');
  let state = fold({ records: [] }, { type: 'x-ahpd-teams/added', id: 'ops', record: { id: 'ops' } });
  state = fold(state, { type: 'x-ahpd-teams/added', id: 'web', record: { id: 'web', title: 'Web' } });
  state = fold(state, { type: 'x-ahpd-teams/changed', id: 'ops', record: { id: 'ops', title: 'Operations' } });
  expect(state.records).toEqual([{ id: 'ops', record: { id: 'ops', title: 'Operations' } }, { id: 'web', record: { id: 'web', title: 'Web' } }]);
  state = fold(state, { type: 'x-ahpd-teams/removed', id: 'ops' });
  expect(state.records.map((one) => one.id)).toEqual(['web']);
  // Another domain's action is not this one's.
  expect(fold(state, { type: 'x-ahpd-users/removed', id: 'web' })).toBe(state);
});

test('a host serves a domain on its channel, and takes writes where its provider allows them', () => {
  const offers = {
    ...NO_OFFERS,
    channels: ['x-ahpd-users', 'x-ahpd-roles'],
    providers: { user: { title: 'People', root: 'user://', operations: ['list', 'read', 'put', 'delete'] }, role: { title: 'Roles', root: 'role://', operations: ['list', 'read'] } },
  };
  expect(servesPeople(offers, 'users')).toBe(true);
  expect(servesPeople(offers, 'teams')).toBe(false);
  expect(writesPeople(offers, 'users')).toBe(true);
  expect(writesPeople(offers, 'roles')).toBe(false);
  expect(writesPeople(offers, 'teams')).toBe(false);
  expect(personUri(offers, 'users', 'ana')).toBe('user://ana');
  expect(personUri(NO_OFFERS, 'projects', 'web site')).toBe('project://web%20site');
});

test('a user write sends only what a person edits, with an empty text as null', () => {
  const listed = { id: 'ana', roles: ['member'], memberships: ['ops'], primary: 'ops', issuer: 'github', grants: ['session:write' as const], trusted: true };
  const body = userBody({ ...userFields(listed), issuer: '  ', primary: 'ops' });
  expect(body).toEqual({ roles: ['member'], memberships: ['ops'], primary: 'ops', issuer: null, rolesFrom: null });
  expect(body).not.toHaveProperty('grants');
  expect(body).not.toHaveProperty('token');
  expect(userFields(undefined).roles).toEqual(['guest']);
});

test('the memberships a host offers: each team, every project through it, and each project through it', () => {
  expect(membershipOptions(['ops', 'web'], ['site'])).toEqual(['ops', 'ops:*', 'ops:site', 'web', 'web:*', 'web:site']);
  expect(membershipOptions([], ['site'])).toEqual([]);
});

test('a host\'s roles: the written ones, then each built-in none of them replaces', () => {
  const roles = everyRole([{ id: 'member', record: { id: 'member', grants: ['session:read'] } }, { id: 'ops', record: { id: 'ops', grants: ['*:read'] } }]);
  expect(roles.map((one) => [one.id, one.builtIn])).toEqual([['member', false], ['ops', false], ['admin', true], ['guest', true]]);
  expect(roles.find((one) => one.id === 'member')?.record.grants).toEqual(['session:read']);
});

test('the members of a team, and of a project through any team, with their primary marked', () => {
  const users = [
    { id: 'ana', roles: [], memberships: ['ops'], primary: 'ops' },
    { id: 'bea', roles: [], memberships: ['web:site', 'ops:*'] },
    { id: 'cid', roles: [], memberships: ['web'] },
    { id: 'dan', roles: [] },
  ];
  expect(membersOf('teams', 'ops', users)).toEqual([
    { user: 'ana', through: ['ops'], primary: true },
    { user: 'bea', through: ['ops:*'], primary: false },
  ]);
  expect(membersOf('projects', 'site', users).map((one) => [one.user, one.through])).toEqual([['bea', ['web:site', 'ops:*']]]);
  expect(membershipOf('web', 'site')).toBe('web:site');
  expect(membershipOf('web')).toBe('web');
});
