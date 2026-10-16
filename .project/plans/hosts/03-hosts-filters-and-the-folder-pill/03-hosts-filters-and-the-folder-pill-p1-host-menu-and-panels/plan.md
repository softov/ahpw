---
title: The host menu and the panels
domain: hosts
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/hosts/03-hosts-filters-and-the-folder-pill/plan.md
refs:
  - "[code://src/bridges/hosts.ts#L190-240](../../../../../src/bridges/hosts.ts#L190-240) - `registerHosts`, which registers each host's pages into `HOST_SLOT`"
  - "[code://src/shell/embed/HostSwitcher.tsx](../../../../../src/shell/embed/HostSwitcher.tsx) - the title bar's host menu, its rows and its Manage and Add rows"
  - "[code://src/resources/sessions/Details.tsx#L47-87](../../../../../src/resources/sessions/Details.tsx#L47-87) - the session panel's facts"
  - "[code://src/resources/automations/Page.tsx#L44-67](../../../../../src/resources/automations/Page.tsx#L44-67) - `factsOf`, the automation's facts"
  - "[code://src/resources/agents/Page.tsx#L32-44](../../../../../src/resources/agents/Page.tsx#L32-44) - the agent page's head and facts"
---

## Goal

The host filter lists only the hosts.
Each host's Info, Settings, Sign in or Retry, and manage open from an options button on its row in the title bar's host menu.
The session, automation and agent panels name their host.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p1.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a host's options open from its row in the host menu](task-01-host-options-in-the-host-menu.md) | done | - |
| [02 - the session, automation and agent panels name their host](task-02-the-panels-name-their-host.md) | done | - |

## Risks and tradeoffs

- None past the parent's.

## Resume state

- **Done so far:** tasks 01 and 02, 2026-10-16; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** mono must look and work as it does now.

## Final verification checklist

- [ ] The filter lists only the hosts, and each host's options open from the host menu.
- [ ] The three panels name their host.
- [ ] `pnpm test` and `pnpm typecheck` pass.
