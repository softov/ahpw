---
title: A host's Info and Settings open from the filter
status: done
depends: [task-04-the-host-filter.md]
layer: "src/shell/explorer, src/resources/host, src/shell"
refs:
  - "[code://src/resources/host/index.ts](../../../../src/resources/host/index.ts) - `ahp.openHostInfo` and `ahp.openSettings`, which take `host?` since plan 01"
  - "[code://src/shell/register-shell.tsx#L203](../../../../src/shell/register-shell.tsx#L203) - the activity bar's Host button, on `ahp.openHostInfo`"
---

## Objective

In multi, each host in the host filter has a menu with Info and Settings, which open that host's pages.
The activity bar's Host button opens the Info of the host the filter shows, or of the first host.

## Files

- `UPDATE: src/shell/explorer/HostFilter.tsx` - a menu on each host: Info and Settings, running `ahp.openHostInfo` and `ahp.openSettings` with `{ host }`.
- `UPDATE: src/resources/host/index.ts` - in multi, `ahp.openHostInfo` without a host takes the first of `useShownHosts()`'s hosts, not `windowHost()`.

## Steps

1. Add the host menu to `HostFilter`, with the two items.
2. Give `ahp.openHostInfo` and `ahp.openSettings` their multi default.

## Validation

- `pnpm test` and `pnpm typecheck` pass.
- By hand, in task 08: each host's Info and Settings open as their own tabs, `host:info:<host>`.

## Resume

- Done 2026-10-16: the filter's menu lists each host's Info and Settings under the hosts, as commands `hosts.info.<host>` and `hosts.settings.<host>` in `HOST_SLOT`.
- `HostFilter.tsx` was not needed: the filter is the header action of task 04, so its menu holds the new items.
- In multi, `ahp.openHostInfo` and `ahp.openSettings` without a host take the first host the filter shows.
  Their tabs name the host, so two hosts' tabs differ.
- Verified: the suite, 58 files and 341 tests, and `pnpm typecheck` pass.
