---
title: A Browser view shows a page in an iframe
status: done
depends: []
layer: "shell"
refs:
  - "[code://src/shell/right-sidebar.ts](../../../../src/shell/right-sidebar.ts) - mount and show the view"
---

## Objective

The right sidebar has a Browser tab with a toolbar and an iframe, and "Show Browser" in the palette shows it.

## Files

- `CREATE: src/shell/browser/BrowserView.tsx` - the toolbar and the iframe.
- `CREATE: src/shell/browser/history.ts` - the address list: open, back, forward, entries.
- `CREATE: src/shell/browser/history.test.ts` - cases for the address list.
- `CREATE: src/shell/browser/address.ts` - `addressOf(text)`: adds `https://` to a bare host, and `http://` to a host on this machine; refuses a scheme other than http and https.
- `CREATE: src/shell/browser/address.test.ts` - cases for `addressOf`.
- `CREATE: src/shell/browser/index.ts` - `registerBrowser`: the component, and the tab with `mountRight`.
- `UPDATE: src/shell/register-shell.tsx` - call `registerBrowser`.
- `UPDATE: src/resources/emojis.ts` - the back, forward, share and external icons.
- `UPDATE: src/style/app.css` - the toolbar and the frame.
- `UPDATE: src/i18n/en.json` - the tab, the toolbar labels and the empty state; the same keys in `es.json` and `pt.json`.

## Steps

1. Write the address list, which drops the forward entries on a new address.
2. Write `addressOf`, which refuses `javascript:`, `data:` and `file:`.
3. Draw the toolbar: back, forward, reload, the address field, history, share, Open in a new tab.
4. Draw the iframe with `sandbox="allow-scripts allow-forms allow-popups allow-same-origin"`.
5. Show an empty state with the address field until the view opens a page.
6. Make history a menu of the address list.
7. Make share use `navigator.share` when present, or copy the address.
8. Keep the last address in local storage, inside try and catch.
9. Mount the tab with `mountRight` and its key.

## Validation

- `history.test.ts`: open, back, forward, a new address after back.
- `address.test.ts`: a bare host, a full URL, a refused scheme, empty text.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: a site that allows an iframe, and one that refuses it.

## Resume

Built and checked by hand at 1280 light and 760 dark against a local site, example.com and github.com.
In a narrow sidebar the toolbar wraps to two lines, so the address field keeps its room.
