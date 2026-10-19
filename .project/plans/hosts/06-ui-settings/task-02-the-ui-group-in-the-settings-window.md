---
title: The settings window opens on its sections, with the UI settings on an Interface tab beside the host's
status: done
depends: [task-01-the-ui-settings-and-the-profile.md]
layer: "resources/host"
refs:
  - "[code://src/resources/host/Settings.tsx](../../../../src/resources/host/Settings.tsx) - the page"
  - "[code://src/resources/host/sections.ts](../../../../src/resources/host/sections.ts) - `settingsGroups`"
---

## Objective

The settings window has a Host tab and an Interface tab, each opening on its sections view; a UI key applies as it changes, the host's keys wait for Save.

## Files

- `UPDATE: src/resources/host/Settings.tsx` - `SettingsPage` draws scena's `Tabs`: `HostSettings`, the host's form with Save and Reset, and `InterfaceSettings`, the UI form, applied as it changes.
- `UPDATE: scena packages/scena/src/ui/navigation/Tabs.tsx` - `onChange`, so the page keeps the tab last chosen; `test/ui/Tabs.test.tsx`.
- `UPDATE: src/resources/host/sections.ts` - `interfaceGroups`: appearance, language, layout, dialogs.
- `UPDATE: src/resources/host/sections.test.ts` - the group.
- `UPDATE: src/i18n/en.json`, `es.json`, `pt.json` - `host/settings/groups/ui`, its sections, each setting's title and description.

## Steps

1. `defaultView` falls back to `sections`.
2. The Interface form's value and baseline are `readUi`; a change writes each UI key that differs, or its default when taken out.
3. Each tab's form fills the tab and scrolls itself, the bar under it sticky.

## Validation

- `src/resources/host/sections.test.ts`.
- By hand in Chromium against an isolated ahpd.

## Resume

Done 2026-10-19.
Found on the way: choosing a section low in the tree scrolled the whole window, so a short section sat above the view.
The sections view now scrolls its tree and its content on their own when the form has a bounded height (scena `SectionsView.css`).
The settings page lets its form fill it, with a minimum height so a low bottom panel scrolls as a whole.
First built as a group in the host's tree; Softov asked for a tab, so the UI settings moved to their own (decision: UI settings have their own tab in the settings window).
