---
title: The status bar and the counts cover every host
status: done
depends: [task-02-a-connection-per-host.md]
layer: "src/bridges, src/resources/sessions, src/shell"
refs:
  - "[code://src/bridges/Status.tsx#L38-L72](../../../../src/bridges/Status.tsx#L38-L72) - `ConnectionStatus`, one host's name and state"
  - "[code://src/bridges/index.ts#L9-L44](../../../../src/bridges/index.ts#L9-L44) - `watchConnection`, the lost and back notices of one host"
  - "[code://src/resources/sessions/alerts.ts#L53](../../../../src/resources/sessions/alerts.ts#L53) - `watchSessions`, the unread and working counts of one host"
---

## Objective

In multi, the status bar says how many hosts are connected, with each host's state in its tooltip.
The lost and back notices name their host, and the unread and working counts add up every host.

## Files

- `UPDATE: src/bridges/Status.tsx:38-72` - in multi, "2 of 3 hosts" with a dot for the worst state, and a tooltip with one line per host; mono as now.
- `UPDATE: src/bridges/index.ts:9-44` - `watchConnection` for each connected host, its notice id `ahp:connection:<host>`, and the host's name in the words.
- `UPDATE: src/resources/sessions/alerts.ts:53` - `watchSessions` sums `sessionsUnread` and `sessionsWorking` over every host; an alert's open passes its session's host.
- `UPDATE: src/i18n` - the words for the host count, in every locale.

## Steps

1. Draw the multi status in `ConnectionStatus`, from each host's connection path.
2. Watch each host's connection in `watchConnection`, as `followHosts` adds and removes them.
3. Sum the counts in `watchSessions`, and pass the host in each alert's `ahp.openSession`.

## Validation

- `pnpm test` and `pnpm typecheck` pass.
- By hand, in task 08: stopping one host says so with its name, and the count shows one host down.

## Resume

- Done 2026-10-16: `onEachHost(scena, watch)` in `src/bridges/hosts.ts` watches every host and follows the host list; the notices, the alerts, the counts and the terminals use it.
- In multi the status bar says "2 of 3 hosts" with the worst state's dot, and its tip has a line per host.
  Its retry tries every host that is down.
- The lost and back notices are per host, `ahp:connection:<host>`, and name the host in multi; `ahp.reconnect` takes `host?`.
- The alerts watch every host; `alertId` and `noticeOf` take the host, and an alert opens its session on its host.
- The activity bar's badges read `sessionCountPaths()`: one host's counts in mono, every host's sum in multi.
- Verified: the alerts test reads the host; the suite, 57 files and 339 tests, and `pnpm typecheck` pass.
