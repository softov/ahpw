---
title: Settings in a window, with a sections view beside the fields and the JSON - implemented
date: 2026-10-19
refs:
  - "[code://src/resources/host/Settings.tsx](../../../../src/resources/host/Settings.tsx)"
  - "[code://src/resources/host/SettingsWindow.tsx](../../../../src/resources/host/SettingsWindow.tsx)"
  - "[code://src/resources/host/sections.ts](../../../../src/resources/host/sections.ts)"
  - "[code://src/resources/host/place.ts](../../../../src/resources/host/place.ts)"
  - npm://@softov/scena@^0.5.9 - `views`, `fieldsView`, `jsonView`, `sectionsView`, `fieldActions`
  - git://v0.5.9 - the scena release that carries tasks 01-03
---

The host settings draw through three views, Sections, Fields and JSON, over one value.
Sections is a tree of groups and sections with a search beside the chosen section's fields.
Hovering a setting shows its key, and a gear offers reset, copy setting ID, copy setting as JSON and show in JSON.
The settings open in a floating window, or in a tab of the main area, the right sidebar or the bottom panel, as the person chooses.

## What was built

- scena: `SchemaForm` takes `views`; `fieldsView`, `jsonView` and `sectionsView(groups)`; `fieldActions`. Released in `@softov/scena` 0.5.9.
- [`code://src/resources/host/sections.ts`](../../../../src/resources/host/sections.ts) - `settingsGroups`, the host's sections.
- [`code://src/resources/host/place.ts`](../../../../src/resources/host/place.ts) - `PLACES`, `settingsPlace`, `keepSettingsPlace`.
- [`code://src/resources/host/SettingsWindow.tsx`](../../../../src/resources/host/SettingsWindow.tsx) - the floating window.
- [`code://src/resources/host/Settings.tsx`](../../../../src/resources/host/Settings.tsx) - the page with its three views.
- `package.json` - `@softov/scena` `^0.5.9`.

## Verified

- scena: `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build`, by its release check and its Release workflow.
- ahpw on the released scena 0.5.9: `pnpm typecheck`, `vitest run` (466 tests) and `pnpm build` pass.
- In Chromium against an isolated ahpd: the window opens from the Manage gear, the three views edit one value, Save sends only changed keys, *Open in* moves it to each of the four places.

## Departures from the plan

- The sections view scrolls its tree and its content on their own in a bounded form (scena `308cd40`, in 0.5.9), since a section low in the tree scrolled the whole window.
- Until the release, ahpw ran on scena's source with `AHPW_SCENA` and typechecked through a scratch `tsconfig`; neither is needed now.
