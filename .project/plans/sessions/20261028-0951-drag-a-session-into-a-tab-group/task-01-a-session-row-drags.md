---
title: A session row in the list can be dragged
status: todo
depends: []
layer: "sessions, shell explorer"
refs:
  - "[code://src/resources/folders/drag.ts](../../../../src/resources/folders/drag.ts) - the drag type pattern to copy"
  - "[code://src/shell/explorer/ExplorerList.tsx#L49](../../../../src/shell/explorer/ExplorerList.tsx#L49) - the list that draws the rows"
---

## Objective

A session row starts a drag that carries its host and resource.

## Files

- `CREATE: src/resources/sessions/drag.ts` - `SESSION_TYPE`, `setSession`, `carriesSession` and `droppedSession`, in the shape of `folders/drag.ts`.
- `CREATE: src/resources/sessions/drag.test.ts` - cases for `droppedSession`.
- `UPDATE: src/shell/explorer/ExplorerList.tsx` - an optional `onDragStart(event, row)` prop that makes a row draggable.
- `UPDATE: src/resources/sessions/Explorer.tsx` - pass `onDragStart`, which calls `setSession`.

## Steps

1. Copy the shape of `folders/drag.ts` into `sessions/drag.ts` with the type `application/x-ahpw-session`.
2. Set `text/plain` to the resource and `effectAllowed` to `copyMove`.
3. Add the optional `onDragStart` prop to `ExplorerList`.
4. Set `draggable` on a row only when the prop is given.
5. Pass the handler from the session list.

## Validation

- `drag.test.ts`: a good payload, a payload with a missing field, text that is not JSON.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: the other explorers still do not drag.

## Resume
