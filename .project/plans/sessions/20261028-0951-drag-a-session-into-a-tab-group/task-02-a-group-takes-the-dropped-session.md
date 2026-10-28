---
title: A tab group takes a dropped session as its active tab
status: todo
depends: [task-01-a-session-row-drags.md]
layer: "sessions"
refs:
  - "[code://src/resources/sessions/index.ts#L235-L251](../../../../src/resources/sessions/index.ts#L235-L251) - `ahp.openSession`, which mounts the tab"
---

## Objective

A session dropped on a tab group opens in that group as its active tab.

## Files

- `CREATE: src/resources/sessions/drop.ts` - `moveToLeaf(tree, key, leafId)`, a pure tree move, and `takeSessionDrops(scena)`, the capture listeners.
- `CREATE: src/resources/sessions/drop.test.ts` - cases for `moveToLeaf`.
- `UPDATE: src/resources/sessions/index.ts` - register `takeSessionDrops`.

## Steps

1. Write `moveToLeaf`, which removes the key from every leaf and adds it to the target leaf as `activeKey`.
2. Remove a leaf that the move leaves empty.
3. Add capture `dragover` and `drop` listeners on the document for `SESSION_TYPE` only.
4. Find the target with `closest('[data-leaf-id]')` and read its leaf id.
5. Call `preventDefault` on `dragover` over a group, and set `dropEffect` to `copy`.
6. On `drop`, run `ahp.openSession` with the dropped host and resource.
7. Write the moved tree and `activeContainerKey` with `scena.layout.setSurface`.

## Validation

- `drop.test.ts`: a key from another leaf, a new key, an emptied leaf, an unknown leaf id.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: drop on each of two groups, and drop a session that is already open.
- By hand: a scena tab drag between groups still works.

## Resume
