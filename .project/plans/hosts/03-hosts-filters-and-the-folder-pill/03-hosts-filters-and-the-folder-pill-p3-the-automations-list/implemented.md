---
title: The automations list - implemented
date: 2026-10-16
refs:
  - git://main
  - "[code://src/resources/automations/arrange.ts](../../../../../src/resources/automations/arrange.ts)"
---

The automations list groups by host, status or next run, sorts by name, next run or last run, and filters by state.

## What was built

- [`code://src/resources/automations/arrange.ts`](../../../../../src/resources/automations/arrange.ts) - the groups, the orders, the filter and their storage.
- [`code://src/resources/automations/index.ts`](../../../../../src/resources/automations/index.ts) - `registerChoice`, the three header buttons.

## Verified

- `arrange.test.ts`, the suite and `pnpm typecheck` pass; a browser showed the next-run groups and the status menu.

## Departures from the plan

- The usual order is by name, as the list was, rather than ahpapp's next run.

## Left for later

- None.
