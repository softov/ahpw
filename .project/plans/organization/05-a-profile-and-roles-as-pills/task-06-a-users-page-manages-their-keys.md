---
title: A writer manages a person's tokens from a Keys section on that person's page
status: todo
depends: [task-05-keys-mints-a-token.md]
layer: "ahpw users"
refs:
  - "[code://src/resources/users/UserPage.tsx#L83-L89](../../../../src/resources/users/UserPage.tsx#L83-L89) - `section`, the icon heading the Keys section takes"
  - "[code://src/resources/users/UserPage.tsx#L118-L128](../../../../src/resources/users/UserPage.tsx#L118-L128) - Sign-in, whose note points at `ahpd user token`"
  - "[code://src/bridges/people.ts#L29](../../../../src/bridges/people.ts#L29) - `ListedUser.grants`, the grants the mint offers for that person"
  - npm://@ahpd/sdk@^0.13.0 - the `x-ahpd/tokens/*` commands take `user`, and need `user:write` for somebody else
---

## Objective

A user's page shows a 🔑 Keys section to a writer.
It lists, mints and revokes that person's minted tokens, through `TokenList` and `MintForm` with `user`.
The Sign-in note still names `ahpd user token` for the person's full secret.

## Files

- `UPDATE: src/resources/users/UserPage.tsx:118-128` - add the Keys section after Sign-in, for a writer only.
- `UPDATE: src/i18n/en.json` - `users/user/keys`, `users/user/keysHint`.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Show the section only when `writes` is true and the page is not a new user.
2. Render `TokenList` with `host` and `user={id}`.
3. Render `MintForm` with `user={id}` and `grants={record.grants ?? []}`.
4. Say in `users/user/keysHint` that these are extra tokens, and the full secret is `ahpd user token`.
5. Show the profile's Keys instead when the page is the signed-in person's own.

## Validation

- `npx tsc -b` and `npx vitest run` pass.
- By hand as an admin: mint a token for bob, list it, sign in with it, and revoke it.
- By hand as a reader without `user:write`: the section does not show.
- By hand, light and dark: the section under Sign-in.

## Resume

