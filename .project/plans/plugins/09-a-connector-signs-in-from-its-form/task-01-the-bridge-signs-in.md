---
title: The bridge signs in, and the log hides the code
status: todo
depends: []
layer: "bridges, connectors screen, log"
refs:
  - "[code://src/bridges/connectors.ts#L30-L35](../../../../src/bridges/connectors.ts#L30-L35) - `CONNECTORS`, which gets the two command names"
  - "[code://src/bridges/connectors.ts#L55-L66](../../../../src/bridges/connectors.ts#L55-L66) - `AdapterRow`, which gets `signIn`"
  - "[code://src/bridges/connectors.ts#L122-L133](../../../../src/bridges/connectors.ts#L122-L133) - `putConnector`, the pattern for `startSignIn` and `finishSignIn`"
  - "[code://src/resources/connectors/form.ts#L232-L242](../../../../src/resources/connectors/form.ts#L232-L242) - `configForPut`, which `configForSignIn` builds on"
  - "[code://src/resources/log/wire.ts#L162-L188](../../../../src/resources/log/wire.ts#L162-L188) - `masked`, which gets the code and the config"
  - file:///github/ahpd/packages/sdk/src/connectors/channel.ts - the params and answers of `signin` and `signin-finish`
---

## Objective

ahpw reads `signIn: { title, field }` on an adapter row, and calls `x-ahpd/connectors/signin` and `x-ahpd/connectors/signin-finish`.
The wire log shows no pasted code and no typed key.

## Files

- `UPDATE: src/bridges/connectors.ts:30-35` - add `signin` and `signinFinish` to `CONNECTORS`.
- `UPDATE: src/bridges/connectors.ts:55-66` - add `SignInRow` and the optional `AdapterRow.signIn`.
- `UPDATE: src/bridges/connectors.ts:122-138` - add `startSignIn` and `finishSignIn` beside `putConnector`.
- `UPDATE: src/bridges/connectors.test.ts` - the params each call sends and the answers each refuses.
- `UPDATE: src/resources/connectors/form.ts:232-242` - add `configForSignIn`, the config a sign-in sends.
- `UPDATE: src/resources/connectors/form.test.ts` - `configForSignIn` drops the field and keeps other secrets as `""`.
- `UPDATE: src/resources/log/wire.ts:162-188` - `masked` hides the code of `signin-finish` and the config strings of `put` and `signin`.
- `UPDATE: src/resources/log/log.test.ts` - the three masks, beside the `authenticate` case.

## Steps

1. Add `signin: 'x-ahpd/connectors/signin'` and `signinFinish: 'x-ahpd/connectors/signin-finish'` to `CONNECTORS`.
2. Add `interface SignInRow { title: string; field: string }` with a doc comment for each field.
3. Add `signIn?: SignInRow` to `AdapterRow`, with a comment that the host sends it for an adapter that signs in.
4. Add `startSignIn(host, wanted: ConnectorWanted)` that sends the params as `putConnector` builds them.
5. Make `startSignIn` answer `{ url, state }`, and throw when either is not a non-empty string.
6. Add `finishSignIn(host, state, code)` that sends `{ state, code }` and answers the row as `putConnector` does.
7. Write each thrown message with the command name only, never the code or the answer.
8. Add `configForSignIn(config, schema, field)`: run `configForPut`, then delete `field` from the result.
9. Extend `masked` to replace `params.code` of a sent `x-ahpd/connectors/signin-finish` with `HIDDEN`.
10. Extend `masked` to replace each non-empty string in `params.config` of a sent `put` or `signin` with `HIDDEN`.
11. Import the method names from `CONNECTORS` in `wire.ts`, so the names live in one place.
12. Update the comment on `masked` to name the three frames it hides.

## Validation

- `connectors.test.ts` checks that `startSignIn` sends `{ id, adapter, owner, title, config }` to `CONNECTORS.signin`.
- It checks that `startSignIn` refuses an answer with no `url` or no `state`.
- It checks that `finishSignIn` sends `{ state, code }` and answers the row.
- It checks that no thrown message holds the code.
- `form.test.ts` checks that `configForSignIn` drops the field, sends another empty secret as `""`, and keeps the plain fields.
- `log.test.ts` checks that a sent `signin-finish` frame shows `••••••` for its code, in the detail and in a refusal's line.
- It checks that a sent `put` and a sent `signin` show `••••••` for each config string.
- It checks that those frames keep `id`, `adapter` and `owner`.
- `pnpm -s typecheck && pnpm -s test` passes.

## Resume
