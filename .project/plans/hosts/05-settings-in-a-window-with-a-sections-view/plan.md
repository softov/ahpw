---
title: Settings in a window, with a sections view beside the fields and the JSON
domain: hosts
status: built
priority: medium
created: 2026-10-19
revalidated: 2026-10-19
decisions:
  - decisions/schemaform-views-are-a-list-the-form-takes.md
  - decisions/the-sections-view-lives-in-scena-and-the-app-names-the-sections.md
  - decisions/a-forms-field-actions-are-scenas-and-opt-in.md
  - decisions/settings-open-on-the-surface-a-person-chose.md
  - decisions/a-key-taken-out-of-the-settings-is-sent-as-null.md
refs:
  - "[code://src/resources/host/Settings.tsx](../../../../src/resources/host/Settings.tsx) - the settings page: one `SchemaForm` over the root config, Save and Reset"
  - "[code://src/resources/host/config.ts](../../../../src/resources/host/config.ts) - `changedKeys`, what Save sends"
  - "[code://src/resources/host/index.ts#L56-L68](../../../../src/resources/host/index.ts#L56-L68) - `ahp.openSettings`, a tab in `main`"
  - "[code://src/shell/manage.ts#L52-L61](../../../../src/shell/manage.ts#L52-L61) - the Manage gear's Settings entry"
  - "[code://src/shell/CommandPalette.tsx](../../../../src/shell/CommandPalette.tsx) - the pattern for a mount on `overlay` that places itself"
  - "[code://src/shell/panel/index.ts](../../../../src/shell/panel/index.ts) - `openInPanel`, the pattern for a tab in `panel:bottom`"
  - "[code://src/shell/right-sidebar.ts](../../../../src/shell/right-sidebar.ts) - `RIGHT_SIDEBAR`"
  - "[code://src/lib/storage-keys.ts](../../../../src/lib/storage-keys.ts) - per-browser and per-host storage keys"
  - "[code://vite.config.ts#L10-L36](../../../../vite.config.ts#L10-L36) - `AHPW_SCENA`, to run on a scena checkout before it is released"
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/forms/SchemaForm.tsx - the form whose two modes become a list of views
  - https://github.com/softov/scena/blob/main/packages/scena/test/ui/SchemaForm.test.tsx - the JSON behaviour the views must keep
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/overlay/Popup.tsx - the anchored popup for the field menu
  - https://github.com/softov/ahpd/blob/main/packages/server/src/rootconfig.ts - the daemon's keys, the plugin keys, `null` takes a key back
  - https://github.com/softov/ahpd/blob/main/packages/sdk/src/host/root.ts - the host's own keys and `_meta["ahpd.restartNeeded"]`
---

## Goal

The host settings get a third view, *Sections*, beside today's long form and JSON text.
It shows the settings as a tree of groups and sections with a search, so a person finds a setting without reading every key.
Hovering a setting shows its key, and a gear offers reset, copy and a jump to the JSON.
The settings open in a floating window over the page, or, as the person chooses, in a tab of the main area, the right sidebar or the bottom panel.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "surface: 'overlay'" src` - the palette, the toaster, the confirm dialog, the bot layer and the folder dialogs mount there.
- `rg "SchemaForm" src` - one use, the settings page.
- `rg "mode" SchemaForm.tsx` in scena - `'fields' | 'json'` at line 140, and the modebar at 283-295.
- `rg "PickerAction" scena/src/sdk` - `ContextMenu` needs `useScena`; `SchemaForm`'s tests render without a scena root.
- `rg "localStorage" src` - per-browser keys sit beside their reader (`i18n/messages.ts`, `bridges/hosts.ts`).

### Runtime path

```
Manage gear -> ahp.manage.settings -> ahp.openSettings -> scena.surfaces.open(main, HostSettingsPage)
  -> Settings.tsx: useChannel(ROOT) -> config.schema, config.values
  -> SchemaForm (fields | json) -> Save -> changedKeys -> root/configChanged
```

### Gaps

- `SchemaForm` has two hard-wired modes and no way to add a view.
- No field shows its key, and nothing resets one field.
- `changedKeys` never sends a key the person took out.
- Settings open only in `main`.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [SchemaForm draws its value through a list of views it is given](../../../decisions/schemaform-views-are-a-list-the-form-takes.md) | Softov, 2026-10-19 |
| 2 | [The sections view lives in scena, and the app names the sections](../../../decisions/the-sections-view-lives-in-scena-and-the-app-names-the-sections.md) | Softov, 2026-10-19 |
| 3 | [A form's field actions are scena's, and a form asks for them](../../../decisions/a-forms-field-actions-are-scenas-and-opt-in.md) | Softov, 2026-10-19 |
| 4 | [Settings open on the surface a person chose, a floating window first](../../../decisions/settings-open-on-the-surface-a-person-chose.md) | Softov, 2026-10-19 |
| 5 | [A key taken out of the settings is sent as null](../../../decisions/a-key-taken-out-of-the-settings-is-sent-as-null.md) | ahpd's root config |

| What | Source | Task |
| --- | --- | --- |
| The page opens on the long form, as today; the chosen view holds while the page is open. | (defaulted: a third view is added, nothing replaced) | 04 |
| The chosen place is one key per browser, `ahpw.settingsPlace`, as the language is. | (defaulted: a place is about the screen, not the host) | 05 |
| The window's place and size are kept in the browser under `ahpw.settingsWindow`. | (defaulted) | 05 |
| The sections: Host (General, Commit words, Workspace trust, Limits), Daemon (Listener, Sessions, Tools, MCP servers), Plugins (one per `plugins.*` key), VS Code (by subject), and scena's Other for the rest. | the mockup Softov approved, 2026-10-19; VS Code split because ahpd declares 43 of its keys | 04 |
| A docked tab has no title row; its *Open in* is a strip button that lists the places in the palette. | (defaulted: the tab already names it, and a short panel had no room left) | 05 |
| The menu has no *Copy as URL* and no *Apply to all profiles*. | ahpw has no link to one setting and no profiles | 03 |

## Proposed architecture

- **Data flow** - unchanged: the root channel's `config` is the value and the baseline; Save sends `changedKeys` as one `root/configChanged`.
- **State flow** - `SchemaForm` holds the value, the active view and the JSON text's validity; a view draws through `renderField`. The page holds where it is drawn.
- **Layer responsibilities** - scena: `SchemaFormView`, `fieldsView`, `jsonView`, `sectionsView`, `fieldActions`. ahpw: the key-to-section map, the window, the place choice, `changedKeys`.
- **Source-of-truth files** - scena's `packages/scena/src/ui/forms/SchemaForm.tsx` and a new `packages/scena/src/ui/forms/views.tsx`; `src/resources/host/sections.ts` (new) beside the page.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - SchemaForm draws a list of views](task-01-schemaform-draws-a-list-of-views.md) | done | - |
| [02 - The sections view](task-02-the-sections-view.md) | done | 01 |
| [03 - A field shows its key and offers its actions](task-03-a-field-shows-its-key-and-offers-its-actions.md) | done | 01 |
| [04 - The settings page has three views](task-04-the-settings-page-has-three-views.md) | done | 02, 03 |
| [05 - Settings open on the chosen surface](task-05-settings-open-on-the-chosen-surface.md) | done | 04 |
| [06 - A search narrows the tree](task-06-a-search-narrows-the-tree.md) | done | 02 |

## Risks and tradeoffs

- Tasks 04 and 05 need scena's tasks 01-03 released; scena 0.5.9 carries them and ahpw depends on it.
- Moving the JSON text out of `SchemaForm` can break what its tests hold (a value from outside replaces a draft, the person's own value keeps the typed text); `jsonView` mirrors `TupleJson`, which already does both, and the tests run unchanged.
- A floating window can be dragged off the page; its position is clamped to the window on drop and on resize.

## Resume state

- **Done so far:** every task; see [implemented.md](implemented.md).
- **Next action:** none; what waits is in [deferred.md](deferred.md).
- **Open questions:** none.

## Final verification checklist

- [x] scena: `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.
- [x] ahpw: `pnpm test` passes; `tsc` passes against scena's source.
- [x] ahpw with `AHPW_SCENA`: the window opens from the Manage gear, the three views edit one value, Save sends only changed keys, *Open in* moves it to each of the four places.
- [x] ahpw's `pnpm typecheck` and `pnpm build` pass on a released scena.
- [x] `plans/index.md` updated.
