---
title: An embedder can give the Browser view a full browser
status: todo
depends: [task-01-a-browser-view-with-an-iframe.md]
layer: "shell embed"
refs:
  - "[code://src/shell/embed/index.ts](../../../../src/shell/embed/index.ts) - the contract to widen"
---

## Objective

The embed contract has an optional `browser`; when the embedder gives one, the Browser view drives it in place of the iframe.

## Files

- `UPDATE: src/shell/embed/index.ts` - an `EmbedBrowser` with `show(bounds)`, `hide()`, `open(url)`, `back()`, `forward()`, `reload()` and `onNavigated(handler)`.
- `UPDATE: src/shell/embed/index.test.ts` - the contract reads a browser, and reads none.
- `UPDATE: src/shell/browser/BrowserView.tsx` - use the embedder's browser when present.

## Steps

1. Add `EmbedBrowser` and the optional `browser` member, with no imports, as the contract's other types.
2. Read it through the contract's existing reader.
3. In the view, place the embedder's browser over the view's box with `show(bounds)`.
4. Send new bounds on each resize, and `hide()` when the tab is hidden.
5. Take the address and the history from `onNavigated`.
6. Write a short note for ahp-desk with the contract, as its own brief there.

## Validation

- `index.test.ts`: a browser present and absent.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: a fake `browser` in the page's console gets `show`, `open` and `hide`.

## Resume
