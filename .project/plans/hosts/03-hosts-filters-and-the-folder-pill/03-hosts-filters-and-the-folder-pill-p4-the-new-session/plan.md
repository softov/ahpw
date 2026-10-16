---
title: The new session
domain: hosts
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/hosts/03-hosts-filters-and-the-folder-pill/plan.md
refs:
  - "[code://src/resources/sessions/New.tsx](../../../../../src/resources/sessions/New.tsx) - the host pill, the agent pill and `FolderPill`"
  - "[code://src/resources/sessions/FolderPill.tsx](../../../../../src/resources/sessions/FolderPill.tsx) - the folder pill and its walking menu, which this replaces"
  - "[code://src/resources/folders/pick.ts](../../../../../src/resources/folders/pick.ts) - `askFolder`, the folder picker with a path box"
  - "[code://src/resources/folders/used.ts](../../../../../src/resources/folders/used.ts) - `usedFolders`, the folders a host's sessions use"
  - "[code://src/shell/commands.ts#L76-102](../../../../../src/shell/commands.ts#L76-102) - commands with `keys`"
---

## Goal

The new session picks its folder and host in one pill, `folder [host]`, before the agent pill.
Ctrl+N and Alt+N open a new session.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p4.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - one pill picks the folder and its host](task-01-one-pill-for-folder-and-host.md) | done | - |
| [02 - ctrl+n and alt+n open a new session](task-02-ctrl-n-and-alt-n.md) | done | - |

## Risks and tradeoffs

- Typing a path now goes through the folder picker's path box - the picker already walks and checks a typed path.

## Resume state

- **Done so far:** both tasks; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** mono must look and work as it does now.

## Final verification checklist

- [x] One pill for the folder and its host, first in the tray.
- [x] Ctrl+N and Alt+N.
- [x] `pnpm test` and `pnpm typecheck` pass.
