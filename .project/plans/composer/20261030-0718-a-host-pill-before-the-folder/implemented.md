---
title: A host pill before the folder - implemented
date: 2026-10-30
refs:
  - git://62ab786
  - git://fe528ef
  - "[code://src/resources/sessions/New.tsx#L313-L320](../../../../src/resources/sessions/New.tsx#L313-L320)"
  - "[code://src/bridges/host-state.ts#L16](../../../../src/bridges/host-state.ts#L16)"
---

With every host, the new session box shows a Host pill before the Folder pill. The Host list shows each host with its state, and a host that is not connected offers Sign in or Retry. The Folder list shows the folders of the picked host only.

## What was built

- [`code://src/resources/sessions/New.tsx`](../../../../src/resources/sessions/New.tsx) - `pickHost` and `pickFolder` replace `pickWhere`. `ahp.new.host` lists every host with its state and a Manage group. `ahp.new.where` lists the picked host's folders and Open folder. The Host pill shows the state while the host is not connected. The folded tray starts with the host name.
- [`code://src/bridges/host-state.ts`](../../../../src/bridges/host-state.ts) - `hostFix(state)`: Sign in for a refused host, Retry for a host that is down, else nothing.
- [`code://src/shell/embed/HostSwitcher.tsx`](../../../../src/shell/embed/HostSwitcher.tsx) - uses `hostFix`.
- [`code://src/shell/explorer/HostLines.tsx`](../../../../src/shell/explorer/HostLines.tsx) - uses `hostFix`.
- [`code://src/i18n/en.json`](../../../../src/i18n/en.json), [`code://src/i18n/es.json`](../../../../src/i18n/es.json) and [`code://src/i18n/pt.json`](../../../../src/i18n/pt.json) - `host`, `hostHint` and `manage` are new; `whereHint` does not name the host; `folders` is removed.

## Verified

- [`code://src/bridges/host-state.test.ts`](../../../../src/bridges/host-state.test.ts) - `hostFix` for each of the four states.
- `pnpm typecheck` and `pnpm test` passed, and CI passed on PR #17.
- By hand with a test embedder in multi mode. It gave three hosts: the host on 37537, the same host with a bad token, and a closed port.
- The tray reads Host, Folder, Agent, and the folded tray names the host, at 1280 light and 420 dark.
- A refused host opens the host form, a down host offers Retry, and another connected host starts its folder from its home.

## Departures from the plan

- None.

## Left for later

- Nothing.
