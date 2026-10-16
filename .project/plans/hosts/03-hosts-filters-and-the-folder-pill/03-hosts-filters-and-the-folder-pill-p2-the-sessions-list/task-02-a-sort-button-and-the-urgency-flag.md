---
title: A sort button orders sessions, with an urgency flag
status: done
depends: [task-01-two-grouping-keys-day-and-week.md]
layer: "src/resources/sessions"
refs:
  - "[code://src/resources/sessions/Explorer.tsx#L96](../../../../../src/resources/sessions/Explorer.tsx#L96) - today's order, by `modifiedAt` across hosts"
  - "[code://src/resources/sessions/status.ts](../../../../../src/resources/sessions/status.ts) - `activityOf`, which says a session waits on the person"
---

## Objective

A sort button beside the group button offers Last changed, Created and Name.
The dates sort newest or oldest first, and a flag puts sessions waiting on you first.
Last changed, newest first, with the flag off, is the order today.

## Files

- `CREATE: src/resources/sessions/sorting.ts` - `Sorting` `{ by, newest, urgent }`, `sortSessions`, `readSorting` and `writeSorting`.
- `UPDATE: src/resources/sessions/state.ts` - `SESSIONS_SORTING`.
- `UPDATE: src/resources/sessions/index.ts:60-66` - a `sessions.sort` header action with `menu: SORTING_SLOT`, its commands in categories Sort by, Order and a flag.
- `UPDATE: src/resources/sessions/Explorer.tsx:96` - sort with `sortSessions` before grouping.
- `UPDATE: src/resources/emojis.ts` - a sort icon, if none.
- `UPDATE: src/i18n` - the sort words, in every locale.

## Steps

1. Write `sorting.ts` and its test.
2. Register the button and its commands.
3. Sort the rows, then group them.

## Validation

- `src/resources/sessions/sorting.test.ts`: each key, both orders, the flag first.
- `pnpm test` and `pnpm typecheck` pass.

## Resume

- Done 2026-10-16: `src/resources/sessions/sorting.ts` sorts by last changed, created or name, and puts sessions asking or failed first with the flag.
- The Sort button sits beside Group, pressed while the order is not the usual one; its menu has Sort by, Order and Also.
- Verified: `sorting.test.ts`; seen in a browser, by name.
