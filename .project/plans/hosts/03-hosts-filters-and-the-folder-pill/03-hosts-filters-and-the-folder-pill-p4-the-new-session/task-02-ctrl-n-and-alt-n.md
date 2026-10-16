---
title: Ctrl+N and Alt+N open a new session
status: done
depends: []
layer: "src/resources/sessions"
refs:
  - "[code://src/resources/sessions/index.ts#L141-154](../../../../../src/resources/sessions/index.ts#L141-154) - `ahp.newSession`, with no key"
---

## Objective

`ahp.newSession` has the keys `ctrl+n` and `alt+n`.
In a browser, Ctrl+N stays the browser's, and Alt+N works.

## Files

- `UPDATE: src/resources/sessions/index.ts:141-154` - `keys: ['ctrl+n', 'alt+n']`.

## Steps

1. Add the keys.
2. Check the palette shows them beside New session.

## Validation

- `pnpm test` and `pnpm typecheck` pass.
- By hand: Alt+N opens a new session in a browser.

## Resume
