import { expect, test } from 'vitest';
import { membershipOf, membershipParts, projectChoices, teamChoices } from './memberships.js';

test('a membership is a team, every project of a team, or one project through a team', () => {
  expect(membershipParts('backend')).toEqual({ team: 'backend', project: null });
  expect(membershipParts('backend:*')).toEqual({ team: 'backend', project: '*' });
  expect(membershipParts('backend:ahpapp')).toEqual({ team: 'backend', project: 'ahpapp' });
  expect(membershipOf({ team: 'backend', project: null })).toBe('backend');
  expect(membershipOf({ team: 'backend', project: 'ahpapp' })).toBe('backend:ahpapp');
});

test('which projects a team offers: every project, the team alone, each project, less what is held', () => {
  expect(projectChoices('backend', ['ahpapp', 'ahpc'], [])).toEqual(['*', null, 'ahpapp', 'ahpc']);
  expect(projectChoices('backend', ['ahpapp', 'ahpc'], ['backend:*', 'backend:ahpapp', 'testing'])).toEqual([null, 'ahpc']);
});

test('which teams a project offers: the ones not already reaching it, through it or every project', () => {
  expect(teamChoices('ahpapp', ['backend', 'testing', 'ops'], ['backend:ahpapp', 'testing:*', 'ops'])).toEqual(['ops']);
});
