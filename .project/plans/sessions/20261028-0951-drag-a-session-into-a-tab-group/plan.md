---
title: A session dragged from the list opens in a tab group
domain: sessions
status: planned
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
requires:
  - plans/sessions/20261028-0951-sidebar-follows-the-focused-session/plan.md
refs:
  - "[code://src/resources/folders/drag.ts](../../../../src/resources/folders/drag.ts) - `HOST_FILE_TYPE` and `setHostFile`: the pattern for an ahpw drag type"
  - "[code://src/shell/explorer/ExplorerList.tsx#L49](../../../../src/shell/explorer/ExplorerList.tsx#L49) - the session list's rows, with no drag today"
  - "[code://src/resources/sessions/index.ts#L235-L251](../../../../src/resources/sessions/index.ts#L235-L251) - `ahp.openSession` and the mount key"
  - npm://@softov/scena@^0.5.14 - `TabPanelLayout`: a group is `[data-leaf-id]`; its body takes only scena's own tab drag; the layout keeps the tree in `tabPanel.tree`
---

## Goal

A person drags a session from the session list and drops it on a tab group.
The session opens as a tab in that group.

## Reconnaissance

### Searches performed

- `rg "setData|draggable" src/shell/explorer src/resources/sessions` - the session list sets no drag data.
- `rg "onBodyDragOver" node_modules/@softov/scena/dist/ui/layout/TabPanelLayout.js` - the body calls `preventDefault` only for scena's own drag type, so another drag cannot drop there.

### Runtime path

```
row dragstart -> application/x-ahpw-session {host, resource}
group dragover (capture) -> preventDefault -> drop -> ahp.openSession -> move the key into the leaf of [data-leaf-id]
```

### Gaps

- `ExplorerList` takes no drag handler.
- scena does not offer a drop of an outside item on a group; ahpw handles it in the capture phase.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A session drags from the list to a tab group | Softov, 2026-10-28: "we could have a drag drop for session to open on tab group" | 01, 02 |
| ahpw handles the drop; scena does not change | `(defaulted: the group's leaf id is in the DOM and the tree is in the layout, so ahpw can move the tab)` | 02 |
| A drop on a session already open moves its tab to that group | `(defaulted: one tab per session, as the mount key is unique)` | 02 |

## Proposed architecture

- **Data flow** - the drag carries `{ host, resource }` under `application/x-ahpw-session`, beside `text/plain` with the resource.
- **Event flow** - a capture listener on the main surface takes `dragover` and `drop` for that type. The drop opens the session and moves its key into the target leaf.
- **State flow** - the main surface's `tabPanel.tree` and `activeContainerKey`, written through `scena.layout.setSurface`.
- **Layer responsibilities** - `src/shell/explorer/`: an optional drag on a row. `src/resources/sessions/`: the drag type and the drop.
- **Source-of-truth files** - [`code://src/resources/folders/drag.ts`](../../../../src/resources/folders/drag.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a session row drags](task-01-a-session-row-drags.md) | todo | - |
| [02 - a group takes the dropped session](task-02-a-group-takes-the-dropped-session.md) | todo | 01 |

## Risks and tradeoffs

- The drop handler writes scena's tab tree from outside scena. A scena change to the tree's shape breaks it; a test on the tree move keeps that visible.
- A split drop at a group's edge is not part of this plan; the drop goes into the group.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-session-row-drags.md](task-01-a-session-row-drags.md).
- **Open questions:** none.
- **Watch out for:** scena reconciles a tree key that has no mount away, so open the session before you move its key.

## Final verification checklist

- [ ] A session dragged on a second group opens there and becomes its active tab.
- [ ] A session already open moves to the group it is dropped on.
- [ ] A tab dragged between groups still works as before.
- [ ] `pnpm typecheck` and `pnpm test` pass.
