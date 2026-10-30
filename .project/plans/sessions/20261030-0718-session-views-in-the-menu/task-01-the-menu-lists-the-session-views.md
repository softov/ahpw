---
title: The menu lists the session views
status: implemented
depends: []
layer: "sessions, shell"
refs:
  - "[code://src/shell/right-sidebar.ts](../../../../src/shell/right-sidebar.ts) - the views map"
---

## Objective

The session header's "..." menu has a Views group with each view and New terminal, over a group with the bot, Raw and Hide calls.

## Files

- `UPDATE: src/shell/right-sidebar.ts` - `viewEntries(scena)`; a view keeps its icon.
- `UPDATE: src/shell/right-sidebar.test.ts` - a case for `viewEntries`.
- `UPDATE: src/resources/sessions/SessionHeader.tsx` - the Views group and New terminal; the other items in How the chat reads.
- `UPDATE: src/i18n/en.json` - `sessions.header.views`, `newTerminal`, `reads`; the button's title names both groups.
- `UPDATE: src/i18n/es.json` - the same keys in Spanish.
- `UPDATE: src/i18n/pt.json` - the same keys in Portuguese.

## Steps

1. Keep the icon on each view that `mountRight` holds.
2. Write `viewEntries`, which resolves each view's title.
3. Put the views first in the menu, each running `ahp.view.<key>`.
4. Add New terminal with the session's host and folder, only when the session has a folder.
5. Put the bot, Raw and Hide calls in the How the chat reads group.

## Validation

- `src/shell/right-sidebar.test.ts` - `viewEntries` lists the views in order with title and icon, and drops a disposed one.
- `pnpm typecheck` and `pnpm test` pass.
- By hand at 1280 light and 420 dark, check that the menu shows both groups.
- By hand, check that Session and Changes open their tabs.

## Resume

Built and checked against the host on 37537.
New terminal was not clicked, because it starts a terminal on the host.
