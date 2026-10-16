---
title: The store paths name the host
status: done
depends: [task-01-a-handle-per-host.md]
layer: "src/bridges, src/resources, src/shell"
refs:
  - "[code://src/bridges/data.ts#L17-L54](../../../../src/bridges/data.ts#L17-L54) - the `AHP_*` paths and the path builders, with no host"
  - "[code://src/bridges/data.ts#L303-L327](../../../../src/bridges/data.ts#L303-L327) - `publishHost`, which writes them"
---

## Objective

Every store path the data layer writes is under `$/ahp/hosts/<host id>/`, and every view reads its host's paths.

## Files

- `UPDATE: src/bridges/data.ts:17-54` - `ahpPaths(host)` returns the paths `AHP_CONNECTION` to `AHP_DETACHED` for one host; `channelPath`, `titlePath` and `channelErrorPath` take the host first.
- `UPDATE: src/bridges/data.ts:303-424` - `publishHost`, `watchHost`, `flush` and `watchChannels` write under the event's host.
- `UPDATE: src/bridges/index.ts` - the paths it reads.
- `UPDATE: src/bridges/Status.tsx` - the connection and the counts of the window's host.
- `UPDATE: src/bridges/channel.ts` - `useChannel(host, uri, reducer)`.
- `UPDATE: src/resources/terminals/index.ts` - its nine reads of the paths.
- `UPDATE: src/resources/terminals/TerminalPage.tsx` - the paths of the page's host.
- `UPDATE: src/resources/terminals/rows.ts` - the detached terminals of the host.
- `UPDATE: src/resources/host/Info.tsx` - the host, server and caps paths.
- `UPDATE: src/resources/sessions/Explorer.tsx` - the sessions and the counts.
- `UPDATE: src/resources/sessions/alerts.ts` - the unread and working counts.
- `UPDATE: src/resources/sessions/New.tsx` - the agents and the default folder.
- `UPDATE: src/resources/sessions/FolderPill.tsx` - the default folder.
- `UPDATE: src/resources/sessions/Details.tsx` - the session's title and channel.
- `UPDATE: src/resources/sessions/index.ts` - `titlePath` for the tab title.
- `UPDATE: src/resources/sessions/composer-commands.ts` - the agents path.
- `UPDATE: src/resources/sessions/Page.tsx` - the channel and its error.
- `UPDATE: src/resources/sessions/Composer.tsx` - the channel.
- `UPDATE: src/resources/sessions/Attached.tsx` - the titles.
- `UPDATE: src/resources/folders/Explorer.tsx` - the default folder and the connection.
- `UPDATE: src/resources/folders/actions.ts` - the default folder.
- `UPDATE: src/resources/automations/index.ts` - the caps and the titles.
- `UPDATE: src/resources/automations/Edit.tsx` - the caps and the agents.
- `UPDATE: src/resources/automations/Page.tsx` - the channel.
- `UPDATE: src/resources/agents/Page.tsx` - the agents.
- `UPDATE: src/resources/agents/Explorer.tsx` - the agents.
- `UPDATE: src/resources/agents/index.ts` - the agents.
- `UPDATE: src/resources/changes/Explorer.tsx` - the session's channel.
- `UPDATE: src/resources/log/LogPage.tsx` - the connection.
- `UPDATE: src/shell/register-shell.tsx` - the connection and the server.
- `UPDATE: src/shell/CommandPalette.tsx` - the sessions.

## Steps

1. Replace the `AHP_*` constants with `export function ahpPaths(host: string)`, which answers each path under `$/ahp/hosts/${encodeURIComponent(host)}/`.
2. Give `channelPath`, `titlePath` and `channelErrorPath` a first parameter, `host`.
3. Make the writers in `data.ts` take the host from the event they write, never from `windowHost()`.
4. Make each view read its host's paths: the page's `host` prop (task 03), or `windowHost()` in a sidebar.
5. Give `useChannel` the host as its first parameter.

## Validation

- `pnpm typecheck` passes with no `AHP_` constant left: `rg "AHP_[A-Z]" src` finds only `ahpPaths`.
- `pnpm test` passes.
- By hand, served by ahpd: the sessions, the status bar, host Info and the terminals show as before.

## Resume

- Done 2026-10-16: `ahpPaths(host)` in `src/bridges/data.ts` answers one host's paths under `$/ahp/hosts/<host id>/`, the same object each time; the `AHP_*` constants are gone.
- `channelPath`, `titlePath` and `channelErrorPath` take the host first, and `useChannel(host, uri, reducer)` follows through `hostBridge(host)`.
- The writers in `data.ts` use the event's or the handle's host.
  Only `connect` and the provider's load use `windowHost()`, the one host a mono page connects.
- Every view reads `ahpPaths(windowHost())` for now; task 03 moves pages to their `host` prop.
- Left as they were: the page-state paths not about a host, such as `SESSIONS_ARCHIVED` in `src/resources/sessions/state.ts`.
- Verified: a 4th case in `src/bridges/data.test.ts`; the whole suite, 56 files and 329 tests, and `pnpm typecheck` pass; `rg "AHP_[A-Z]" src` finds nothing.
- Not done by hand: the check served by ahpd moves to task 06, which runs mono end to end.
