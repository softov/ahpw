---
title: Budget policies - an activity item, an explorer and a page per row - implemented
date: 2026-10-19
refs:
  - "[code://src/bridges/policies.ts](../../../../src/bridges/policies.ts)"
  - "[code://src/resources/policies/index.ts](../../../../src/resources/policies/index.ts)"
---

A person who may read a host's policies finds them under ⚖ in the activity bar, listed by kind, by scope or in one list, and opens each row as a tab that edits it from the host's own manifest and shows what its limits used.

## What was built

- [`code://src/bridges/policies.ts`](../../../../src/bridges/policies.ts) - the channel, writes, the limits read, the grouping and order.
- [`code://src/bridges/people.ts`](../../../../src/bridges/people.ts) - `recordsReducer`, shared by the people channels and the policies channel.
- [`code://src/resources/policies/index.ts`](../../../../src/resources/policies/index.ts) - registration, commands, the Group menu.
- [`code://src/resources/policies/Explorer.tsx`](../../../../src/resources/policies/Explorer.tsx) - the list.
- [`code://src/resources/policies/PolicyPage.tsx`](../../../../src/resources/policies/PolicyPage.tsx) - the form and the limits.
- [`code://src/resources/policies/words.ts`](../../../../src/resources/policies/words.ts) - the words of amounts, limits and matches.
- [`code://src/shell/register-shell.tsx`](../../../../src/shell/register-shell.tsx) - the activity item.
- [`code://src/resources/usage/Limits.tsx`](../../../../src/resources/usage/Limits.tsx) - a person's limits at the top of Usage, from `880f062`, on `ownLimits` and `limitWords`.

## Verified

- `vitest run`: 85 files, 452 tests; new `src/bridges/policies.test.ts` (4) and `src/resources/policies/words.test.ts` (4).
- `tsc` against scena's source: no error in `src/`.
- In Chromium against an isolated ahpd 0.12.0: the item, each grouping, an edit, a create, a held id refused, a delete, the limits read refused with -32008, light and dark, the JSON view.
- In Chromium against ahpd main `0e76f540`: the limits with what they used, when they reset, an `each` limit's members, and `Not counted yet`.

## Departures from the plan

- A new row's id is the form's first field rather than a field above the form, so it lines up with the rows and takes their style.

## Left for later

- See [deferred.md](deferred.md).
