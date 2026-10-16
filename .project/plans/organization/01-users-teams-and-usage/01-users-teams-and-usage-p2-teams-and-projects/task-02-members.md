---
title: Members
status: done
depends: [task-01-the-teams-section-and-pages.md]
layer: "src/resources/teams, src/bridges"
refs:
  - file:///github/ahpapp/src/components/NamedRecord.tsx - `membersOf`, `membershipOf`, adding and removing a member
  - file:///github/ahpapp/src/organization.ts - the membership words: `team`, `team:*`, `team:project`
---

## Objective

A team's page lists the users whose memberships name it, and a project's page the users who work on it through a team.
A member is added from a pick of the host's users and taken off with a button; each writes that user's memberships.

## Files

- `UPDATE: src/bridges/people.ts` - `membershipOf({ team, project }): string`, `membersOf(domain: 'teams' | 'projects', id: string, users: UserRecord[]): { user: string; through: string[]; primary: boolean }[]`.
- `UPDATE: src/bridges/people.test.ts` - the members of a team, of a project through `team:project`, and through `team:*`.
- `UPDATE: src/resources/teams/NamedPage.tsx` - the members list, the add pick and the take-off button.

## Steps

1. Adding to a team writes `team`; adding to a project asks which team it goes through, and writes `team:project`.
2. Taking off removes that membership, and clears `primary` when it was that one, through `putPerson` with `userBody`.
3. The list marks each member's primary membership.

## Validation

- `people.test.ts`: `membersOf` finds a team's members and a project's, and marks the primary.
- By hand: a member added on a team page shows on the user's page, and taking them off lets the team be deleted.

## Resume
