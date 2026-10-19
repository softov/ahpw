---
title: Settings open in a floating window or on the surface the person chose
status: done
depends: [task-04-the-settings-page-has-three-views.md]
layer: "ahpw host settings, shell"
refs:
  - "[code://src/resources/host/index.ts#L56-L68](../../../../src/resources/host/index.ts#L56-L68) - `ahp.openSettings`"
  - "[code://src/shell/CommandPalette.tsx](../../../../src/shell/CommandPalette.tsx) - opening a mount on `overlay`"
  - "[code://src/shell/panel/index.ts](../../../../src/shell/panel/index.ts) - `openInPanel`"
  - "[code://src/shell/right-sidebar.ts](../../../../src/shell/right-sidebar.ts) - `RIGHT_SIDEBAR`"
  - "[code://src/style/app.css#L1772-L1792](../../../../src/style/app.css#L1772-L1792) - the palette's floating box, the look the window follows"
---

## Objective

`ahp.openSettings` opens the settings in the kept place: a floating window on `overlay` by default, else a tab in `main`, `sidebar:right` or `panel:bottom`.
Every place has *Open in*, which moves the settings and keeps the choice.

## Files

- `CREATE: src/resources/host/place.ts` - `SettingsPlace`, `PLACES`, `settingsPlace()`, `keepSettingsPlace()`, `openSettingsAt(scena, host, place)`.
- `CREATE: src/resources/host/place.test.ts` - the kept place and its fallback.
- `CREATE: src/resources/host/SettingsWindow.tsx` - the floating window: title bar to drag, maximize, close, a corner to resize, the page inside.
- `UPDATE: src/resources/host/Settings.tsx` - *Open in* in the page's header, its menu of the four places.
- `UPDATE: src/resources/host/index.ts` - register `HostSettingsWindow`; `ahp.openSettings` calls `openSettingsAt` with the kept place.
- `UPDATE: src/style/app.css` - `.web-settings-window` and its parts.
- `UPDATE: src/i18n/en.json`, `es.json`, `pt.json` - the places, *Open in*, maximize, close.

## Steps

1. `settingsPlace()` reads `ahpw.settingsPlace` from `localStorage`, `overlay` when absent or unknown.
2. `openSettingsAt` closes the settings wherever they are open for that host and opens them at the place: `overlay` with `{ component: 'HostSettingsWindow', host }`; `main` as today; `sidebar:right` through `scena.surfaces.open` and shows the sidebar; `panel:bottom` through `openInPanel`.
3. The window places itself with `position: fixed`, starting centred at `min(1080px, 92vw)` by `min(740px, 88vh)`; dragging the title bar moves it, the corner resizes it, both clamped to the window; the box is kept in `ahpw.settingsWindow`; Escape and the close button close it.
4. Maximize fills the window and toggles back.

## Validation

- `place.test.ts`: the kept place is read back; an unknown value falls back to `overlay`.
- By hand with `AHPW_SCENA=../scena pnpm dev`: the Manage gear opens the window; *Open in* moves it to each place and the next open uses it; drag, resize and maximize; the page under the window stays usable.
- `pnpm test`; `tsc` against scena's source.

## Resume

Done 2026-10-19.
Docked places draw no title row: the tab names the settings, and *Open in* is a strip button (`ahp.settings.openIn`, slot `surface/title`) that lists the places in the palette; the window keeps *Open in* on its title bar as a menu.
Found in the browser: a drag selected the page's text, and a window dragged down put its resize corner off screen; the drag now holds `user-select`, and the window is kept whole inside the page.
Checked in the browser: window, editor tab, right sidebar (narrow layout) and bottom panel; drag, resize, light and dark.
