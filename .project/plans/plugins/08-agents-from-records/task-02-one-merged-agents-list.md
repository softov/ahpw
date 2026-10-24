---
title: One merged agents list
status: todo
depends: [task-01-an-agents-bridge.md]
layer: "resources/agents"
refs:
  - "[code://src/resources/agents/Explorer.tsx](../../../../src/resources/agents/Explorer.tsx) - the explorer to change"
  - "[code://src/shell/explorer/ExplorerList.tsx#L14-L34](../../../../src/shell/explorer/ExplorerList.tsx#L14-L34) - `Row.icons`"
---

## Objective

The explorer lists every agent of the root list and every record on the agents channel once, with its icon and its status.

## Files

- `CREATE: src/resources/agents/merge.ts` - `mergeAgents(infos, records)`, one entry per id, with its status.
- `CREATE: src/resources/agents/merge.test.ts` - the merge tests.
- `UPDATE: src/resources/agents/Explorer.tsx` - rows from the merge, with the record's icon and a status line.
- `UPDATE: src/i18n/` - the status words and the standby reasons in en, es and pt.

## Steps

1. Merge by `provider` = record `id`.
2. Mark an entry in both lists `configured`, and one in the root list only `standalone`.
3. Mark a record of another owner `configured`, and put its owner in its line.
4. Mark any other record `standby`, with `invalid` or `unavailable` as its reason.
5. Give a row the record's `icon` through `Row.icons`, and the default agent icon when it has none.
6. Start the first line with the status word, then the models and sessions as today.
7. Use the dot for the status: configured ok, standalone neutral, standby attention, unavailable failed.
8. Read the agents channel only on a host that offers it.

## Validation

- `src/resources/agents/merge.test.ts` tests the three statuses, another owner's record, and a host with no agents channel.
- `npx tsc -b` and `npx vitest run` pass.

## Resume

