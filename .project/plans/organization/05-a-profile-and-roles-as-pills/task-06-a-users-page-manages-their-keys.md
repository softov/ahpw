---
title: A writer manages a person's tokens from a Keys section on that person's page
status: done
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

- `UPDATE: src/resources/users/UserPage.tsx:118-128` - add the Keys section after the page's actions, for a writer only.
- `UPDATE: src/resources/emojis.ts` - `keys`, 🔐, since Sign-in already has 🔑.
- `UPDATE: src/resources/profile/TokenList.tsx` - `onRefused`, and *every grant* worded for somebody else.
- `UPDATE: src/resources/profile/MintForm.tsx` - *every grant* worded for somebody else.
- `UPDATE: src/resources/profile/Keys.tsx` - *New key* stands aside when the host refuses the list.
- `UPDATE: src/style/app.css` - no top padding for the keys in a page's section.
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

Done on 2026-10-21.
The section sits after Save and Delete, because a key is made or revoked at once, as the team page's members are.
`writesPeople` says what the host's provider allows, not what the reader may do, so bob without `user:write` sees the section.
The host then refuses the list in its own words, and *New key* stands aside; the profile's Keys does the same.
The same gap shows the rest of the user page's controls to a reader who cannot write: *+ Add a role*, Save, Delete.
Closing it needs the reader's grants, which `x-ahpd/me` answers; task 07 is where it can be done.
Checked in Chromium on ahpd 0.13 at port 9199, light and dark: ana made and revoked a key for carl; bob saw the note only.
