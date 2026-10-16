---
title: A host in every key - implemented
date: 2026-10-16
refs:
  - git://main
  - "[code://src/bridges/data.ts](../../../../src/bridges/data.ts)"
  - "[code://src/bridges/channel.ts](../../../../src/bridges/channel.ts)"
  - "[code://src/resources/sessions/workspace.ts](../../../../src/resources/sessions/workspace.ts)"
---

ahpw names a host in every key it keeps: the store paths, the tab keys, the page props and the maps keyed by a resource.
Every call to the data layer goes through the handle of one host.
Mono works as before, with the host `daemon`, served by ahpd, by `ahpw serve` and in a desk window.
A window that shows every host, hosts plan 02, now changes no key.

## What was built

- [`code://src/bridges/data.ts`](../../../../src/bridges/data.ts) - `HostBridge` and `hostBridge(id)`, one per host; `windowHost()`; `ahpPaths(host)` under `$/ahp/hosts/<host id>/`; `channelPath`, `titlePath` and `channelErrorPath` take the host first.
- [`code://src/bridges/channel.ts`](../../../../src/bridges/channel.ts) - `useChannel(host, uri, reducer)`.
- [`code://src/resources/files/viewers.ts`](../../../../src/resources/files/viewers.ts) - `fileTabKey(component, host, uri)`, `fileTabOf` and `openAsItems` with the host.
- [`code://src/resources/terminals/index.ts`](../../../../src/resources/terminals/index.ts) - `terminal:<host>:<uri>` keys, and its sets by tab key.
- [`code://src/resources/log/wire.ts`](../../../../src/resources/log/wire.ts) - the requests asked and the terminals listed, per host.
- [`code://src/resources/sessions/workspace.ts`](../../../../src/resources/sessions/workspace.ts) - `SessionHostContext` and `useSessionHost()`, the session page's host for the transcript's parts.
- [`code://src/App.tsx`](../../../../src/App.tsx) - the layout key `ahpd-web.layout.v2`.
- Every open command takes `host?`, and every page reads `host` from its props.

## Verified

- `pnpm typecheck` passes; `vitest run` passes 331 tests in 56 files.
- New tests: `src/bridges/data.test.ts`, and new cases in `log.test.ts`, `terminals/index.test.ts` and `files/viewers.test.ts`.
- Headless Edge and a release desk ran against ahpd 0.12.0 with cofold and a stand-in model; [task 06](task-06-mono-end-to-end.md) lists what each showed.

## Departures from the plan

- Task 03 left the file pages' handle calls to task 05, which owns the helpers they go through.
- Task 04 keeps `shared` in `composer-commands.ts` as it was, since a command id keys it, not a resource.

## Left for later

- The browser console was not checked for new errors during task 06.
