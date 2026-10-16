---
title: Usage
domain: organization
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugins/01-computers-and-bots/plan.md
refs:
  - "[code://src/bridges/served.ts](../../../../../src/bridges/served.ts) - `trackServed` gates on a channel; usage needs a gate on a method"
  - file:///github/ahpd/packages/sdk/src/usage.ts - `usageMethods`: `pools`, `totals {pool}`, `range {pool, from, until}`, `records {pool, from, until}`, `groups {by, from, until}`
  - file:///github/ahpd/packages/sdk/src/types/usage.ts - `UsageTotal`, `ModelUse`, `ComputerTime`, `Cost`
  - file:///github/ahpapp/src/usage.ts - the commands with the `usage://` fallback
  - file:///github/ahpapp/app/(tabs)/usage.tsx - the pools list, the period choice and the grouping
  - file:///github/ahpapp/src/components/UsagePool.tsx - one pool's periods and records
---

## Goal

A 📊 section lists the usage pools of every shown host that the person may read, each with its total for the chosen period: today, this week, this month, or a range.
The list can instead be grouped by user, team or project.
A pool opens in a page with its day, week and month, a range, and its records, each opening its session.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.
Usage has no channel: a list and a page ask when they show, and the reload button asks again.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p3.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the usage bridge](task-01-the-usage-bridge.md) | done | - |
| [02 - the usage section and pool page](task-02-the-usage-section-and-pool-page.md) | done | 01 |

## Risks and tradeoffs

- With no channel, a list goes stale while it shows - the header's reload asks again, and the list asks when the period or grouping changes.
- A pool's cost may be missing when the model had no price - the total shows tokens and calls, and no cost.

## Resume state

- **Done so far:** tasks 01 and 02, 2026-10-16.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** `usd` is the harness's cost and `providerUsd` the provider's; show `usd`, as ahpapp does.

## Final verification checklist

- [ ] The pools list with their totals for each period and a range, and grouped by user, team and project, mono and multi.
- [ ] A pool's page shows its periods and records, and a record opens its session.
- [ ] A host without usage shows no 📊 entry.
- [ ] `pnpm test` and `pnpm typecheck` pass.
