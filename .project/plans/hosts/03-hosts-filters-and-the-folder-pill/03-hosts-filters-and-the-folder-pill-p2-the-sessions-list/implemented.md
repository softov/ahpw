---
title: The sessions list - implemented
date: 2026-10-16
refs:
  - git://main
  - "[code://src/resources/sessions/grouping.ts](../../../../../src/resources/sessions/grouping.ts)"
  - "[code://src/resources/sessions/sorting.ts](../../../../../src/resources/sessions/sorting.ts)"
  - "[code://src/resources/sessions/pins.ts](../../../../../src/resources/sessions/pins.ts)"
---

The sessions list groups by a first and a second key, day and week among them.
A Sort button orders it by last changed, created or name, with a flag for sessions waiting on the person.
Pinned sessions stay on top.

## What was built

- [`code://src/resources/sessions/days.ts`](../../../../../src/resources/sessions/days.ts) - day and week groups, with fixed ranks.
- [`code://src/resources/sessions/grouping.ts`](../../../../../src/resources/sessions/grouping.ts) - ranked groups and `arrangeTwo`.
- [`code://src/resources/sessions/sorting.ts`](../../../../../src/resources/sessions/sorting.ts) - `sortSessions` and the stored order.
- [`code://src/resources/sessions/pins.ts`](../../../../../src/resources/sessions/pins.ts) - the pins, per window.
- [`code://src/shell/explorer/ExplorerList.tsx`](../../../../../src/shell/explorer/ExplorerList.tsx) - `Row.subgroup`.

## Verified

- The suite, 63 files and 357 tests, and `pnpm typecheck` pass; a browser showed status then day, the sort by name, and a pin.

## Departures from the plan

- The urgency flag puts failed sessions after asking ones, not only asking ones, since both wait on the person.

## Left for later

- None.
