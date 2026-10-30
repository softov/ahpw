---
title: UI settings for tools expanded and Markdown in a session - implemented
date: 2026-10-30
refs:
  - git://19769ec
  - "[code://src/resources/sessions/view-settings.ts](../../../../src/resources/sessions/view-settings.ts)"
  - "[code://src/resources/sessions/Parts.tsx](../../../../src/resources/sessions/Parts.tsx)"
---

The Session section of the Interface settings has Tool calls and Markdown.
Tool calls sets whether tool rows start open or closed; the default is Collapsed.
Markdown draws the agent's text as Markdown or as plain text; the default is Enabled.

## What was built

- [`code://src/resources/sessions/view-settings.ts`](../../../../src/resources/sessions/view-settings.ts) - `chatChoice`, `TOOLS_EXPANDED` and `SESSION_MARKDOWN`, each kept in localStorage.
- [`code://src/shell/ui-settings/settings.ts`](../../../../src/shell/ui-settings/settings.ts) - `ui.toolsExpanded` and `ui.sessionMarkdown`.
- [`code://src/resources/sessions/Parts.tsx`](../../../../src/resources/sessions/Parts.tsx) - a tool row starts from the setting; a markdown part draws as plain text when it is off.
- [`code://src/style/app.css`](../../../../src/style/app.css) - `.web-md--plain`, with `white-space: pre-wrap`.

## Verified

- `pnpm typecheck`, `pnpm test` and `pnpm build` pass on the merged branch, with 629 tests; CI on PR #19 passes.
- Checked by hand at 1280 light and 420 dark: tool rows are closed by default, and open after Expanded and a reload.
- Checked by hand: the text shows bold and code by default, and raw text with Disable Markdown.

## Departures from the plan

- `chatChoice` holds each value in `view-settings.ts`, so `Parts.tsx` does not import the shell.
- Plain text has no links, so it has no click handler.

## Left for later

- None.
