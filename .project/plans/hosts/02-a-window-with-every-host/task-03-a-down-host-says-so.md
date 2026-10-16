---
title: A down or refused host says so in its own rows
status: done
depends: [task-04-the-host-filter.md]
layer: "src/resources, src/bridges"
refs:
  - "[code://src/resources/sessions/Explorer.tsx#L66-L125](../../../../src/resources/sessions/Explorer.tsx#L66-L125) - the notice a list shows while its one host is down"
  - "[code://src/App.tsx#L96-L104](../../../../src/App.tsx#L96-L104) - `Limen`, the sign-in wall, which a multi window passes as the embedder"
---

## Objective

In multi, a host that is down or refuses its token shows "Down" or "Sign in" in the filter and in place of its rows.
"Sign in" opens the desk's form on that host, and the other hosts keep working.

## Files

- `CREATE: src/bridges/host-state.ts` - `hostState(store, host): 'connected' | 'connecting' | 'down' | 'refused'`, from `ahpPaths(host).connection`; a failure the host gives as an authentication error is `refused`.
- `UPDATE: src/shell/explorer/ExplorerList.tsx:37-45` - a `hosts` prop: for each shown host that is not connected, one line with its name, the state, and "Sign in" or "Retry".
- `UPDATE: src/resources/sessions/Explorer.tsx`, `src/resources/automations/Explorer.tsx`, `src/resources/agents/Explorer.tsx` - pass the shown hosts' states to `ExplorerList`.
- `UPDATE: src/resources/folders/Explorer.tsx` - the same line above a down host's roots.
- `UPDATE: src/i18n` - the words for Down, Sign in and Retry, in every locale.

## Steps

1. Write `hostState` and its test.
2. Add the host lines to `ExplorerList`; "Sign in" calls `embedder.manageHosts({ edit: host })`, and "Retry" calls `hostBridge(host).reconnect()`.
3. Pass the states from each list, and draw the same line in the folders explorer.
4. Keep the mono notices as they are: one host, one notice.

## Validation

- `src/bridges/host-state.test.ts`: each connection state maps to its host state.
- `pnpm test` and `pnpm typecheck` pass.
- By hand, in task 08: stopping one host shows "Down" in its place, and the other host's rows stay.

## Resume

- Done 2026-10-16: `src/bridges/host-state.ts` gives `hostState(connection, refused)` and `fixHost(host, state)`.
- A browser socket does not say why it closed.
  So `noteRefusal` in `data.ts` asks a failing host's address once over plain HTTP.
  ahpd answers 401 for a refused token, to any origin, and the answer is kept at `ahpPaths(host).refused`.
- `src/shell/explorer/HostLines.tsx` draws a line per shown host that is not connected, with Sign in or Retry.
  `ExplorerList` draws it with `hostLines`, set in multi by the sessions, automations and agents explorers.
- The filter's menu names a host's state beside its name, and offers `hosts.fix.<host>`, Sign in or Retry, while it is not connected.
- The folders explorer's line moves to task 09, since that explorer is on one host until then.
- Verified: `src/bridges/host-state.test.ts` and `plainUrl` in `src/bridges/socket.test.ts`; the suite, 59 files and 344 tests, and `pnpm typecheck` pass.
