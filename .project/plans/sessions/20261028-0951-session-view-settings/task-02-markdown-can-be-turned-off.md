---
title: The agent's text shows as plain text when Markdown is off
status: implemented
depends: []
layer: "shell ui-settings, sessions"
refs:
  - "[code://src/resources/sessions/Parts.tsx#L251](../../../../src/resources/sessions/Parts.tsx#L251) - the markdown part"
---

## Objective

`ui.sessionMarkdown` sets whether the agent's text is drawn as Markdown; the default is Enabled.

## Files

- `UPDATE: src/resources/sessions/view-settings.ts` - `SESSION_MARKDOWN`, values `enabled` and `disabled`, default `enabled`, kept in localStorage.
- `UPDATE: src/shell/ui-settings/settings.ts` - `ui.sessionMarkdown` over `SESSION_MARKDOWN`.
- `UPDATE: src/resources/host/sections.ts` - add the key to the `session` section.
- `UPDATE: src/resources/sessions/Parts.tsx:251` - draw plain text when the setting is `disabled`.
- `UPDATE: src/style/app.css` - a plain text class that keeps line breaks and wraps.
- `UPDATE: src/i18n/en.json` - the setting and its values "Enabled" and "Disable Markdown"; the same keys in `es.json` and `pt.json`.

## Steps

1. Add `ui.sessionMarkdown` in the shape of `ui.confirmStyle`, with its value in `view-settings.ts`.
2. Add it to the `session` section.
3. Draw the markdown part as text in a `white-space: pre-wrap` block when it is `disabled`.
4. Keep the link clicks of the part working in both states.

## Validation

- `settings.test.ts`: the key, its values and its default.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: a reply with a list, code and a link, in both states, in both themes.

## Resume

- Implemented 2026-10-29. Plain text is `.web-md--plain`, with `white-space: pre-wrap`; it has no links, so no click handler.
- Checked by hand at 1280 light and 420 dark: bold and code by default, the raw text with Disable Markdown.
