/**
 * A membership names a team (`backend`), every project of a team
 * (`backend:*`) or one project through a team (`backend:ahpapp`). The user
 * page lists each as its team, then which of the team's projects.
 */

import type { Named } from '../../bridges/people.js';

/** A membership's team, and its project: `*` for every one, null for the team alone. */
export interface MembershipParts {
  team: string;
  project: string | null;
}

export function membershipParts(membership: string): MembershipParts {
  const cut = membership.indexOf(':');
  return cut < 0 ? { team: membership, project: null } : { team: membership.slice(0, cut), project: membership.slice(cut + 1) };
}

/** The membership a team and a project choice make; null is the team alone. */
export const membershipOf = ({ team, project }: MembershipParts): string => (project === null ? team : `${team}:${project}`);

/**
 * What *Which projects* offers for a team: every project, the team alone, then
 * each project, leaving out the ones the person already holds through it.
 */
export function projectChoices(team: string, projects: readonly string[], held: readonly string[]): (string | null)[] {
  return (['*', null, ...projects] as (string | null)[]).filter((project) => !held.includes(membershipOf({ team, project })));
}

/**
 * Which teams a project page offers to put someone on it through, leaving out
 * the ones they already reach it by: that project, or every project, of the team.
 */
export function teamChoices(project: string, teams: readonly string[], held: readonly string[]): string[] {
  return teams.filter((team) => !held.includes(membershipOf({ team, project })) && !held.includes(membershipOf({ team, project: '*' })));
}

/** A team's or project's title, or its id when it has none or is not listed. */
export const titled = (list: readonly Named[], id: string): string => list.find((one) => one.id === id)?.title || id;
