---
title: The usage section and pool page
status: done
depends: [task-01-the-usage-bridge.md]
layer: "src/resources/usage, src/shell"
refs:
  - "[code://src/resources/computers/index.ts](../../../../../src/resources/computers/index.ts) - registration, `registerChoice`, the sidebar mount"
  - file:///github/ahpapp/app/(tabs)/usage.tsx - the period choice, the range and the grouping
  - file:///github/ahpapp/src/components/UsagePool.tsx - a pool's periods and records
---

## Objective

A 📊 entry in the activity bar, shown while a shown host serves usage, opens the pools list.
The header chooses the period (today, this week, this month, range) and the grouping (none, user, team, project).
A pool's page shows its day, week and month, a range with from and until, and its records, newest first, each opening its session.

## Files

- `CREATE: src/resources/usage/state.ts` - `USAGE_SERVED`, `USAGE_PERIOD`, `USAGE_GROUP`, `USAGE_RANGE`.
- `CREATE: src/resources/usage/index.ts` - `registerUsage(scena)`: `trackServed(scena, servesUsage, USAGE_SERVED)`, `registerChoice` for the period and the grouping, the `UsageExplorer` and `UsagePoolPage` components, `usage.reload`, `ahp.showUsage`, `ahp.openUsagePool`, and the `sidebar:left` mount for `ahp:usage`.
- `CREATE: src/resources/usage/Explorer.tsx` - the pools, or the groups, of every shown host serving usage, each with its total.
- `CREATE: src/resources/usage/PoolPage.tsx` - the periods, the range and the records.
- `UPDATE: src/shell/register-shell.tsx` - the `usage:nav` mount after `teams:nav`, `when: USAGE_SERVED == true`; `registerUsage(scena)`.
- `UPDATE: src/resources/emojis.ts` - `usage: mono('📊')`.
- `UPDATE: src/i18n/{en,es,pt}.json` - `usage/*`, `shell/nav/usage`.

## Steps

1. The list asks when it shows, when the period, range or grouping changes, and on reload.
2. A record row shows when, the model or computer, tokens or seconds, and cost; it opens its session with `ahp.openSession` when it names one.
3. A host that refuses a pool shows the host's error in that host's group, and the rest still list.

## Validation

- By hand: with a host that has usage, the pools list for each period and a range, the grouping changes the list, a pool's page shows its records, and one opens its session.
- A host without usage shows no 📊 entry.

## Resume
