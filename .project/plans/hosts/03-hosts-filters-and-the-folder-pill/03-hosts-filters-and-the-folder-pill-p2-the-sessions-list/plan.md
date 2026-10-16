---
title: The sessions list
domain: hosts
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/hosts/03-hosts-filters-and-the-folder-pill/plan.md
refs:
  - "[code://src/resources/sessions/grouping.ts](../../../../../src/resources/sessions/grouping.ts) - `Grouping`, `groupOf` and `arrange`, one key"
  - "[code://src/resources/sessions/index.ts#L39-107](../../../../../src/resources/sessions/index.ts#L39-107) - `GROUPING_SLOT` and the `sessions.groupBy.<g>` commands"
  - "[code://src/resources/sessions/Explorer.tsx#L96-128](../../../../../src/resources/sessions/Explorer.tsx#L96-128) - the rows, their order and their groups"
  - "[code://src/shell/explorer/ExplorerList.tsx](../../../../../src/shell/explorer/ExplorerList.tsx) - `Row.group`, one level of headings"
  - "file:///github/ahpapp/src/session-filter.ts - ahpapp's pinned section on top, whatever the grouping"
---

## Goal

Sessions group by a first key and an optional second, by day or week too.
A sort button orders them by last changed, created or name, with a flag that puts sessions waiting on the person first.
Pinned sessions show in their own section on top.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p2.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - sessions group by two keys, day and week among them](task-01-two-grouping-keys-day-and-week.md) | done | - |
| [02 - a sort button orders sessions, with an urgency flag](task-02-a-sort-button-and-the-urgency-flag.md) | done | 01 |
| [03 - pinned sessions show on top](task-03-pinned-sessions-on-top.md) | done | 01 |

## Risks and tradeoffs

- A second heading level makes a long list longer - each heading folds, and the fold is kept as today's is.

## Resume state

- **Done so far:** tasks 01 to 03, 2026-10-16; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** mono must look and work as it does now.

## Final verification checklist

- [x] Two grouping keys, day and week among them.
- [x] The sort button and the urgency flag.
- [x] Pinned sessions on top.
- [x] `pnpm test` and `pnpm typecheck` pass.
