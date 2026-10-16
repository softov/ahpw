---
title: The data layer has a handle per host
status: done
depends: []
layer: "src/bridges"
refs:
  - "[code://src/bridges/data.ts#L62](../../../../src/bridges/data.ts#L62) - `HOST`, which this task replaces with a host per handle"
  - "[code://src/bridges/data.ts#L92-L126](../../../../src/bridges/data.ts#L92-L126) - the module state, `settleWaiting` and `ready()`, for one host"
  - "[code://src/bridges/data.ts#L427-L479](../../../../src/bridges/data.ts#L427-L479) - `openSocket`, `connect`, `reconnect` and `followEmbeddedHost`"
  - "[code://src/shell/embed/index.ts](../../../../src/shell/embed/index.ts) - `host()`, the window's host and its id"
---

## Objective

`hostBridge(id)` returns a handle bound to one host, with every function the data layer exports today.
The handle's state is that host's own, and a host that fails refuses only its own requests.
The old exports stay, as `hostBridge(windowHost())`, until task 05.

## Files

- `UPDATE: src/bridges/data.ts:62` - `HOST` goes; `windowHost()` names the window's host, `daemon` in mono.
- `UPDATE: src/bridges/data.ts:92-126` - `client` stays one; `newer`, `followed` and `waiting` move into `HostState`, kept in `hosts: Map<string, HostState>`.
- `UPDATE: src/bridges/data.ts:131-297` - each exported function becomes a method of `HostBridge`, built by `hostBridge(id)`; the old exports call `hostBridge(windowHost())`.
- `UPDATE: src/bridges/data.ts:335-479` - `watchHost`, `watchChannels`, `connect` and `reconnect` work per host id, from the `hostId` each event carries.
- `CREATE: src/bridges/data.test.ts` - the handle's keying and its failures, over a fake `MultiHostClient`.

## Steps

1. Add `export interface HostBridge` with the signatures of today's exports, from `follow` to `reconnect`.
2. Add `export function windowHost(): string`, which answers `'daemon'`, the one host of a mono page.
3. Add `interface HostState { newer: Newer; followed: Map<string, Followed>; waiting: Set<Waiter> }` and `const hosts = new Map<string, HostState>()`.
4. Add `export function hostBridge(id: string): HostBridge`, which keeps one handle per id and reads and writes only `hosts.get(id)`.
5. Make `settleWaiting(id, error?)` settle only that host's waiters, and `ready(id)` wait on that host's status.
6. Make `connect` add the window's host under `windowHost()`.
7. Keep each old export as one line that calls the same method on `hostBridge(windowHost())`.

## Validation

- `src/bridges/data.test.ts`: two hosts over a fake client keep their own followed channels.
- `src/bridges/data.test.ts`: a failed host refuses its own waiting requests, not the other host's.
- `pnpm test` and `pnpm typecheck` pass, and nothing outside `src/bridges` changes.

## Resume

- Done 2026-10-16: `HostBridge`, `hostBridge(id)` and `windowHost()` in `src/bridges/data.ts`; each host's followed channels, waiting requests, newer summaries and connection count are in `HostData`, by host id.
- `publishHost` takes its host's sessions by `hostId`, and `watchHost` and `watchChannels` key their work by the event's `hostId`.
- `wake` retries each host that is down; `reconnect` adds only the window's host, the one host a mono page knows.
- The old exports call `hostBridge(windowHost())`; the store paths are still one set, until task 02.
- `windowHost()` answers `daemon`, because the embedder's id comes only from the asynchronous `host()`.
  scena does not wait for an eager provider's load before pages mount, so the id could come too late (Answers row corrected).
- Verified: `src/bridges/data.test.ts`, 3 cases over a mocked `MultiHostClient`; the whole suite, 56 files and 328 tests, and `pnpm typecheck` pass.

