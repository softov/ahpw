---
title: The new session - implemented
date: 2026-10-16
refs:
  - git://main
  - "[code://src/resources/sessions/where.ts](../../../../../src/resources/sessions/where.ts)"
  - "[code://src/resources/sessions/New.tsx](../../../../../src/resources/sessions/New.tsx)"
---

The new session picks its folder and host in one pill, `folder [host]`, first in the tray, and opens with Ctrl+N or Alt+N.

## What was built

- [`code://src/resources/sessions/where.ts`](../../../../../src/resources/sessions/where.ts) - `whereLabel` and `wheresOf`, each host's own folder first, then the folders its sessions use.
- [`code://src/resources/sessions/New.tsx`](../../../../../src/resources/sessions/New.tsx) - `WHERE_COMMAND` and `pickWhere`; the list has Recent folders, Browse with one Folders row per host, and Remote with each host and Add host.
- [`code://src/resources/sessions/index.ts`](../../../../../src/resources/sessions/index.ts) - `ahp.newSession` has the keys `ctrl+n` and `alt+n`.
- `FolderPill.tsx`, its CSS and its words are deleted.

## Verified

- `where.test.ts`, the suite (65 files, 363 tests) and `pnpm typecheck` pass.
- In a browser, mono: Alt+N opened a new session, and the pill read `work`.
- In a browser, multi with alpha, beta and gamma (down): the pill read `work [alpha]`; the list held `work [alpha]`, `work2 [beta]`, alpha and beta Folders, and Remote.
- Remote listed alpha, beta, gamma marked down, and Add host.
- Picking `work2 [beta]` moved the pill to beta, and the agent pill followed.

## Departures from the plan

- A host that is not connected has no Recent or Folders rows, since its folder picker cannot walk it; Remote still lists it.
- `wheresOf` keeps each host's own folder first, rather than one list newest first across hosts.

## Left for later

- None.
