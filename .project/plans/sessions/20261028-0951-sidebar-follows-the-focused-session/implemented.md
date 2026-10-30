---
title: The right sidebar follows the focused session - implemented
date: 2026-10-30
refs:
  - git://19769ec
  - "[code://src/resources/sessions/focus.ts](../../../../src/resources/sessions/focus.ts)"
  - "[code://src/resources/sessions/Page.tsx](../../../../src/resources/sessions/Page.tsx)"
  - "[code://src/shell/tabs.ts](../../../../src/shell/tabs.ts)"
---

Session Info and Changes show the session that has the focus.
A click on a session's tab, or inside its page, changes the right sidebar to that session.

## What was built

- [`code://src/resources/sessions/focus.ts`](../../../../src/resources/sessions/focus.ts) - `sessionOfKey`, `sessionKey` and `followFocus`, which sets `ACTIVE_SESSION` from the main surface's focused tab.
- [`code://src/resources/sessions/Page.tsx`](../../../../src/resources/sessions/Page.tsx) - a pointer down in a session page makes its tab the focused tab.
- [`code://src/shell/tabs.ts`](../../../../src/shell/tabs.ts) - `keepTabs` gives the focus back to the tab that had it after a reload.
- [`code://src/style/app.css`](../../../../src/style/app.css) - `.web-session-page`, a `display: contents` wrapper for the pointer handler.

## Verified

- `focus.test.ts` covers the key parse and `followFocus`; `tabs.test.ts` covers the focus after a reload.
- `pnpm typecheck`, `pnpm test` and `pnpm build` pass on the merged branch, with 629 tests; CI on PR #19 passes.
- Checked by hand at 1280 light and 760 dark: a tab click and a click in the page change Session Info and Changes.
- The composer keeps its caret, and a reload restores the focused tab.

## Departures from the plan

- `ahp.openSession` builds its key with `sessionKey` from `focus.ts`.
- The fix in `keepTabs` was not in the plan; without it a reload gave the focus to the last tab.

## Left for later

- None.
