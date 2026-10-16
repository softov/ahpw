---
title: A window with every host - implemented
date: 2026-10-16
refs:
  - git://main
  - "[code://src/bridges/hosts.ts](../../../../src/bridges/hosts.ts)"
  - "[code://src/bridges/data.ts](../../../../src/bridges/data.ts)"
  - "[code://src/bridges/host-state.ts](../../../../src/bridges/host-state.ts)"
  - "[code://src/shell/embed/index.ts](../../../../src/shell/embed/index.ts)"
---

An embedder can open ahpw on every host it knows, in one window.
The lists merge the hosts' rows, a host filter narrows them, and each page, tab and action keeps to its own host.
A host that is down or refuses its token says so in its own line, and the other hosts keep working.
A window of one host works as hosts plan 01 left it.

## What was built

- [`code://src/shell/embed/index.ts`](../../../../src/shell/embed/index.ts) - the contract: `mode`, `token(id)`, `manageHosts({ edit })` and `onFocusHost`.
- [`code://src/bridges/data.ts`](../../../../src/bridges/data.ts) - a connection per host, following the embedder's list, and `noteRefusal`, which asks a failing host over plain HTTP whether it refuses the token.
- [`code://src/bridges/hosts.ts`](../../../../src/bridges/hosts.ts) - the host list, the filter and its menu, `hostLabel`, `onEachHost` and the summed counts.
- [`code://src/bridges/host-state.ts`](../../../../src/bridges/host-state.ts) - `hostState` and `fixHost`, Sign in or Retry.
- [`code://src/shell/explorer/HostLines.tsx`](../../../../src/shell/explorer/HostLines.tsx) - a line per shown host that is not connected, above each list.
- [`code://src/resources/folders/Explorer.tsx`](../../../../src/resources/folders/Explorer.tsx) - a branch per host, with its added and open folders kept per host.
- [`code://src/resources/sessions/New.tsx`](../../../../src/resources/sessions/New.tsx) - the host pill; New automation and New terminal ask the host too.
- [`code://src/shell/embed/HostSwitcher.tsx`](../../../../src/shell/embed/HostSwitcher.tsx) - with every host, "Every host" or the one host shown, and a pick filters.

## Verified

- The suite, 60 files and 347 tests, and `pnpm typecheck` pass.
- A browser pass with a stand-in embedder and three hosts, and a desk pass on two hosts; task 08's Resume lists each check.
- On the desk, the two hosts connected in one window; sessions on two hosts were made in the browser pass, not on the desk.

## Departures from the plan

- New automation picks its host with a select at the top of its form, not a pill, since that form's fields are selects.
- `HostPill.tsx`, `HostFilter.tsx` and `HostFolders.tsx` were not made: the pill is `Pill`, the filter is a header action, and `HostFolders` sits in `Explorer.tsx`.
- `hostState` takes the connection and the refusal rather than the store, so it is a plain function to test.
- The title bar's host menu, which the plan left alone, names "Every host" in multi and filters on a pick.

## Left for later

- A refused token is told apart only by an ahpd with commit `aef00a1b`; published 0.12.0 answers 426 whatever the token.
