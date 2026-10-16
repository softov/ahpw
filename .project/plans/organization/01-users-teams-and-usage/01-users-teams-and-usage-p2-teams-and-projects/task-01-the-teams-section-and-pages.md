---
title: The teams section and pages
status: done
depends: []
layer: "src/resources/teams, src/shell"
refs:
  - "[code://src/resources/computers/index.ts](../../../../../src/resources/computers/index.ts) - registration, commands and the sidebar mount"
  - file:///github/ahpd/packages/sdk/src/people.ts - the team and project write rules
---

## Objective

A 👥 entry in the activity bar, shown while a shown host serves `x-ahpd-teams://`, opens a list with two groups: Teams and Projects.
A row shows the title, or the id when there is none, and the host.
A team's or project's page edits its id (on create only) and title, and is read-only where `writesPeople` is false.

## Files

- `CREATE: src/resources/teams/state.ts` - `TEAMS_SERVED`, `ACTIVE_TEAM`.
- `CREATE: src/resources/teams/index.ts` - `registerTeams(scena)`: `trackServed(scena, 'x-ahpd-teams', TEAMS_SERVED)`, the `TeamsExplorer` and `NamedPage` components, `teams.reload`, `ahp.showTeams`, `ahp.openTeam`, `ahp.openProject`, `ahp.newTeam`, `ahp.newProject`, `ahp.deleteTeam`, `ahp.deleteProject`, and the `sidebar:left` mount for `ahp:teams`.
- `CREATE: src/resources/teams/Explorer.tsx` - `useChannelOnEach` on the teams and projects channels, `ExplorerList` with the two groups.
- `CREATE: src/resources/teams/NamedPage.tsx` - one page for a team or a project, by a `domain` prop.
- `UPDATE: src/shell/register-shell.tsx` - the `teams:nav` mount after `users:nav`, `when: TEAMS_SERVED == true`; `registerTeams(scena)`.
- `UPDATE: src/resources/emojis.ts` - `teams: mono('👥')`.
- `UPDATE: src/i18n/{en,es,pt}.json` - `teams/*`, `shell/nav/teams`.

## Steps

1. Register as the users section does; the header's + offers New team and New project.
2. Save calls `putPerson(host, offers, domain, id, { title }, createOnly)`.
3. Delete asks the person to confirm, then calls `removePerson`; a refusal shows the host's error with `failed`.

## Validation

- By hand: a team and a project are made, renamed and deleted; a host without `write` shows the title off and no Save.

## Resume
