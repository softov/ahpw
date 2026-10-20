---
title: A user's page in sections - Roles, Teams and projects, and Sign-in, each with an icon
domain: organization
status: built
priority: medium
created: 2026-10-19
revalidated: 2026-10-19
requires:
  - plans/organization/01-users-teams-and-usage/plan.md
decisions:
  - decisions/a-users-page-lists-memberships-by-team-as-ahpapp-does.md
refs:
  - "[code://src/resources/users/UserPage.tsx](../../../../src/resources/users/UserPage.tsx) - the page that changes"
  - "[code://src/bridges/people.ts](../../../../src/bridges/people.ts) - `userBody`, `putPerson`"
  - "[code://src/resources/users/RolePage.tsx](../../../../src/resources/users/RolePage.tsx) - the title with its address, which the user page follows"
  - "[code://src/resources/teams/NamedPage.tsx](../../../../src/resources/teams/NamedPage.tsx) - a team's and a project's members"
  - "[code://src/resources/users/RoleGrants.tsx](../../../../src/resources/users/RoleGrants.tsx) - `ContextMenu` from a button, which the add menus follow"
  - file:///github/ahpapp - the *Add to a team* and *Which projects* menus the list mirrors
---

## Goal

A user's page shows their name with an icon and their address, and their roles, team memberships and sign-in as sections, each with an icon heading and a line above it.
Memberships are listed by team and added a team and then which of its projects, as ahpapp does.
A team's and a project's pages add members the same way: a person, then which projects, or which team.

## Reconnaissance

The files read are the `refs` above.

### Searches performed

- `grep -rn "users/user/memberships" src` - only the user page uses the Memberships words.

### Runtime path

```
UserPage: shown.memberships -> MembershipList rows (team · scope, primary chip, ✕)
  + Add to a team -> ContextMenu(teams) -> Which projects -> ContextMenu(projectChoices)
  -> set({ memberships, primary }) -> Save -> putPerson(users, userBody)
NamedPage(teams|projects): membersOf -> chips
  + Add somebody -> PickTwo(users with a choice left) -> Which projects (projectChoices) | Which team (teamChoices)
  -> writeMemberships -> putPerson(users, userBody)
```

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [A user's page lists memberships by team, as ahpapp does, adding a team and then which of its projects](../../../decisions/a-users-page-lists-memberships-by-team-as-ahpapp-does.md) | Softov, 2026-10-19 |

| What | Source | Task |
| --- | --- | --- |
| Sign-in's icon is 🔑, a new `signIn` icon. | (defaulted: a key for how a person gets in) | 01 |
| Under a section's heading, its fields' labels take the normal weight, so the heading leads. | (defaulted: a heading and a label looked alike) | 01 |
| *Roles from*'s hint says what it adds and that only the host's roles count. | Softov, 2026-10-19: "can you explain what is Roles from?" | 01 |
| Dropping the primary membership clears primary. | (defaulted: primary must be one the person holds) | 01 |
| The ✕ on a primary member chip takes the chip's own text colour. | (defaulted: the muted colour did not show on the accent fill) | 02 |
| Each pick menu is headed by what it lists (Users, Teams, Projects), as a menu group's label. | Softov, 2026-10-19: "add header on the menu for team and project." | 02 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The user page in sections](task-01-the-user-page-in-sections.md) | done | - |
| [02 - Team and project members added as on the user page](task-02-team-and-project-members.md) | done | 01 |

## Resume state

- **Done so far:** every task; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.

## Final verification checklist

- [x] `pnpm test` passes.
- [x] By hand: the sections, adding a team and then a project, primary, dropping a row, save.
- [x] By hand: a team adds a person to one of its projects; a project adds a person through a team.
- [x] `plans/index.md` updated.
