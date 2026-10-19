---
title: The policy bridge follows the channel, writes a row, and reads what its limits used
status: done
depends: []
layer: "bridges"
refs:
  - "[code://src/bridges/people.ts](../../../../src/bridges/people.ts) - the records reducer the policies channel shares"
  - file:///github/ahpd/packages/sdk/src/charge.ts - `LimitFigure`, copied at the boundary
---

## Objective

`src/bridges/policies.ts` holds what ahpw knows of a host's policies: the channel and its reducer, whether a host serves and takes writes, the manifest, put and remove, the limits read, and the grouping and order the explorer lists rows in.

## Files

- `CREATE: src/bridges/policies.ts` - `POLICIES`, `POLICIES_CHANNEL`, `policiesReducer`, `servesPolicies`, `writesPolicies`, `policyManifest`, `policyUri`, `putPolicy`, `removePolicy`, `LimitFigure`, `PolicyLimits`, `readLimits`, `PolicyGrouping`, `POLICY_GROUPINGS`, `policyGroup`, `comparePolicies`, `policyActive`.
- `UPDATE: src/bridges/people.ts` - `recordsReducer(scheme)`, which `peopleReducer` now calls, so the policies channel folds the same way.
- `CREATE: src/bridges/policies.test.ts` - the fold, the offers, the order, the window.

## Steps

1. Lift the fold out of `peopleReducer` into `recordsReducer`.
2. Write the bridge as `people.ts` writes a domain: the command where offered, else the resource write.
3. Type the limits read at the boundary until `@ahpd/sdk` exports it.

## Validation

- `src/bridges/policies.test.ts`: 4 cases; `src/bridges/people.test.ts` still passes.

## Resume

Done 2026-10-19.
