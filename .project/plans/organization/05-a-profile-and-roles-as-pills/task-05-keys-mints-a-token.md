---
title: The Keys tab mints a token with a label, an expiry and a subset of the person's grants
status: todo
depends: [task-04-keys-lists-and-revokes.md]
layer: "ahpw profile"
refs:
  - "[code://src/bridges/people.ts#L29](../../../../src/bridges/people.ts#L29) - `ListedUser.grants`, the grants offered"
  - "[code://src/resources/users/RoleGrants.tsx](../../../../src/resources/users/RoleGrants.tsx) - grants drawn as controls"
  - npm://@ahpd/sdk@^0.13.0 - `MintedToken.secret`, answered once, and `tokensPerPerson`, default 10
---

## Objective

Keys has a *New key* form with a label, an expiry and the grants to hold.
The mint shows the secret once, with *Copy*, and the list reads again.

## Files

- `CREATE: src/resources/profile/MintForm.tsx` - `MintForm({ host, user, grants, onMinted })`, for the person, or for `user` in tasks 06 and 07.
- `CREATE: src/resources/profile/expiry.ts` - `EXPIRY_CHOICES` and `expiresAt(choice, date, now)`.
- `CREATE: src/resources/profile/expiry.test.ts` - each choice to epoch milliseconds, and an empty date.
- `UPDATE: src/resources/profile/Keys.tsx` - the form, the secret box, and the note on sign-in roles.
- `UPDATE: src/style/app.css` - `.web-mint` and `.web-mint__secret`.
- `UPDATE: src/i18n/en.json` - `profile/keys/mint/*`.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Define `EXPIRY_CHOICES` as `never`, `7`, `30`, `90`, `365` and `date`.
2. Write `expiresAt` to return `undefined` for `never`, `now + days`, or the end of the picked date.
3. Return `undefined` from `expiresAt` for `date` with no date, and keep *Mint* off then.
4. Read the offered grants from `readOwnUser(host, offers).grants`.
5. Render the grants as checkboxes, all off, with *Every grant* on by default.
6. Send no `grants` when *Every grant* is on, and the checked list when it is off.
7. Keep *Mint* off when *Every grant* is off and the person checks no grant.
8. Call `mintToken`, then show `secret` in a `web-mint__secret` box with *Copy* and *Done*.
9. Say in the box that the host shows the secret only once.
10. Clear the secret from state on *Done* and when the tab closes.
11. Read the list again after a mint.
12. Show the host's refusal at the limit as an `Alert`, with the host's words.
13. Add a `web-note` under the grants: a sign-in role's grants are not listed, but *Every grant* follows them.

## Validation

- `src/resources/profile/expiry.test.ts`: each choice, a date at the day's end, and no date.
- `npx tsc -b`, `npx vitest run` and `npm run build` pass.
- By hand: mint with `proxy:write` alone and 7 days; the list shows the grant and the expiry.
- By hand: sign in with the secret, and see the host refuse a call outside `proxy:write`.
- By hand: mint past `tokensPerPerson` and see the host's refusal.
- By hand, light and dark: the form, the secret box and Copy.

## Resume

