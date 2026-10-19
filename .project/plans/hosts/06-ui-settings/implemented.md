---
title: UI settings - the browser's own choices in the settings window, kept by an embedder's profile when it gives one - implemented
date: 2026-10-19
refs:
  - "[code://src/shell/ui-settings/settings.ts](../../../../src/shell/ui-settings/settings.ts)"
  - "[code://src/shell/ui-settings/profile.ts](../../../../src/shell/ui-settings/profile.ts)"
  - "[code://src/resources/host/Settings.tsx](../../../../src/resources/host/Settings.tsx)"
---

The settings window has a Host tab and an Interface tab, each opening on its sections; the Interface tab holds the theme, light or dark, the language, the main area's layout, where the settings open, and how a question is asked.
Each applies as it changes, survives a reload, and follows a change made from its menu; an embedder that gives a `profile` keeps them too.

## What was built

- [`code://src/shell/ui-settings/settings.ts`](../../../../src/shell/ui-settings/settings.ts) - `UI_SETTINGS` and `uiFields`, `readUi`, `writeUi`, `watchUi`, `isUiKey`.
- [`code://src/shell/ui-settings/profile.ts`](../../../../src/shell/ui-settings/profile.ts) - `registerProfile`.
- [`code://src/shell/embed/index.ts`](../../../../src/shell/embed/index.ts) - `EmbedProfile`, `Embedder.profile`.
- [`code://src/resources/host/Settings.tsx`](../../../../src/resources/host/Settings.tsx) - the Host and Interface tabs.
- [`code://src/resources/host/sections.ts`](../../../../src/resources/host/sections.ts) - `interfaceGroups`.
- [`code://src/resources/host/index.ts`](../../../../src/resources/host/index.ts) - `ahp.openInterfaceSettings`, *Interface settings* in the palette; `settingsTab` and `keepSettingsTab` in `place.ts`.
- [`code://src/shell/notify/confirm.ts`](../../../../src/shell/notify/confirm.ts) - the confirm style kept across reloads.
- [`code://src/resources/host/place.ts`](../../../../src/resources/host/place.ts) - `SETTINGS_PLACE`, `placeName`.
- scena `packages/scena/src/ui/forms/SectionsView.css` - the tree and the content scroll on their own in a bounded form.
- scena `packages/scena/src/ui/navigation/Tabs.tsx` - `onChange`.

## Verified

- `vitest run`: 86 files, 458 tests; new `src/shell/ui-settings/settings.test.ts` (5) and a case in `src/resources/host/sections.test.ts`.
- scena `test/ui/SchemaForm.test.tsx`: 19 pass.
- `tsc` against scena's source: no error in `src/`.
- In Chromium against an isolated ahpd: the window opens on its sections; dark and a split layout apply at once with Save off; dark and the browser's dialog survive a reload; the window, an editor tab and the bottom panel each show the tree and the content.

## Departures from the plan

- The UI settings were first a group in the host's tree; they moved to a tab of their own at Softov's word.
- The sections view's scrolling, which the plan did not name: a section low in the tree scrolled the whole window, so the content sat above the view.

## Left for later

- See [deferred.md](deferred.md).
