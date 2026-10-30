---
title: A UI setting places Session Info and Changes
status: done
depends: [task-02-commands-open-the-session-views.md]
layer: "shell ui-settings, host settings"
refs:
  - "[code://src/shell/ui-settings/settings.ts#L23-L35](../../../../src/shell/ui-settings/settings.ts#L23-L35) - the setting shape"
  - "[code://src/resources/host/sections.ts#L37-L42](../../../../src/resources/host/sections.ts#L37-L42) - where the Session section goes"
---

## Objective

The Interface settings have a Session section.
Its first setting puts Session Info and Changes in the right sidebar, or as tabs beside the session.

## Files

- `UPDATE: src/shell/ui-settings/settings.ts` - `ui.sessionViewsPlace` with the values `sidebar` and `tab`, default `sidebar`.
- `UPDATE: src/resources/host/sections.ts:37-42` - a `session` section with `ui.sessionViewsPlace`.
- `UPDATE: src/shell/right-sidebar.ts` - `showView` mounts on `main` when the setting is `tab`, and moves an open tab when the setting changes.
- `UPDATE: src/i18n/en.json` - the section, the setting and its two values; the same keys in `es.json` and `pt.json`.

## Steps

1. Add `ui.sessionViewsPlace` in the shape of `ui.confirmStyle`.
2. Label the values "Right sidebar" and "As a panel".
3. Add the `session` section after `dialogs`.
4. In `showView`, read the setting for Session Info and Changes.
5. For `tab`, open the view on `main` in a group beside the focused session.
6. Make a new group to the right when the session's group is the only one.
7. Move the open views when the setting changes.

## Validation

- `settings.test.ts`: the new key, its values and its default.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: switch the setting with Session Info open, and see it move.
- By hand: Files stays in the right sidebar with either value.

## Resume

- `ui.sessionViewsPlace` is kept in localStorage under `ahpw.sessionViewsPlace`, so each browser has its own value.
- `mountRight` takes `placed: SESSION_VIEWS` for Session Info and Changes; Files has no flag and stays in the right sidebar.
- `besideSession` in `src/shell/right-sidebar.ts` puts the view in the first group without the session, or splits the session's group to the right.
- In the plain `tab` layout, with no groups, the view opens as a main tab.
- A view closed in `main` comes back in the sidebar when the setting returns to `sidebar`.
- In `tab` place the main panel's kept tabs reopen the views after a reload.
- `right-sidebar.test.ts` covers `besideSession` and a move to `main` and back; `settings.test.ts` and `sections.test.ts` cover the key.
- Checked by hand in Chromium at 1280 light and 760 dark: the move, the move back, Files, Ctrl+Shift+G, the × and a reload.
