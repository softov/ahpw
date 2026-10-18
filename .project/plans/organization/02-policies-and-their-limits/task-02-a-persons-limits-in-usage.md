---
title: A person's limits in usage
status: todo
depends:
  - task-01-the-policies-bridge.md
layer: "src/resources/usage"
refs:
  - "[code://src/resources/usage/Explorer.tsx](../../../../src/resources/usage/Explorer.tsx) - the list the rows go on top of"
  - "[code://src/resources/usage/state.ts](../../../../src/resources/usage/state.ts) - `USAGE_ASKED`, which reload bumps"
  - file:///github/ahpd/docs/sdk/USAGE.md - `usage://limits` and its answer
---

## Objective

The 📊 list starts with a Limits group: one row for each limit that applies to the person, on each shown host.
A row names the policy and shows what was used against the amount, a meter, and when the period resets.

## Files

- `UPDATE: src/resources/usage/Explorer.tsx` - read `ownLimits` per host and draw the Limits group above the pools.
- `CREATE: src/resources/usage/Limits.tsx` - the Limits group and its rows.
- `UPDATE: src/resources/usage/words.ts` - the words of a limit row.
- `UPDATE: src/i18n` - the new strings, in every locale the catalog has.

## Steps

1. Read `ownLimits` for each shown host when the list shows, and again when `USAGE_ASKED` changes.
2. Draw no Limits group when every host answers `undefined` or an empty list.
3. Draw one row per limit, titled with the policy id and, in multi mode, the host.
4. Show the words from `limitWords`: used of amount, the period, and the reset date.
5. Draw a meter from the fraction used, and mark a full meter.
6. Show "Not counted yet" in place of the figure and the meter for a limit with `counted: false`.
7. Show "Ends <date>" when the limit carries `ends`.
8. Show a host's read error in its own row, and keep the other hosts' rows.

## Validation

- A person under an `each` and a `shared` limit sees both rows, with figures that match `usage://limits`.
- A host with `policies.ownLimits` off shows no Limits group.
- Reload reads the figures again.
- Mono and multi mode, at two window sizes.
- `pnpm test` and `pnpm typecheck` pass.

## Resume
