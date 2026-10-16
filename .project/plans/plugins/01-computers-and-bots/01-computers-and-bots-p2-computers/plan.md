---
title: Computers
domain: plugins
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugins/01-computers-and-bots/01-computers-and-bots-p1-offers-and-bood/plan.md
refs:
  - "[code://src/resources/automations/index.ts](../../../../../src/resources/automations/index.ts) - the resource registration and `registerChoice`"
  - "[code://src/resources/automations/Explorer.tsx](../../../../../src/resources/automations/Explorer.tsx) - a list over every shown host"
  - "[code://src/resources/automations/Page.tsx](../../../../../src/resources/automations/Page.tsx) - a page with facts and `HostTag`"
  - "[code://src/resources/host/Settings.tsx#L40](../../../../../src/resources/host/Settings.tsx#L40) - `SchemaForm` from a host-given schema"
  - file:///github/ahpapp/src/computers.ts - the calls, the fallback, `machineFacts`, `machineUsage`, `machineStanding`
  - file:///github/ahpapp/src/components/ComputerDetail.tsx - the panel's sections
  - file:///github/ahpd/packages/computer/src/provider.ts - the leaves and methods
---

## Goal

A host's computers list in the side bar and open in a page with their state and use.
ahpw makes, starts, stops, restarts and removes them.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p2.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the computers list](task-01-the-computers-list.md) | done | - |
| [02 - a computer's page](task-02-a-computers-page.md) | done | 01 |
| [03 - the create form](task-03-the-create-form.md) | done | 01 |

## Risks and tradeoffs

- `status` is the runtime's raw record, docker inspect or ssh's own - the page reads docker's fields and shows the rest as JSON.

## Resume state

- **Done so far:** all three tasks, 2026-10-16; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** machine ids may hold a dot (`ssh-ish.dev02`); never split them.

## Final verification checklist

- [x] Computers list, group and filter, mono and multi.
- [x] A computer's page shows its state and use, and its actions work.
- [x] The form makes a computer from the host's manifest.
- [x] `pnpm test` and `pnpm typecheck` pass.
