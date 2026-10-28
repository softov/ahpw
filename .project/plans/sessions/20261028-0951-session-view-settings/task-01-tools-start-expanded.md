---
title: Tool rows start expanded, as a UI setting says
status: todo
depends: []
layer: "shell ui-settings, sessions"
refs:
  - "[code://src/resources/sessions/Parts.tsx#L140-L141](../../../../src/resources/sessions/Parts.tsx#L140-L141) - the tool row's first state"
---

## Objective

`ui.toolsExpanded` sets whether a tool row starts open; the default is Expanded.

## Files

- `UPDATE: src/shell/ui-settings/settings.ts` - `ui.toolsExpanded`, values `expanded` and `collapsed`, default `expanded`.
- `UPDATE: src/resources/host/sections.ts` - add the key to the `session` section.
- `UPDATE: src/resources/sessions/Parts.tsx:140` - the tool row's first state reads the setting.
- `UPDATE: src/i18n/en.json` - the setting and its values; the same keys in `es.json` and `pt.json`.

## Steps

1. Add `ui.toolsExpanded` in the shape of `ui.confirmStyle`.
2. Add it to the `session` section.
3. Start `ToolCall`'s `open` state from the setting.
4. Leave `Reasoning` closed at start.

## Validation

- `settings.test.ts`: the key, its values and its default.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: both values on a session with several tool calls.

## Resume
