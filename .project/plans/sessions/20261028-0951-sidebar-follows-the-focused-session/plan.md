---
title: The right sidebar follows the focused session
domain: sessions
status: planned
priority: high
created: 2026-10-28
revalidated: 2026-10-28
refs:
  - "[code://src/resources/sessions/state.ts#L4](../../../../src/resources/sessions/state.ts#L4) - `ACTIVE_SESSION`, the session that Session Info and Changes show"
  - "[code://src/resources/sessions/index.ts#L235-L251](../../../../src/resources/sessions/index.ts#L235-L251) - `ahp.openSession`, the only writer today, and the mount key `session:<host>:<resource>`"
  - "[code://src/resources/sessions/Page.tsx#L210-L212](../../../../src/resources/sessions/Page.tsx#L210-L212) - a page writes the active session once, only while it is empty"
  - "[code://src/resources/sessions/Details.tsx#L32](../../../../src/resources/sessions/Details.tsx#L32) - Session Info reads `ACTIVE_SESSION`"
  - "[code://src/resources/changes/Explorer.tsx#L47](../../../../src/resources/changes/Explorer.tsx#L47) - Changes reads `ACTIVE_SESSION`"
  - npm://@softov/scena@^0.5.14 - `layout.subscribe`, `SurfaceLayoutState.activeContainerKey`, `TabPanelLeaf.activeKey`; a tab click calls `onActivate` (`ui/layout/TabPanelLayout.js`)
---

## Goal

Session Info and Changes show the session that has the focus.
With two sessions open in tab groups, a click on one of them changes the right sidebar to it.
A click on its tab or inside its page counts.

## Reconnaissance

### Searches performed

- `rg "ACTIVE_SESSION" src` - written by `ahp.openSession` and by `SessionPage` on mount; read by Details, Changes, the session list and alerts.
- `rg "onActivate|activeContainerKey" node_modules/@softov/scena/dist/ui/layout/TabPanelLayout.js` - a tab click and a tab drop activate the tab; a click in a group's body does nothing.

### Runtime path

```
tab click -> scena setLeafActive -> onActivate -> main activeContainerKey -> (nothing in ahpw)
list click -> ahp.openSession -> ACTIVE_SESSION -> Details, Changes
```

### Gaps

- ahpw does not read the main surface's `activeContainerKey` back.
- A click inside a session page does not make its tab active.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Selecting a session in a tab group changes the right sidebar | Softov, 2026-10-28: "if two are open on group.. selecting one does not change the right sidebar info" | 01 |
| A click inside a session page also gives it the focus | Softov, 2026-10-28: "click inside also should make it focus" | 02 |
| ahpw follows scena's layout; scena does not change | `(defaulted: layout.subscribe and activeContainerKey already carry the focused tab)` | 01 |

## Proposed architecture

- **Data flow** - the main surface's `activeContainerKey` names the focused tab. A key `session:<host>:<resource>` gives the active session.
- **Event flow** - `layout.subscribe` -> parse the key -> `store.set(ACTIVE_SESSION)` when it differs. A pointer down in `SessionPage` -> activate its own tab in the main surface.
- **State flow** - `ACTIVE_SESSION` stays the one source for Details and Changes.
- **Layer responsibilities** - `src/resources/sessions/`: the subscription and the page's pointer handler.
- **Source-of-truth files** - [`code://src/resources/sessions/state.ts`](../../../../src/resources/sessions/state.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the focused tab sets the session](task-01-the-focused-tab-sets-the-session.md) | todo | - |
| [02 - a click in the page focuses it](task-02-a-click-in-the-page-focuses-it.md) | todo | 01 |

## Risks and tradeoffs

- A focused tab that is not a session, such as a file, keeps the last session in the sidebar. That is the behaviour of VS Code's session view.
- The key parse must take a resource that holds `:`; split at the first two colons only.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-focused-tab-sets-the-session.md](task-01-the-focused-tab-sets-the-session.md).
- **Open questions:** none.
- **Watch out for:** the host id can hold no `:`, but the resource is a URI and does.

## Final verification checklist

- [ ] Two sessions in two tab groups: a click on either tab changes Session Info and Changes.
- [ ] A click inside either page changes them too.
- [ ] Checked at 1280 and 760 wide.
- [ ] `pnpm typecheck` and `pnpm test` pass.
