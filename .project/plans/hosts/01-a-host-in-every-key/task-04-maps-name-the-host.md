---
title: The maps keyed by a resource name the host
status: done
depends: [task-01-a-handle-per-host.md]
layer: "src/bridges, src/resources"
refs:
  - "[code://src/bridges/summaries.ts#L15-L19](../../../../src/bridges/summaries.ts#L15-L19) - `Newer`, keyed by session URI"
  - "[code://src/resources/log/wire.ts#L33-L36](../../../../src/resources/log/wire.ts#L33-L36) - `asked` and `listed`"
---

## Objective

Each map that holds a session's, a terminal's or a request's state is per host.
Two hosts with the same URI do not share an entry.

## Files

- `UPDATE: src/bridges/summaries.ts:15-45` - `Newer` stays per host; it lives in the host's `HostState` (task 01), and its comment says so.
- `UPDATE: src/bridges/summaries.test.ts` - its cases, for one host's overlay.
- `UPDATE: src/resources/log/wire.ts:33-36` - `asked` and `listed` by host.
- `UPDATE: src/resources/sessions/composer-commands.ts:59` - the map by host and URI.
- `UPDATE: src/resources/sessions/composer-commands.ts:127` - the map by host and URI.
- `UPDATE: src/resources/sessions/Activity.tsx:12-13` - the maps by host and URI.
- `UPDATE: src/resources/sessions/Question.tsx:11` - the map by host and URI.

## Steps

1. Key each map in the Files list by `${host}\u0000${uri}`, or keep one map per host, as the file's reads need.
2. Change the comment in `summaries.ts` that says ahpw shows one host.

## Validation

- `src/bridges/summaries.test.ts` passes.
- `pnpm test` and `pnpm typecheck` pass.

## Resume

- Done 2026-10-16: `src/resources/log/wire.ts` keeps `asked` and `listed` per host; `observing`, `noteFrame` and `forgetFrames` take the host first.
- `Activity.tsx` keys its times and `Question.tsx` keys what it sent by host and key, with the host from `SessionHostContext`, which `SessionPage` provides beside `WorkspaceContext`.
- `composerPath(host, chatUri)` keys the composers; `Composer` takes a `host` prop from `SessionPage`.
- `shared` in `composer-commands.ts` is keyed by command id, not by a resource, so it stays as it was.
- `Newer` was already per host since task 01; the comment in `summaries.ts` now says so.
- Verified: a log case where two hosts use one request id; the suite, 56 files and 331 tests, and `pnpm typecheck` pass.
