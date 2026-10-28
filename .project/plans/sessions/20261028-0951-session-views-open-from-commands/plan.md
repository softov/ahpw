---
title: Session Info, Changes and Files open from commands and keys
domain: sessions
status: planned
priority: high
created: 2026-10-28
revalidated: 2026-10-28
requires:
  - plans/sessions/20261028-0951-sidebar-follows-the-focused-session/plan.md
refs:
  - "[code://src/shell/right-sidebar.ts#L18-L47](../../../../src/shell/right-sidebar.ts#L18-L47) - `mountRight`: a closed tab returns only from the sidebar's own menu, which a hidden sidebar hides too"
  - "[code://src/resources/sessions/index.ts#L253-L254](../../../../src/resources/sessions/index.ts#L253-L254) - the Session Info tab"
  - "[code://src/resources/changes/index.ts#L14](../../../../src/resources/changes/index.ts#L14) - the Changes tab"
  - "[code://src/resources/folders/Explorer.tsx#L51](../../../../src/resources/folders/Explorer.tsx#L51) - `FolderExplorer`, whose tree the Files tab reuses"
  - "[code://src/resources/folders/roots.ts](../../../../src/resources/folders/roots.ts) - `rootsOf`, `chainTo`, `childUri`: the folder tree's helpers"
  - "[code://src/shell/layout-menu.ts#L33-L34](../../../../src/shell/layout-menu.ts#L33-L34) - the `keys` form ahpw already uses"
  - "[code://src/shell/ui-settings/settings.ts#L23-L35](../../../../src/shell/ui-settings/settings.ts#L23-L35) - `UiSetting`, the shape of a UI setting"
  - "[code://src/resources/host/sections.ts#L37-L42](../../../../src/resources/host/sections.ts#L37-L42) - the sections of the Interface tab"
---

## Goal

Session Info, Changes and Files open from a command and a key, also when the right sidebar or the tab is closed.
Files is a new right sidebar tab with the focused session's folder.
A UI setting puts Session Info and Changes in the right sidebar or as tabs beside the session.

## Reconnaissance

### Searches performed

- `rg "mountRight" src` - Session Info and Changes mount through it; its show command has no key and no palette entry.
- `rg "component: 'FolderExplorer'" src` - the folder tree lives in the left sidebar only.

### Runtime path

```
key or palette -> ahp.show<View> -> mount the tab if closed -> right sidebar visible, tab active
ui.sessionViewsPlace = tab -> the same command mounts on main, in a group beside the session
```

### Gaps

- No command opens a right sidebar tab while the sidebar is hidden.
- No view shows the focused session's folder.
- No Session section in the UI settings.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Commands: Session Info, Changes (Ctrl+Shift+G), Files (Ctrl+Shift+E) | Softov, 2026-10-28 | 02 |
| Files keeps Ctrl+Shift+E; the page takes the key before the browser | Softov, 2026-10-28: "no problem" | 02 |
| Files is a new right sidebar tab with the focused session's folder | Softov, 2026-10-28, question answer | 01 |
| A Session section in the UI settings: where to open session and changes info, Right sidebar or As a panel, default Right sidebar | Softov, 2026-10-28 | 03 |
| As a panel means a tab in the main area, in a group beside the session | Softov, 2026-10-28, question answer: "A tab beside the session" | 03 |
| The setting moves Session Info and Changes; Files stays in the right sidebar | `(defaulted: the setting names session and changes info only)` | 03 |
| Session Info has no key | `(defaulted: none was given)` | 02 |

## Proposed architecture

- **Data flow** - `ACTIVE_SESSION` gives the session; its first working directory roots the Files tree.
- **Event flow** - one `showView(scena, key)` mounts the tab where the setting says, shows that surface, and activates the tab. The command and the sidebar's "..." menu both call it.
- **State flow** - `ui.sessionViewsPlace`, kept as the other UI settings are.
- **Layer responsibilities** - `src/shell/right-sidebar.ts`: `showView` and its keys. `src/resources/folders/`: the tree as a component that takes a root. `src/resources/sessions/`: the Files tab.
- **Source-of-truth files** - [`code://src/shell/right-sidebar.ts`](../../../../src/shell/right-sidebar.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a files tab for the session](task-01-a-files-tab-for-the-session.md) | todo | - |
| [02 - commands open the session views](task-02-commands-open-the-session-views.md) | todo | 01 |
| [03 - a setting places the views](task-03-a-setting-places-the-views.md) | todo | 02 |

## Risks and tradeoffs

- Ctrl+Shift+E, Ctrl+Shift+G and Ctrl+Shift+B are browser keys too: Edge's search, find previous, the bookmarks bar. Some browsers keep a key; the check in task 02 finds out.
- Splitting the main area from code needs the tab tree; plan `drag-a-session-into-a-tab-group` writes `moveToLeaf` for the same tree.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-files-tab-for-the-session.md](task-01-a-files-tab-for-the-session.md).
- **Open questions:** none.
- **Watch out for:** a closed tab is offered in the sidebar's "..." menu; keep that path on `showView`.

## Final verification checklist

- [ ] With the right sidebar hidden, each command shows it with its tab active.
- [ ] With a tab closed, its command mounts it again.
- [ ] Files shows the focused session's folder and follows the focus.
- [ ] With the setting on As a panel, Session Info and Changes open beside the session.
- [ ] Each key works in Edge, Chrome and Firefox, or Softov picked another.
- [ ] Checked at 1280 and 760 wide; `pnpm typecheck` and `pnpm test` pass.
