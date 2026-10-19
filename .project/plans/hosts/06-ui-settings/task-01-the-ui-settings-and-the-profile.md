---
title: The UI settings are one list, read and written through their owners, and kept by an embedder's profile when it gives one
status: done
depends: []
layer: "shell"
refs:
  - "[code://src/shell/embed/index.ts](../../../../src/shell/embed/index.ts) - `Embedder` gains `profile`"
---

## Objective

`src/shell/ui-settings/settings.ts` lists the UI settings, each with its form field, how it reads, writes and watches its owner; `profile.ts` keeps them in an embedder's profile when it gives one.

## Files

- `CREATE: src/shell/ui-settings/settings.ts` - `UiSetting`, `UI_SETTINGS`, `uiFields`, `readUi`, `writeUi`, `watchUi`, `isUiKey`.
- `CREATE: src/shell/ui-settings/profile.ts` - `registerProfile(scena)`.
- `CREATE: src/shell/ui-settings/settings.test.ts` - read, write, reset to default, watch, the profile round trip.
- `UPDATE: src/shell/embed/index.ts` - `EmbedProfile`, `Embedder.profile?`.
- `UPDATE: src/shell/notify/confirm.ts` - the style kept as `ahpw.confirmStyle` and read at `initConfirm`.
- `UPDATE: src/resources/host/place.ts` - `SETTINGS_PLACE` store path, set by `keepSettingsPlace` and at start.
- `UPDATE: src/shell/register-shell.tsx` - `registerProfile` after the theme controller, the view and notifications.

## Steps

1. Write the list: `ui.theme`, `ui.themeMode`, `ui.language`, `ui.layout`, `ui.settingsPlace`, `ui.confirmStyle`.
2. A write of a value the setting does not take, or of `undefined`, writes its default.
3. `registerProfile` reads the profile once, writes what it holds, then writes the whole list to it on any change.

## Validation

- `src/shell/ui-settings/settings.test.ts`.

## Resume

Done 2026-10-19.
A profile applied, or several settings changing together, writes the profile once.
