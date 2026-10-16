---
title: The automations list
domain: hosts
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/hosts/03-hosts-filters-and-the-folder-pill/plan.md
refs:
  - "[code://src/resources/automations/index.ts#L38-43](../../../../../src/resources/automations/index.ts#L38-43) - the header the buttons join"
  - "[code://src/resources/automations/Explorer.tsx#L48-70](../../../../../src/resources/automations/Explorer.tsx#L48-70) - the rows, sorted by title"
  - "file:///github/ahpapp/src/automation-list.ts - `AutoGroup`, `AutoSort`, `AutoFilter` and the next-run days"
---

## Goal

The automations list gets a group button, a sort button and a status filter, as ahpapp has.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p3.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - automations group, sort and filter by status](task-01-group-sort-and-status.md) | done | - |

## Risks and tradeoffs

- None past the parent's.

## Resume state

- **Done so far:** task 01, 2026-10-16; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** mono must look and work as it does now.

## Final verification checklist

- [x] Group, sort and status filter on automations.
- [x] `pnpm test` and `pnpm typecheck` pass.
