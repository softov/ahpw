---
title: A person's limits at the top of Usage, from organization/02-policies-and-their-limits
status: done
depends: [task-01-the-policy-bridge.md]
layer: "resources/usage"
refs:
  - "[code://src/resources/usage/Limits.tsx](../../../../src/resources/usage/Limits.tsx) - the Limits rows and their meters"
  - git://880f062 - where the rows were built
---

## Objective

The Usage list starts with the limits that hold the signed-in person, each with what its period used and when it resets.

## Files

- `UPDATE: src/bridges/policies.ts` - `ownLimits`, `LimitWords`, `limitWords`.
- `CREATE: src/bridges/policies-limits.test.ts` - their tests, from `880f062`.
- `src/resources/usage/Limits.tsx`, `src/resources/usage/words.ts`, `src/resources/usage/Explorer.tsx` - kept as `880f062` built them.

## Steps

1. `ownLimits` reads `usage://limits`; not found is no limits.
2. The Usage list reads it when it shows and on reload, and puts a Limits group first.

## Validation

- `src/bridges/policies-limits.test.ts`.

## Resume

Done 2026-10-19.
