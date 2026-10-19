---
title: Policies and their limits - implemented
date: 2026-10-18
refs:
  - "[code://src/bridges/policies.ts](../../../../src/bridges/policies.ts)"
  - "[code://src/resources/policies/index.ts](../../../../src/resources/policies/index.ts)"
  - "[code://src/resources/policies/PolicyPage.tsx](../../../../src/resources/policies/PolicyPage.tsx)"
  - "[code://src/resources/usage/Limits.tsx](../../../../src/resources/usage/Limits.tsx)"
---

A person sees the limits that apply to them at the top of 📊, with what the period used and when it resets.
A ⚖ section lists the host's policies, and a policy's page shows its fields and figures.
The page makes, edits and deletes rows where the host takes writes, and is read-only where it does not.

## What was built

- [`code://src/bridges/policies.ts`](../../../../src/bridges/policies.ts) - the policies channel, `servesPolicies` and `writesPolicies`, `ownLimits`, `policyLimits`, `putPolicy`, `removePolicy` and `limitWords`.
- [`code://src/resources/usage/Limits.tsx`](../../../../src/resources/usage/Limits.tsx) - the Limits group, its rows and meters, and a member line for an `each` limit.
- [`code://src/resources/usage/Explorer.tsx`](../../../../src/resources/usage/Explorer.tsx) - the Limits group above the pools, read again on reload.
- [`code://src/resources/policies/index.ts`](../../../../src/resources/policies/index.ts) - the section, its commands, the sidebar mount and the ⚖ activity bar item.
- [`code://src/resources/policies/Explorer.tsx`](../../../../src/resources/policies/Explorer.tsx) - the list, grouped by host in multi mode.
- [`code://src/resources/policies/PolicyPage.tsx`](../../../../src/resources/policies/PolicyPage.tsx) - the fields, the limits, the form and its actions.
- [`code://src/resources/policies/form.ts`](../../../../src/resources/policies/form.ts) - the draft, the pickers from the manifest, the checks before a save and the body a save sends.
- The `policies` words in en, es and pt.

## Verified

- `src/bridges/policies.test.ts` and `src/resources/policies/form.test.ts`: the reducer, the gates, `limitWords`, the `-32008` answer, the manifest narrowing and the checks before a save.
- `pnpm test` 459 pass in 83 files; `pnpm typecheck` and `pnpm build` pass.
- Not run here: the checks that need a live host or a second client. See [deferred.md](deferred.md).

## Review fixes, 2026-10-18

- A kind change drops the limit rows whose measure the new kind does not take, through `fitLimits` in `form.ts`.
- A trailing newline in a match box is no longer an empty line. Only a blank line between two values is.

## Departures from the plan

- The ⚖ icon is `mono('⚖')`, because `emojis.test.ts` refuses the colour form the task names.
- ahpd's manifest gives a `computer` row only the `computer` match type. The form and the test follow the manifest, not the `agent` and `computer` the task's Validation names.
- A blank `pool` is left out of a save, because ahpd documents no write that takes a pool away.

## Left for later

- See [deferred.md](deferred.md).
