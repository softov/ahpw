---
title: Sessions group by two keys, day and week among them
status: done
depends: []
layer: "src/resources/sessions, src/shell/explorer"
refs:
  - "[code://src/resources/sessions/grouping.ts](../../../../../src/resources/sessions/grouping.ts) - the keys and `arrange`"
  - "[code://src/shell/explorer/ExplorerList.tsx](../../../../../src/shell/explorer/ExplorerList.tsx) - the headings"
---

## Objective

The group menu has a Group by section and a Then by section.
The keys are host, folder, agent, status, day and week; day is Today, Yesterday, a weekday within the week, then Older.

## Files

- `UPDATE: src/resources/sessions/grouping.ts` - `Grouping` gains `day` and `week`; `groupOf` takes the session's `modifiedAt`; `arrange` takes two keys and nests the second.
- `CREATE: src/resources/sessions/days.ts` - `dayOf(date, now)` and `weekOf(date, now)`, pure, with their labels.
- `UPDATE: src/resources/sessions/state.ts` - `SESSIONS_THEN_BY`, the second key.
- `UPDATE: src/resources/sessions/index.ts:96-107` - `sessions.groupBy.<g>` in category Group by, and `sessions.thenBy.<g>` in category Then by, with None.
- `UPDATE: src/shell/explorer/ExplorerList.tsx` - `Row.subgroup`, a second heading level, indented, folding on its own.
- `UPDATE: src/resources/sessions/Explorer.tsx:96-128` - the rows carry both levels.
- `UPDATE: src/i18n` - the new keys and day words, in every locale.

## Steps

1. Write `days.ts` and its test.
2. Extend `groupOf` and `arrange` to two keys, with tests.
3. Add the Then by section and its stored key.
4. Draw the second heading level in `ExplorerList`.

## Validation

- `src/resources/sessions/days.test.ts`: today, yesterday, a weekday, older; the week's start.
- `src/resources/sessions/grouping.test.ts`: two keys nest, and the second key's groups keep the first's order.
- `pnpm test` and `pnpm typecheck` pass.

## Resume

- Done 2026-10-16: `Grouping` has `day` and `week`, from `src/resources/sessions/days.ts`; a `Group` may carry a `rank`, which `arrange` keeps.
- `arrangeTwo` nests the second key: arranged by it first, then, keeping that order, by the first key.
- The group menu has Group by and Then by sections; Then by shows while the list is grouped, and never the first key.
- `ExplorerList` draws `Row.subgroup` as an indented heading that folds on its own.
- The grouping words are short now, Folder or Day, since the section heading says Group by.
- Verified: `days.test.ts` and `grouping.test.ts`; seen in a browser, status then day.
