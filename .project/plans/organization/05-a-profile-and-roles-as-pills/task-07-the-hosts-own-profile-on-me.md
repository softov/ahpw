---
title: The host's own connection has a profile, and Info reads x-ahpd/me
status: blocked
depends: [task-05-keys-mints-a-token.md]
layer: "ahpw profile"
refs:
  - "[code://src/bridges/people.ts](../../../../src/bridges/people.ts) - `selfId` and `readOwnUser`, which `me` replaces"
  - "[code://src/shell/manage.ts](../../../../src/shell/manage.ts) - `accountGroup`, whose `when` is a person today"
  - "[code://src/resources/profile/Info.tsx](../../../../src/resources/profile/Info.tsx) - the Info tab"
---

## Objective

A `root:<host>` connection has a profile and a Manage entry, as a person does.
Info reads `x-ahpd/me` for both, so the roles a sign-in adds through `rolesFrom` show.
Root's Keys picks a person, then lists, mints and revokes that person's tokens.

## Blocked on

ahpd has no `x-ahpd/me` at origin/main `d96c3473`.
ahpw asked ahpd's builder for this answer, on 2026-10-21:

- `principal`, `kind` (`user` or `root`), and `id`.
- `roles`, the record's and the sign-in's, and `rolesFromSignIn`, the ones the claim added.
- `grants`, what those roles resolve to; for root, every grant.
- `token`, the minted token's id when the connection signed in with one.
- For a person: `memberships`, `primary`, `issuer` and `rolesFrom`.
- `pools`, the usage pools charged to the connection.

Read the shape ahpd ships, and correct the steps before starting.

## Files

- `CREATE: src/bridges/me.ts` - `readMe(host, offers)` and the `Me` type, from `@ahpd/sdk` once it exports one.
- `CREATE: src/bridges/me.test.ts` - a person, root, and a refusal.
- `UPDATE: src/bridges/people.ts` - remove `readOwnUser` once nothing calls it.
- `UPDATE: src/shell/manage.ts` - the entry shows for `user:` and `root:`; root's reads `🖥 <host>`.
- `UPDATE: src/resources/profile/ProfilePage.tsx` - a header for root, with its icon and `root:` address.
- `UPDATE: src/resources/profile/Info.tsx` - read `me`; mark the roles a sign-in added; root shows its grants and its pool.
- `UPDATE: src/resources/profile/Keys.tsx` - for root, a person picker over `TokenList` and `MintForm` with `user`.
- `UPDATE: src/resources/users/UserPage.tsx` - `writes` also asks the reader's grants, so a reader without `user:write` sees no edit controls.
- `UPDATE: src/i18n/en.json` - the root words.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Read the `x-ahpd/me` that ahpd shipped, and correct these steps to its shape.
2. Write `readMe` and its tests.
3. Move Info onto `readMe`, and mark each role in `rolesFromSignIn` as added at sign-in.
4. Show the profile entry and the page for `root:<host>`, with the host's icon.
5. For root, show usage from the pools `me` names.
6. For root's Keys, list the people, then show `TokenList` and `MintForm` for the one picked.
7. Remove `readOwnUser` once nothing calls it.
8. Gate the user page's writes on the reader's grants from `me`, not on the host's provider alone.

## Validation

- `src/bridges/me.test.ts` passes.
- `npx tsc -b` and `npx vitest run` pass.
- By hand on a root connection: the Manage entry, Info, and minting a token for a person.
- By hand as a person with a `rolesFrom` role: the role shows, marked as from sign-in.
- By hand, light and dark.

## Resume

