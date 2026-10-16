---
title: One pill picks the folder and its host
status: done
depends: []
layer: "src/resources/sessions, src/resources/folders"
refs:
  - "[code://src/resources/sessions/New.tsx](../../../../../src/resources/sessions/New.tsx) - `HOST_COMMAND`, `pickHost`, the tray"
  - "[code://src/resources/folders/pick.ts](../../../../../src/resources/folders/pick.ts) - `askFolder`"
---

## Objective

The pill reads `name [host]`, with the host only in multi, and comes first in the tray.
Its list holds the folders used on the shown hosts, one `<host> Folders` row per host, and Remote with each host and Add host.

## Files

- `CREATE: src/resources/sessions/where.ts` - `whereLabel(folder, hostName)` and `usedEverywhere(store, hosts)`, the folders used across hosts as `{ host, path }`.
- `UPDATE: src/resources/sessions/New.tsx` - `WHERE_COMMAND` replaces `HOST_COMMAND`; its list pushes the used folders, the hosts' Folders rows opening `askFolder({ host })`, and Remote as a nested list; the pill replaces the host pill and `FolderPill`, before the agent pill.
- `DELETE: src/resources/sessions/FolderPill.tsx` - its menu is replaced by the pill's list and the folder picker.
- `UPDATE: src/style/app.css` - drop the `web-folder-pill` and `web-folder-menu` rules.
- `UPDATE: src/i18n` - `sessions/new/where`, `sessions/new/whereHint`, `sessions/new/folders`, `sessions/new/remote`, `sessions/new/addHost`, in every locale; drop the folder pill's words.

## Steps

1. Write `where.ts` and its test.
2. Register `WHERE_COMMAND` with its list, and Remote's nested list, in multi only.
3. Replace the host pill and `FolderPill` with the one pill, first in the tray.
4. Delete `FolderPill.tsx`, its CSS and its words.

## Validation

- `src/resources/sessions/where.test.ts`: the label in mono and multi; the used folders of two hosts, newest first, each once.
- `pnpm test` and `pnpm typecheck` pass.
- By hand: a folder of the second host picked from the pill starts the session there.

## Resume
