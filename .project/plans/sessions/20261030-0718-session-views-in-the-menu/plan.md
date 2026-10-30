---
title: The session's views open from its "..." menu
domain: sessions
status: active
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
requires:
  - plans/sessions/20261028-0951-session-views-open-from-commands/plan.md
refs:
  - "[code://src/resources/sessions/SessionHeader.tsx](../../../../src/resources/sessions/SessionHeader.tsx) - the session header's \"...\" menu"
  - "[code://src/shell/right-sidebar.ts](../../../../src/shell/right-sidebar.ts) - `mountRight`, which holds each view and registers `ahp.view.<key>`"
  - "[code://src/resources/terminals/index.ts](../../../../src/resources/terminals/index.ts) - `ahp.newTerminal`, which takes `host` and `cwd`"
  - https://github.com/microsoft/vscode/tree/171e90619c7/src/vs/sessions - VS Code's sessions window, which draws the views in a bar
---

## Goal

The "..." menu in a session's header lists the views that show the session: Session Info, Changes and Files.
A view that a later plan mounts, such as Browser, joins the list.
It also opens a new terminal in the session's folder.
VS Code draws the same actions in a small bar on the focused session; ahpw puts them in the menu it already has.

## Reconnaissance

### Searches performed

- `rg "mountRight\(scena" src` - Session Info, Changes and Files mount through it; Browser does too on its own branch.
- `rg "viewMenu" src` - the menu holds the bot, Raw and Hide calls.

### Runtime path

```
... -> Views: viewEntries() -> ahp.view.<key> -> showView
    -> New terminal -> ahp.newTerminal { host, cwd }
```

### Gaps

- A view opens only from the palette, a key or the right sidebar's own menu.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The views go in the session's "..." menu, not a floating bar | Softov, 2026-10-30, question answer: "In the '...' menu" | 01 |
| The menu lists every view `mountRight` holds, so a later view joins without a change here | `(defaulted: VS Code's bar lists registered actions)` | 01 |
| New terminal shows only when the session has a folder | `(defaulted: the item opens a terminal in the session's folder)` | 01 |
| The menu has two groups: Views, and How the chat reads | `(defaulted: the old items read the chat, the new ones open views)` | 01 |

## Proposed architecture

- **Data flow** - `viewEntries(scena)` gives each view's key, title and icon.
- **Event flow** - a menu item runs `ahp.view.<key>`; a click in the page has made the session the focused one, so the view shows it.
- **State flow** - none new.
- **Layer responsibilities** - `src/shell/`: the list of views. `src/resources/sessions/`: the menu.
- **Source-of-truth files** - [`code://src/shell/right-sidebar.ts`](../../../../src/shell/right-sidebar.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the menu lists the session views](task-01-the-menu-lists-the-session-views.md) | implemented | - |

## Risks and tradeoffs

- The views stay one click away, where VS Code shows them at once.

## Resume state

- **Done so far:** task 01 is implemented, on branch `sessions/20261030-0718-session-views-in-the-menu`, on main, not committed.
- **Next action:** Softov reviews.
- **Open questions:** none.
- **Watch out for:** Browser shows in the menu only after its branch merges.

## Final verification checklist

- [x] The menu lists Session, Changes, Files and New terminal, then Raw and Hide calls.
- [x] Session and Changes open their tabs from the menu.
- [x] Checked at 1280 light and 420 dark; `pnpm typecheck` and `pnpm test` pass.
