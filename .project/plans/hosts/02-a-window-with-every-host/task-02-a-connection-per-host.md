---
title: A window with every host connects to each one
status: done
depends: [task-01-the-embedder-says-its-mode.md]
layer: "src/bridges"
refs:
  - "[code://src/bridges/data.ts#L516-L570](../../../../src/bridges/data.ts#L516-L570) - `openSocket`, `connect` and `followEmbeddedHost`, for the window's host only"
  - "[code://src/bridges/data.ts#L97-L100](../../../../src/bridges/data.ts#L97-L100) - `windowHost()`, the one host of a mono page"
---

## Objective

In multi, the data layer connects to every host the embedder lists and follows the list as hosts come and go.
Mono connects as it does now.

## Files

- `UPDATE: src/bridges/data.ts:516-527` - `openSocket(id)` opens the socket of the host `id`, with `embedder.token(id)` in multi.
- `UPDATE: src/bridges/data.ts:533-546` - `connect(store, multi)` adds each id of `windowHosts()`, through a new `addOne(store, multi, id)`.
- `UPDATE: src/bridges/data.ts:564-570` - `followEmbeddedHost` becomes `followHosts(list)`: it adds a new host, removes a gone one with `multi.removeHost`, and reconnects one whose address changed.
- `UPDATE: src/bridges/data.ts:97-100` - `windowHost()` throws in multi; a new `windowHosts(): Promise<string[]>` answers every host id in multi, and `['daemon']` in mono.
- `UPDATE: src/bridges/data.test.ts` - multi cases with two hosts.

## Steps

1. Give `openSocket` the host id, and find its address in `embedder.hosts()` in multi.
2. Move the body of `connect` into `addOne(store, multi, id)`, and call it for each id of `windowHosts()`.
3. Replace `followEmbeddedHost` with `followHosts`, which compares the new list with the hosts it added.
4. Make `windowHost()` throw `Error('No window host in a window with every host')` in multi.
5. In `wake` and `reconnectHost`, use the ids the data layer added, not `windowHost()`.

## Validation

- `src/bridges/data.test.ts`: in multi, two hosts connect, and a host added later connects.
- `src/bridges/data.test.ts`: a removed host stops, and mono still adds `daemon` alone.
- `pnpm test` and `pnpm typecheck` pass.

## Resume

- Done 2026-10-16: `windowHosts()` answers every embedder host in multi and `['daemon']` otherwise; `connect` adds each with `addOne`.
- `openSocket(id)` reads that host's address and `token(id)` in multi.
- `followHosts` replaces `followEmbeddedHost`: in multi it adds a new host, lets a removed one go with `letGo`, and reconnects one whose address changed.
- `joined` holds the hosts this page added, so a dropped host is let go even before its socket opened (found by the new test).
- `windowHost()` throws in multi; `wake` and `reconnectHost` use `windowHosts()`.
- Verified: two multi cases in `src/bridges/data.test.ts`; the suite, 56 files and 335 tests, and `pnpm typecheck` pass.
