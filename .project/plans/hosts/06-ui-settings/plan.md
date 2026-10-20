---
title: UI settings - the browser's own choices in the settings window, kept by an embedder's profile when it gives one
domain: hosts
status: built
priority: medium
created: 2026-10-19
revalidated: 2026-10-19
requires:
  - plans/hosts/05-settings-in-a-window-with-a-sections-view/plan.md
decisions:
  - decisions/ui-settings-are-kept-by-the-browser-or-an-embedders-profile.md
  - decisions/ui-settings-have-their-own-tab-in-the-settings-window.md
refs:
  - "[code://src/resources/host/Settings.tsx](../../../../src/resources/host/Settings.tsx) - the settings page the UI group joins"
  - "[code://src/resources/host/sections.ts](../../../../src/resources/host/sections.ts) - the groups of the sections view"
  - "[code://src/shell/embed/index.ts](../../../../src/shell/embed/index.ts) - the `Embedder` contract"
  - "[code://src/shell/commands.ts](../../../../src/shell/commands.ts) - the theme menu, `THEME_ID_PATH` and `listThemes`"
  - "[code://src/i18n/messages.ts](../../../../src/i18n/messages.ts) - the language, kept on each change"
  - "[code://src/shell/view/index.ts](../../../../src/shell/view/index.ts) - `view.setMainLayout`, which keeps the layout"
  - "[code://src/shell/notify/confirm.ts](../../../../src/shell/notify/confirm.ts) - the confirm style, held in the store and kept nowhere"
  - "[code://src/resources/host/place.ts](../../../../src/resources/host/place.ts) - where the settings open"
---

## Goal

The settings window gains an Interface tab beside the host's: theme, light or dark, language, the main area's layout, where the settings open, and how a question is asked.
Each applies as it changes and is kept by the browser, and by an embedder's profile when it gives one, so ahp-desk can keep them as a JSON file.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `grep -rn "localStorage" src` - about thirty choices, each kept under its own key by the module that owns it; none is gathered anywhere.
- `grep -rn "CONFIRM_STYLE" src` - the confirm style is a store path, set by a command and kept nowhere, so a reload forgets it.
- `grep -n "layout/surfaces" scena/src/core/controls/layout.ts` - scena mirrors each surface's layout into the store at `$/layout/surfaces/<surface>`.

### Runtime path

```
UI_SETTINGS: ui.<name> -> { field, read, write, watch }
  Settings page: Tabs [Host: host's form, draft until Save | Interface: readUi form, onChange -> writeUi at once]
  registerProfile: embedder.profile.read() -> write each; any watch -> profile.write(readUi) whole
  write -> the owner's own keeping (theme controller, i18n, writeLayout, confirm style, keepSettingsPlace)
```

### Gaps

- `Not found: a list of UI choices - searched "localStorage" in src.`

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [UI settings are kept by the browser, or by an embedder's profile when it gives one, with the browser keeping a copy](../../../decisions/ui-settings-are-kept-by-the-browser-or-an-embedders-profile.md) | Softov, 2026-10-19 |
| 2 | [UI settings have their own tab in the settings window, beside the host's, and apply as they change](../../../decisions/ui-settings-have-their-own-tab-in-the-settings-window.md) | Softov, 2026-10-19 |

| What | Source | Task |
| --- | --- | --- |
| The host settings open on the sections view. | Softov, 2026-10-19: "open host config default as section." | 02 |
| A UI key is `ui.<name>`, flat, as the host's keys are. | (defaulted: the sections view groups flat keys) | 01 |
| Each setting keeps its value where its owner keeps it today; the list reads and writes through the owner. | (defaulted: a menu and the form then cannot disagree) | 01 |
| The confirm style is kept in the browser, `ahpw.confirmStyle`. | (defaulted: a UI setting a reload forgets is not one) | 01 |
| Where the settings open is mirrored into the store, `$/ahp/settings/place`, so the form sees a change made from *Open in*. | (defaulted: every setting needs a watch) | 01 |
| Taking a UI key out, by the field's Reset or the JSON view, sets it to its default. | (defaulted: as a host key taken out goes back to the host's) | 02 |
| Host is the first tab; the settings open on the tab last chosen. | (defaulted: the window is the host's settings first) | 02 |
| The palette lists *Interface settings*, which opens the settings on the Interface tab; the other commands stay as they are. | Softov, 2026-10-19: "open interface tab. leave the others commands as is." | 02 |

## Proposed architecture

- **Data flow** - `UI_SETTINGS` in `src/shell/ui-settings/settings.ts` is the one list; the page, the profile and the tests read it.
- **State flow** - nothing new holds a value; each setting reads and writes its owner.
- **Layer responsibilities** - `settings.ts`: the list, `uiFields`, `readUi`, `writeUi`, `watchUi`. `profile.ts`: `registerProfile`. `Settings.tsx`: the two tabs, `HostSettings` and `InterfaceSettings`.
- **Source-of-truth files** - `src/shell/ui-settings/settings.ts` (new).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The UI settings and the profile](task-01-the-ui-settings-and-the-profile.md) | done | - |
| [02 - The Interface tab in the settings window](task-02-the-ui-group-in-the-settings-window.md) | done | 01 |

## Risks and tradeoffs

- A setting a person changes from a menu while the form is open shows in the form at once; a host key's draft is untouched by it.
- In a window with every host, each host's settings show the same UI group, since the UI is the browser's.

## Resume state

- **Done so far:** every task; see [implemented.md](implemented.md).
- **Next action:** none; what waits is in [deferred.md](deferred.md).
- **Open questions:** none.

## Final verification checklist

- [x] `pnpm test` passes.
- [x] By hand: each UI setting from the form applies at once and survives a reload; a change from its menu shows in the form; the host's Save counts host keys only.
- [x] `plans/index.md` updated.
