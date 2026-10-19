---
title: Settings open on the surface a person chose, a floating window first
status: accepted
date: 2026-10-19
refs:
  - "[code://src/resources/host/index.ts#L56-L68](../../src/resources/host/index.ts#L56-L68) - `ahp.openSettings`, which opens a tab in `main` today"
  - "[code://src/shell/CommandPalette.tsx](../../src/shell/CommandPalette.tsx) - a mount on the `overlay` surface that places itself"
  - "[code://src/shell/right-sidebar.ts](../../src/shell/right-sidebar.ts) - `RIGHT_SIDEBAR`"
  - "[code://src/shell/panel/index.ts](../../src/shell/panel/index.ts) - `PANEL` and `openInPanel`"
---

## Context

Softov chose the floating window on 2026-10-19 ("I think I prefer B. A floating window like.") and said the modal was not the piece: "Maybe modal is not the right piece. Since its layout is fixed."
Then: "vscode also has how to open the settings in a panel. more like selecting the surface where the panel will open."
scena's `overlay` surface draws its mounts with `FloatingLayout`, which places nothing, and ahpw already mounts its palette, toasts and confirm dialog there.

## Decision

The settings open in one of four places: a floating window on `overlay`, a tab in `main`, a tab in `sidebar:right`, or a tab in `panel:bottom`.
The window is the first place; a header button, *Open in*, moves the open settings to another, and the choice is kept in the browser, so the next settings open there.
The window has a title bar to drag, a corner to resize, and no backdrop, so the page under it stays in use.

## Consequences

`ahp.openSettings` reads the kept place instead of always opening `main`.
The page draws a header for its place, and a narrow place gets the sections view's narrow layout.

## Options

- scena's `Modal`: lost, because its box is fixed (a 16px padding, 80% of the window at most, no size) and it covers the page.
- A sidebar section that lists the sections, with each section a tab: lost, Softov chose the window.
- Always `main`, as today: lost, Softov asked for the choice.
