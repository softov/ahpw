---
title: Users and roles - implemented
date: 2026-10-16
refs:
  - git://7b333b6
  - "[code://src/bridges/people.ts](../../../../../src/bridges/people.ts)"
  - "[code://src/resources/users/index.ts](../../../../../src/resources/users/index.ts)"
---

A 👤 section lists each shown host's users and roles, and a page makes, edits and deletes each one.

## What was built

- [`code://src/bridges/people.ts`](../../../../../src/bridges/people.ts) - the people channels, their reducer, `putPerson` and `removePerson` with the resource fallback, and the user form's fields.
- [`code://src/bridges/offers.ts`](../../../../../src/bridges/offers.ts) - `Offers.principal`, the signed-in person.
- [`code://src/resources/users/index.ts`](../../../../../src/resources/users/index.ts) - `registerUsers`: the + menu, open, delete, reload, and the sidebar mount.
- [`code://src/resources/users/Explorer.tsx`](../../../../../src/resources/users/Explorer.tsx) - the Users and Roles groups.
- [`code://src/resources/users/UserPage.tsx`](../../../../../src/resources/users/UserPage.tsx) - roles, memberships, primary, issuer and `rolesFrom`, a token note, and a confirm before taking `admin` off oneself.
- [`code://src/resources/users/RolePage.tsx`](../../../../../src/resources/users/RolePage.tsx) - the grants as a plain list checked by `parseGrants`, and the built-in notes.
- The activity bar mount in [`code://src/shell/register-shell.tsx`](../../../../../src/shell/register-shell.tsx), the `.web-people__*` styles, and the `users` words in en, es and pt.

## Verified

- `src/bridges/people.test.ts`, `src/resources/users/form.test.ts` and `src/bridges/offers.test.ts`: 12 tests pass.
- On a scratch ahpd 0.12.0 host with the deployment token: users and roles were made, edited and deleted, and a deleted record's tab closed.

## Departures from the plan

- none.

## Left for later

- A host that does not allow `write` was not tried.
- A person's own token is refused on the users channel until ahpw sends `authenticate` - the parent plan's open question.
