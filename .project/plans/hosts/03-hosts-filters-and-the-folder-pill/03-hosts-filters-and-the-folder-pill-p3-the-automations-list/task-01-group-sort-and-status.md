---
title: Automations group, sort and filter by status
status: done
depends: []
layer: "src/resources/automations"
refs:
  - "[code://src/resources/automations/Explorer.tsx](../../../../../src/resources/automations/Explorer.tsx) - the rows"
  - "[code://src/resources/sessions/index.ts#L88-107](../../../../../src/resources/sessions/index.ts#L88-107) - the group menu's pattern"
---

## Objective

Group by none, host, status or next run, where next run is Now, Overdue, Today, Tomorrow, a weekday, Later or Not scheduled.
Sort by next run, name or last run, and filter by all, running, on, off or failed.

## Files

- `CREATE: src/resources/automations/arrange.ts` - `AutoGroup`, `AutoSort`, `AutoFilter`, `nextDayOf`, `sortAutomations`, `filterAutomations`, `groupOf`.
- `UPDATE: src/resources/automations/state.ts` - the three choices, with storage.
- `UPDATE: src/resources/automations/index.ts:38-43` - group, sort and status header actions with their menus and commands.
- `UPDATE: src/resources/automations/Explorer.tsx:48` - filter, sort and group the rows.
- `UPDATE: src/i18n` - the words, in every locale.

## Steps

1. Write `arrange.ts` and its test.
2. Register the three buttons and their commands.
3. Arrange the rows in the explorer.

## Validation

- `src/resources/automations/arrange.test.ts`: each group, sort and filter; the next-run days.
- `pnpm test` and `pnpm typecheck` pass.
- By hand: the three buttons change the list, and the choice stays across a reload.

## Resume

- Done 2026-10-16: `src/resources/automations/arrange.ts` groups by none, host, status or next run, sorts by name, next run or last run, and filters by state.
- The header has Status, Group and Sort buttons, each pressed while its choice is not the usual one; each is one `registerChoice`.
- The usual order stays by name, as before, so nothing moves until a person chooses.
- The status choice is named `status`, since `automations/explorer/filter` already names the text filter.
- Verified: `arrange.test.ts`; the suite, 64 files and 361 tests, and `pnpm typecheck` pass; seen in a browser.
