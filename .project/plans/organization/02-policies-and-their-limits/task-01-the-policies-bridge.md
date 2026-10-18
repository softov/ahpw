---
title: The policies bridge
status: todo
depends: []
layer: "src/bridges"
refs:
  - "[code://src/bridges/people.ts](../../../../src/bridges/people.ts) - the reducer, and the command or resource write"
  - "[code://src/bridges/usage.ts](../../../../src/bridges/usage.ts) - `ask`, and the `usage://` root a host names"
  - file:///github/ahpd/docs/sdk/POLICY.md - the channel, the commands, and the two limit reads
  - file:///github/ahpd/packages/sdk/src/charge.ts - `LimitFigure` and `LimitMember`
---

## Objective

One module reaches a host's policies and limits.
It follows the policies channel, reads a person's limits and one policy's limits, and writes and deletes a policy.

## Files

- `CREATE: src/bridges/policies.ts` - the channel, its reducer, the two reads, the writes, and the limit types.
- `CREATE: src/bridges/policies.test.ts` - the reducer, the limit words and the gates.

## Steps

1. Declare `LimitMember`, `LimitFigure` and `PolicyLimits` as ahpd's `charge.ts` and `policy.ts` define them, with a comment that names the source.
2. Import `Policy`, `PolicyLimit`, `Measure`, `Period` and `LimitPool` from `@ahpd/sdk` with `import type`.
3. Export `POLICIES = { scheme: 'policy', channel: 'x-ahpd-policies://', put: 'x-ahpd/policies/put', remove: 'x-ahpd/policies/remove' }`.
4. Export a reducer for `x-ahpd-policies/added`, `/changed` and `/removed` over `{ records }`, written as `peopleReducer` is.
5. Export `servesPolicies(offers)`, true when the host offers the channel.
6. Export `ownLimits(host, offers): Promise<PolicyLimits[] | undefined>`, which reads `usage://limits` under the root the host names.
7. Make `ownLimits` answer `undefined` for an `RpcError` with code `-32008`, and throw any other error.
8. Export `policyLimits(host, offers, id): Promise<PolicyLimits>`, which reads `policy://<id>/limits` with the id encoded.
9. Export `putPolicy(host, offers, id, record, createOnly)` and `removePolicy(host, offers, id)`, written as the people writes are.
10. Export `limitWords(figure, locale)`, which answers the used and amount figures, the period, and the reset as a local date.
11. Format a `usd` figure as currency, `tokens` compactly, and the other measures as counts.
12. Make `limitWords` answer no figure for `counted: false`, and the fraction used, capped at 1, for the meter.

## Validation

- `policies.test.ts`: the reducer adds, changes and removes a row.
- `policies.test.ts`: `limitWords` on a `usd` week, a `total` with no `resets`, `counted: false`, and `used` past `amount`.
- `policies.test.ts`: `ownLimits` answers `undefined` on `-32008` and throws on another code.
- `pnpm test` and `pnpm typecheck` pass.

## Resume
