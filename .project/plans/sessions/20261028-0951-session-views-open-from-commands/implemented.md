---
title: Session Info, Changes and Files open from commands and keys - implemented
date: 2026-10-30
refs:
  - git://19769ec
  - "[code://src/shell/right-sidebar.ts](../../../../src/shell/right-sidebar.ts)"
  - "[code://src/resources/sessions/Files.tsx](../../../../src/resources/sessions/Files.tsx)"
  - "[code://src/shell/ui-settings/settings.ts](../../../../src/shell/ui-settings/settings.ts)"
---

Session Info, Changes and Files open from a palette command, also when the right sidebar or the tab is closed.
Changes has Ctrl+Shift+G and Files has Ctrl+Shift+E.
Files is a right sidebar tab with the focused session's folder.
The Session section of the Interface settings puts Session Info and Changes in the right sidebar or as tabs beside the session.

## What was built

- [`code://src/shell/right-sidebar.ts`](../../../../src/shell/right-sidebar.ts) - `showView`, the `ahp.view.<key>` command with its keys, and `besideSession`, which places a view beside the session.
- [`code://src/resources/folders/Explorer.tsx`](../../../../src/resources/folders/Explorer.tsx) - `HostFolders`, the tree that takes its roots.
- [`code://src/resources/sessions/Files.tsx`](../../../../src/resources/sessions/Files.tsx) - `SessionFiles`, the tree at the session's first working directory.
- [`code://src/shell/ui-settings/settings.ts`](../../../../src/shell/ui-settings/settings.ts) - `ui.sessionViewsPlace`, kept in localStorage as `ahpw.sessionViewsPlace`.
- [`code://src/resources/host/sections.ts`](../../../../src/resources/host/sections.ts) - the `session` section.

## Verified

- `right-sidebar.test.ts` covers a hidden sidebar, a closed tab, the key, `besideSession` and a move to `main` and back; `settings.test.ts` and `sections.test.ts` cover the key.
- `pnpm typecheck`, `pnpm test` and `pnpm build` pass on the merged branch, with 629 tests; CI on PR #19 passes.
- Checked by hand in Chromium at 1280 light and 760 dark: each key from a hidden sidebar, a closed tab and the composer.
- The move to `main`, the move back and a reload were also checked by hand.

## Departures from the plan

- The palette command is `ahp.view.<key>`, titled "Show <title>", in the View category.
- `src/shell/view/keys.ts` already called `preventDefault`, so a key needed no new code.

## Left for later

- The key check in Edge and Firefox - see [deferred.md](deferred.md).
