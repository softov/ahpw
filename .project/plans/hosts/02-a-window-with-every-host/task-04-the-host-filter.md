---
title: The lists show every host, with a host filter
status: done
depends: [task-02-a-connection-per-host.md]
layer: "src/bridges, src/shell/explorer, src/resources"
refs:
  - "[code://src/shell/explorer/ExplorerList.tsx#L10-L45](../../../../src/shell/explorer/ExplorerList.tsx#L10-L45) - `Row`, with a `group` and no host"
  - "[code://src/resources/sessions/grouping.ts#L7-L9](../../../../src/resources/sessions/grouping.ts#L7-L9) - `Grouping`, which gains `host`"
  - "[code://src/shell/embed/HostSwitcher.tsx](../../../../src/shell/embed/HostSwitcher.tsx) - a host's dot and name, to draw the same way in the filter"
---

## Objective

In multi, the sessions, automations, agents and folders lists merge the rows of the hosts the filter shows.
None picked shows every host, each row names its host, and sessions group by host.

## Files

- `CREATE: src/bridges/hosts.ts` - `HOST_FILTER`, the store path of the picked host ids, kept under `hostKey('ahpd-web.host-filter')`; `useShownHosts(): string[]`, every host when none is picked, and `[windowHost()]` in mono.
- `CREATE: src/shell/explorer/HostFilter.tsx` - the filter in a list's header, on scena's `ContextMenu`: each host with its dot, its name and a check.
- `UPDATE: src/shell/explorer/ExplorerList.tsx:10-25` - `Row.host?: { id: string; name: string }`, drawn as a muted line in multi.
- `UPDATE: src/resources/sessions/Explorer.tsx` - read `ahpPaths(host).sessions` for each shown host; each row's menu and open use its host.
- `UPDATE: src/resources/sessions/grouping.ts:7-9` - `host` in `Grouping` and `GROUPINGS`, offered in multi only.
- `UPDATE: src/resources/automations/Explorer.tsx`, `src/resources/agents/Explorer.tsx` - the same merge, and `runNow(host, ...)` and `menuOf(host, ...)` with the row's host.
- `UPDATE: src/resources/folders/Explorer.tsx` - each shown host's roots under a branch named for the host; the entry actions get the row's host.
- `UPDATE: src/resources/terminals/index.ts` - `sync` runs for each shown host.

## Steps

1. Write `src/bridges/hosts.ts` with `HOST_FILTER` and `useShownHosts`.
2. Write `HostFilter`, and mount it in each list's header in multi only.
3. Add `host` to `Row`, and merge each list's rows across the shown hosts, newest first.
4. Replace each list's `windowHost()` with the row's host in its open, menu and actions.
5. Add the `host` grouping to sessions.
6. Set `HOST_FILTER` to `[id]` on `embedder.onFocusHost`, so the desk's Open shows that host.

## Validation

- `src/bridges/hosts.test.ts`: no pick shows every host, a pick shows those, and mono shows the window's host.
- `pnpm test` and `pnpm typecheck` pass.
- By hand, in task 08: two hosts' sessions show together, and the filter narrows them.
- By hand, in task 08: a row opens on its own host.

## Resume

- Done 2026-10-16: `src/bridges/hosts.ts` holds `EMBED_MODE`, `HOST_LIST`, `HOST_FILTER`, `registerHosts`, `shownHosts`, `everyHost`, `useShownHosts`, `useEveryHost`, `useHostNames`, `useEach`, `refKey` and `refOf`.
- The filter is no new component: `HOST_FILTER_ACTION` is a header action with a menu, the pattern of the sessions Group menu, drawn in multi only.
- Its menu has one command per host, kept current with the host list, and Every host.
- `embedder.onFocusHost` sets the filter to that one host.
- Sessions, automations and agents merge the shown hosts' rows, keyed by `refKey`.
  In multi each row's line starts with its host's name, so `Row` gained no field.
- `useChannelOnEach` in `src/bridges/channel.ts` follows one channel on each shown host, for the automations.
- `ACTIVE_SESSION`, `ACTIVE_AUTOMATION` and `ACTIVE_AGENT` hold the host beside the item; the Changes and Details sidebars read the active session's host.
- Sessions group by host in multi; Reload and the automations' reload cover every shown host.
- The terminals panel syncs every host, and the palette lists every host's terminals.
- The log finds a session or a terminal on whichever host has it; `ComposerApi.host()` gives the composer's host to Add context.
- The folders explorer moved to [task 09](task-09-folders-per-host.md), since its tree keys everything by URI.
- Verified: `src/bridges/hosts.test.ts` and a host case in `grouping.test.ts`; the suite, 57 files and 339 tests, and `pnpm typecheck` pass.
- Still on `windowHost()`, and so failing in multi: New session and New automation (task 05), and the new terminal.
  Also host Info and Settings (task 06), and the status bar, alerts and badges (task 07).
