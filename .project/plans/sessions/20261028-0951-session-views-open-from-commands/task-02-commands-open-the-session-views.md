---
title: Commands with keys open Session Info, Changes and Files
status: implemented
depends: [task-01-a-files-tab-for-the-session.md]
layer: "shell, sessions, changes"
refs:
  - "[code://src/shell/right-sidebar.ts#L18-L47](../../../../src/shell/right-sidebar.ts#L18-L47) - the show command to widen"
  - "[code://src/shell/layout-menu.ts#L33-L34](../../../../src/shell/layout-menu.ts#L33-L34) - the `keys` form"
---

## Objective

Session Info, Changes (Ctrl+Shift+G) and Files (Ctrl+Shift+E) each have a palette command that shows its tab, from any state.

## Files

- `UPDATE: src/shell/right-sidebar.ts:18-47` - extract `showView`; `mountRight` takes an optional `keys` and a palette title for its show command.
- `UPDATE: src/resources/sessions/index.ts` - Session Info and Files pass their palette titles; Files passes `ctrl+shift+e`.
- `UPDATE: src/resources/changes/index.ts:14` - Changes passes `ctrl+shift+g`.
- `UPDATE: src/i18n/en.json` - the command titles; the same keys in `es.json` and `pt.json`.

## Steps

1. Extract the show command's `run` into `showView(scena, key)`.
2. Make `showView` mount the tab when it is closed, show the surface, and activate the tab.
3. Register the show command in the palette with its title and optional keys.
4. Keep the sidebar's "..." entry, which shows only while the tab is closed.
5. Let a key call `preventDefault`, so the browser does not act on it.
6. Pass the keys and titles from the three views.

## Validation

- `pnpm typecheck` and `pnpm test` pass.
- By hand: hide the right sidebar, press each key, and see the tab.
- By hand: close a tab with its ×, press its key, and see it again.
- By hand: in Edge, Chrome and Firefox, each key opens its view and not the browser's action.
- Ask Softov for another key when a browser keeps one.

## Resume

- `showView(scena, key)` in `src/shell/right-sidebar.ts` mounts a closed tab again, shows the sidebar and activates the tab; the "..." entry and the palette command both call it.
- The palette command is `ahp.view.<key>` in the View category; its title is "Show <title>", and Session Info passes "Show Session Info".
- `src/shell/view/keys.ts` already calls `preventDefault` when a key fires a command, so step 5 needed no new code.
- `src/shell/right-sidebar.test.ts` covers a hidden sidebar, a closed tab and the key binding.
- Checked by hand in Chromium at 1280 light and 760 dark.
- Each key shows its tab from a hidden sidebar, from a closed tab and from the composer.
- Open: the key check in Edge and Firefox, which needs Softov's browsers.
