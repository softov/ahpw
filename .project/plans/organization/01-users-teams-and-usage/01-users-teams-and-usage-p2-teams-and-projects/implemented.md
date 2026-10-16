---
title: Teams and projects - implemented
date: 2026-10-16
refs:
  - git://7b333b6
  - "[code://src/resources/teams/index.ts](../../../../../src/resources/teams/index.ts)"
  - "[code://src/resources/teams/NamedPage.tsx](../../../../../src/resources/teams/NamedPage.tsx)"
---

A 👥 section lists each shown host's teams and projects, and a page makes, renames, deletes and staffs each one.

## What was built

- [`code://src/resources/teams/state.ts`](../../../../../src/resources/teams/state.ts) - `TEAMS_SERVED`, `ACTIVE_TEAM` and `teamTab`.
- [`code://src/resources/teams/index.ts`](../../../../../src/resources/teams/index.ts) - `registerTeams`: the + menu with a new team and a new project, open, delete with a confirm, reload, and the sidebar mount.
- [`code://src/resources/teams/Explorer.tsx`](../../../../../src/resources/teams/Explorer.tsx) - the Teams and Projects groups, each row with its member count.
- [`code://src/resources/teams/NamedPage.tsx`](../../../../../src/resources/teams/NamedPage.tsx) - the title, Save and Delete, and the members: chips that drop a membership, and an add pick that, for a project, also picks the team.
- [`code://src/bridges/people.ts`](../../../../../src/bridges/people.ts) - `membershipOf` and `membersOf`.
- The activity bar mount in [`code://src/shell/register-shell.tsx`](../../../../../src/shell/register-shell.tsx), and the `teams` words in en, es and pt.

## Verified

- `src/bridges/people.test.ts` covers the members of a team, of a project through `team:project`, and through `team:*`.
- On a scratch ahpd 0.12.0 host with the deployment token: a team was made and renamed, ana was added to `ops` and to `site` through `web`, and `users.json` held `ana: [ops, web:site]`.
- Deleting `ops` with members showed the host's refusal: "ops is still a team of ana, bea; take them out of it first".

## Departures from the plan

- none.

## Left for later

- A host that does not allow `write` was not tried; the page reads `writesPeople` and hides the buttons.
- Multi mode was not tried.
