---
title: The users section
status: done
depends: [task-01-the-people-bridge.md]
layer: "src/resources/users, src/shell"
refs:
  - "[code://src/resources/computers/index.ts](../../../../../src/resources/computers/index.ts) - registration, commands and the sidebar mount"
  - "[code://src/resources/computers/Explorer.tsx](../../../../../src/resources/computers/Explorer.tsx) - a list over every shown host"
  - "[code://src/shell/register-shell.tsx](../../../../../src/shell/register-shell.tsx) - the activity bar mounts and the register calls"
---

## Objective

A 👤 entry in the activity bar, shown while a shown host serves `x-ahpd-users://`, opens a list with two groups: Users and Roles.
A user row shows its id, roles and host; a role row shows its id and how many grants it holds.

## Files

- `CREATE: src/resources/users/state.ts` - `USERS_SERVED`, `ACTIVE_PERSON`.
- `CREATE: src/resources/users/index.ts` - `registerUsers(scena)`: `trackServed(scena, 'x-ahpd-users', USERS_SERVED)`, the `UsersExplorer`, `UserPage` and `RolePage` components, `users.reload`, `ahp.showUsers`, `ahp.openUser`, `ahp.openRole`, `ahp.newUser`, `ahp.newRole`, `ahp.deleteUser`, `ahp.deleteRole`, and the `sidebar:left` mount for `ahp:users`.
- `CREATE: src/resources/users/Explorer.tsx` - `useChannelOnEach` on the users and roles channels, `ExplorerList` with the two groups.
- `UPDATE: src/shell/register-shell.tsx` - the `users:nav` mount after `bots:nav`, `when: USERS_SERVED == true`; `registerUsers(scena)`.
- `UPDATE: src/resources/emojis.ts` - `users: mono('👤')`.
- `UPDATE: src/i18n/{en,es,pt}.json` - `users/*`, `shell/nav/users`.

## Steps

1. Register the section and its commands as computers does; the header's + offers New user and New role.
2. Delete asks the person to confirm, then calls `removePerson`; a refusal shows the host's error with `failed`.

## Validation

- By hand: with a host serving people, the 👤 entry shows, both groups list, and a row opens its page.
- A host without people shows no 👤 entry.

## Resume

- Done 2026-10-16. Rows are keyed by kind, since a user and a role may share an id; the + menu is two slot commands with no category, so it has no heading; the page takes the record id as `person`, since `id` does not reach it.
- Checked against a scratch host with a users file, signed in with its deployment token: the list, the + menu, delete with its confirm, which closes the tab.
