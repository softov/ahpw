---
title: A token bridge, and the Keys tab lists and revokes the person's tokens
status: done
depends: [task-02-the-profile-page-and-its-info-tab.md]
layer: "ahpw profile"
refs:
  - "[code://src/bridges/usage.ts](../../../../src/bridges/usage.ts) - a bridge of `x-ahpd/*` commands over `hostBridge(host).request`"
  - "[code://src/resources/users/index.ts#L52-L66](../../../../src/resources/users/index.ts#L52-L66) - a danger `confirm` before a delete"
  - npm://@ahpd/sdk@^0.13.0 - `TokenRecord` and `MintedToken` from `types/users`, and the commands in `dist/tokens.js`
---

## Objective

`src/bridges/tokens.ts` holds the three token calls.
The Keys tab lists the person's tokens with their label, grants, creation and expiry, and revokes one after a confirm.

## Files

- `CREATE: src/bridges/tokens.ts` - `TOKENS`, `servesTokens(offers)`, `listTokens`, `mintToken` and `revokeToken`.
- `CREATE: src/bridges/tokens.test.ts` - the params each call sends and the answers it reads.
- `CREATE: src/resources/profile/TokenList.tsx` - `TokenList({ host, user })`, the list and revoke, for the person or for `user`.
- `UPDATE: src/resources/profile/Keys.tsx` - the list and revoke, through `TokenList`.
- `CREATE: src/bridges/said.ts` - `hostSaid(caught)`, an `RpcError` in the host's own words, without the client's `RPC error <code>:`.
- `CREATE: src/bridges/said.test.ts` - an `RpcError`, another error, and a string.
- `UPDATE: src/style/app.css` - `.web-keys` and its rows.
- `UPDATE: src/i18n/en.json` - `profile/keys/*` for the list, the columns, revoke and the notices.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Define `TOKENS = { mint: 'x-ahpd/tokens/mint', list: 'x-ahpd/tokens/list', revoke: 'x-ahpd/tokens/revoke' } as const`.
2. Write `servesTokens(offers)` as `offers.methods.includes(TOKENS.list)`.
3. Write `listTokens(host, user?): Promise<Omit<TokenRecord, 'token'>[]>`, which sends `user` only when given.
4. Write `revokeToken(host, id, user?): Promise<void>`, which sends `{ id }` and `user` when given.
5. Write `mintToken(host, wanted: { user?: string; label?: string; grants?: Grant[]; expires?: number }): Promise<MintedToken>`.
6. Validate each answer's shape, and throw with the command's name when it is wrong.
7. Test the three calls against a fake bridge in `src/bridges/tokens.test.ts`.
8. Write `TokenList` with an optional `user`, so tasks 06 and 07 reuse it for somebody else.
9. In `Keys`, show `profile/keys/notServed` when `servesTokens` is false.
10. List the tokens: label, grants as chips or *every grant*, created and expires dates.
11. Mark an expired token, and sort the list newest first.
12. Show the host's refusal message as a `web-note`, as for a minted-token sign-in.
13. Give each row a danger *Revoke* that asks `confirm` first, then revokes and reads the list again.

## Validation

- `src/bridges/tokens.test.ts`: list, revoke and mint params, with and without `user`; a bad answer throws.
- `npx tsc -b` and `npx vitest run` pass.
- By hand: mint two tokens with `ahpd token`, see both on Keys, revoke one, and see it gone.
- By hand: sign in with a minted token and see the host's note, not an error.
- By hand, light and dark: the rows, the chips and the dates.

## Resume

Done on 2026-10-21.
An expiry shows with its time, because `--expires 2026-12-31` is midnight UTC, the day before in UTC-4.
The protocol client writes `RPC error -32009:` before ahpd's sentence, so `hostSaid` takes it off for the note.
Other pages still show that prefix, such as the users list's "Sign in to use this host".
Checked in Chromium on ahpd 0.13 at port 9199, light and dark.
Two CLI-minted keys listed, one revoked and gone on the host, and a minted-key sign-in shown as a note.
