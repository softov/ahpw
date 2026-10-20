---
title: A user's page lists memberships by team, as ahpapp does, adding a team and then which of its projects
status: accepted
date: 2026-10-19
supersedes: decisions/a-users-page-is-sections-roles-teams-projects-and-sign-in.md
refs:
  - "[code://src/resources/users/MembershipList.tsx](../../src/resources/users/MembershipList.tsx) - the list, its add menus and its primary chips"
  - "[code://src/resources/users/memberships.ts](../../src/resources/users/memberships.ts) - a membership's team and project, and what *Which projects* offers"
  - "[code://src/resources/users/UserPage.tsx](../../src/resources/users/UserPage.tsx) - the user page"
  - "[code://src/resources/users/PickTwo.tsx](../../src/resources/users/PickTwo.tsx) - the two buttons that pick in turn, shared by the three pages"
  - "[code://src/resources/teams/NamedPage.tsx](../../src/resources/teams/NamedPage.tsx) - a team's and a project's members"
---

## Context

The user page split memberships into a Teams section and a Projects section, with Primary as a third.
Softov said on 2026-10-19: "the team permission is wrong. There is no way to add team:project. ahpapp also has some wrongs... but I will fix it latter. see about something alike."
The screenshots showed ahpapp's *+ Add to a team* menu, then a *Which projects* menu: every project, the team with no project, and each project.
Softov then said of the team and project pages: "on teams. add user I could pick a project or all. currently only all. on projects we need to add all selecting a team", with ahpapp's person then *Which projects*, and person then *Which team*, menus.

## Decision

The name keeps the users icon and its address, `user://<id>`.
Below it are three sections, each with an icon heading and a line above it: 🛡 Roles, 👥 Teams and projects, and 🔑 Sign-in.
Teams and projects lists one row per membership: the team's title, then "every project", "the team, no project" or the project's title.
Each row has a *primary* chip and a ✕ to drop it; primary is chosen there, not in a section of its own.
*+ Add to a team* opens a menu of teams, then *Which projects* opens a menu of every project, the team with no project, and each project, leaving out the ones already held.
A team's page adds a member the same way: *+ Add somebody*, then *Which projects*, writing `team`, `team:*` or `team:project`.
A project's page adds one with *+ Add somebody*, then *Which team*, writing `team:project`; a team they already reach it through, by that project or every project, is left out.
Members' chips read as the choice did: on a team, "every project" or the project; on a project, the team, with "· every project" for `team:*`.
The memberships are written as before: `team`, `team:*` or `team:project`.

## Consequences

Nothing a host stores changes.
The 🗂 projects icon is not used.

## Options

- Separate Teams and Projects sections, as the superseded decision had: lost, Softov found no way to add `team:project` through it and pointed at ahpapp.
- Primary as its own select under the list: lost, a chip on each row says which one it is where it is shown.
- Native selects and an *Add* button on the team and project pages: lost, they wrote only one kind of membership and hid anyone already a member.
