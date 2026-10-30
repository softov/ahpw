---
title: A Browser view in the right sidebar - implemented
date: 2026-10-30
refs:
  - git://ecf20fe
  - "[code://src/shell/browser/BrowserView.tsx](../../../../src/shell/browser/BrowserView.tsx)"
  - "[code://src/shell/embed/index.ts](../../../../src/shell/embed/index.ts)"
---

The right sidebar has a Browser view, which also opens from "Show Browser" in the palette.
Its toolbar has back, forward, reload, the address, history, share and Open in a new tab.
On the web the view is a sandboxed iframe.
An embedder can give a full browser through the optional `browser` member of the embed contract.

## What was built

- [`code://src/shell/browser/BrowserView.tsx`](../../../../src/shell/browser/BrowserView.tsx) - the toolbar, the iframe, and the embedder's browser when it has one.
- [`code://src/shell/browser/history.ts`](../../../../src/shell/browser/history.ts) - the address list.
- [`code://src/shell/browser/address.ts`](../../../../src/shell/browser/address.ts) - `addressOf`, which refuses a scheme other than http and https.
- [`code://src/shell/browser/index.ts`](../../../../src/shell/browser/index.ts) - `registerBrowser`, which mounts the view with `mountRight`.
- [`code://src/shell/embed/index.ts`](../../../../src/shell/embed/index.ts) - `EmbedBrowser`, `EmbedBounds` and `EmbedNavigation`.

## Verified

- `history.test.ts`, `address.test.ts` and `embed/index.test.ts` cover the address list, the address parse, and a contract with and without a browser.
- `pnpm typecheck`, `pnpm test` and `pnpm build` pass on the branch, with 643 tests; CI on PR #21 passes.
- Checked by hand at 1280 light and 760 dark against a local site, example.com and github.com, which refuses the iframe.
- A fake embedder browser got `show`, `open`, `back`, `reload`, new bounds on a resize, and `hide` behind another tab.

## Departures from the plan

- In a narrow sidebar the toolbar wraps to two lines, so the address field keeps its room.

## Left for later

- The browser in ahp-desk, a key, and a choice of where a link opens - see [deferred.md](deferred.md).
