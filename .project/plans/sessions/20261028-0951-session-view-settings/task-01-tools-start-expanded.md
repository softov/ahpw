---
title: Tool rows start collapsed or expanded, as a UI setting says
status: done
depends: []
layer: "shell ui-settings, sessions"
refs:
  - "[code://src/resources/sessions/Parts.tsx#L140-L141](../../../../src/resources/sessions/Parts.tsx#L140-L141) - the tool row's first state"
---

## Objective

`ui.toolsExpanded` sets whether a tool row starts open; the default is Collapsed.

## Files

- `CREATE: src/resources/sessions/view-settings.ts` - `TOOLS_EXPANDED`, values `expanded` and `collapsed`, default `collapsed`, kept in localStorage.
- `UPDATE: src/shell/ui-settings/settings.ts` - `ui.toolsExpanded` over `TOOLS_EXPANDED`.
- `UPDATE: src/resources/host/sections.ts` - add the key to the `session` section.
- `UPDATE: src/resources/sessions/Parts.tsx:140` - the tool row's first state reads the setting.
- `UPDATE: src/i18n/en.json` - the setting and its values; the same keys in `es.json` and `pt.json`.

## Steps

1. Add `ui.toolsExpanded` in the shape of `ui.confirmStyle`, with its value in `view-settings.ts`.
2. Add it to the `session` section.
3. Start `ToolCall`'s `open` state from the setting.
4. Leave `Reasoning` closed at start.

## Validation

- `settings.test.ts`: the key, its values and its default.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: both values on a session with several tool calls.

## Resume

- Implemented 2026-10-29. `chatChoice` in `view-settings.ts` holds the value, so `Parts.tsx` does not import the shell.
- Checked by hand at 1280 light and 420 dark: closed by default, open after Expanded and a reload.
