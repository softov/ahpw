---
title: Usage - implemented
date: 2026-10-16
refs:
  - git://7b333b6
  - "[code://src/bridges/usage.ts](../../../../../src/bridges/usage.ts)"
  - "[code://src/resources/usage/index.ts](../../../../../src/resources/usage/index.ts)"
---

A 📊 section lists each shown host's usage pools with what they were charged over a period, or the records summed by user, team or project, and a pool opens in a page with its periods, a range and its records.

## What was built

- [`code://src/bridges/usage.ts`](../../../../../src/bridges/usage.ts) - `servesUsage`, the five reads by the `x-ahpd/usage/*` command or the `usage://` read, `periodRange` and `totalWords`.
- [`code://src/bridges/served.ts`](../../../../../src/bridges/served.ts) - `trackServed` and `useServingHosts` take a test as well as a channel scheme.
- [`code://src/resources/usage/state.ts`](../../../../../src/resources/usage/state.ts) - the store paths, the choices' values, and `monthSoFar`.
- [`code://src/resources/usage/index.ts`](../../../../../src/resources/usage/index.ts) - `registerUsage`: the Period and Group choices, reload, `ahp.showUsage`, `ahp.openUsagePool`, and the sidebar mount.
- [`code://src/resources/usage/Explorer.tsx`](../../../../../src/resources/usage/Explorer.tsx) - the list, grouped by kind, most charged first; a range bar while the period is a range; a host's refusal as its own row.
- [`code://src/resources/usage/PoolPage.tsx`](../../../../../src/resources/usage/PoolPage.tsx) - the day, week and month, a range, and its records, each opening its session.
- [`code://src/resources/usage/words.ts`](../../../../../src/resources/usage/words.ts) - a total in one line, with plural tokens and calls.
- [`code://src/shell/register-shell.tsx`](../../../../../src/shell/register-shell.tsx) - the 📊 activity bar entry, and `oneOverlaidSidebar`: on a narrow screen, showing one sidebar puts the other away.
- The `.web-spend__*` styles, the `period` icon, and the `usage` words in en, es and pt.

## Verified

- `src/bridges/usage.test.ts`: 5 tests; `pnpm test` 414 pass, `pnpm typecheck` passes.
- On a scratch ahpd 0.12.0 host with seeded records: the pools listed for this month and this week with the right totals; grouping by team summed them, with the record that names no team under None; a range of 1 to 5 October listed only that week's call; a pool's page showed its periods, range and records; Open session opened the session page.
- At 390 px wide: one sidebar at a time, the pool page's periods flow, and a record takes two lines.

## Departures from the plan

- The period and grouping are single choices, as `registerChoice` gives, and the range lives in the store for the visit only.
- A pool's page reads its records over its own range, the first of the month to today unless changed.

## Left for later

- See [the parent's deferred.md](../deferred.md).
