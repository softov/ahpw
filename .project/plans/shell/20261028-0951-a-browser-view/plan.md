---
title: A Browser view in the right sidebar
domain: shell
status: planned
priority: low
created: 2026-10-28
revalidated: 2026-10-28
requires:
  - plans/sessions/20261028-0951-session-views-open-from-commands/plan.md
refs:
  - "[code://src/shell/right-sidebar.ts](../../../../src/shell/right-sidebar.ts) - `mountRight` and the `showView` that the required plan adds"
  - "[code://src/shell/embed/index.ts](../../../../src/shell/embed/index.ts) - the embed contract that gets an optional browser"
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options - a site that refuses an iframe
  - https://html.spec.whatwg.org/multipage/nav-history-apis.html#crossoriginproperties-(-o-) - a page reads no history of a cross-origin iframe
---

## Goal

A Browser view (Ctrl+Shift+B) in the right sidebar opens web pages.
Its toolbar has back, forward, reload, the address, history and share.
On the web it is an iframe; in ahp-desk the embedder gives a full browser.
Later, ahpw can pick whether a link opens outside or inside.

## Reconnaissance

### Searches performed

- `rg "iframe" src` - no view shows a web page.
- `rg "ahpwEmbedder" src/shell/embed` - the contract has hosts, a token, a window and a profile; no browser.

### Runtime path

```
Ctrl+Shift+B -> showView('browser') -> BrowserView
  web: <iframe src> with ahpw's own list of addresses
  embedder.browser: the embedder's webview, placed over the view's box
```

### Gaps

- The embed contract has no browser.
- ahp-desk has no webview for ahpw; that is ahp-desk's work, after this plan.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A Browser view, Ctrl+Shift+B, toolbar with navigation, history, reload, URL, share | Softov, 2026-10-28 | 01 |
| An iframe on the web; a full browser in ahp-desk | Softov, 2026-10-28: "it could be a iframe on web and full working on ahp-desk" | 01, 02 |
| The toolbar always has Open in a new tab | `(defaulted: a page cannot tell when a site refuses the iframe)` | 01 |
| Back and forward on the web cover the addresses opened from the toolbar | `(defaulted: a cross-origin iframe hides its history)` | 01 |
| Share copies the address, or uses the system share where the browser has one | `(defaulted: share names no target)` | 01 |
| No proxy through ahpd | `(defaulted: it breaks sign-in and lets the page fetch any URL)` | - |
| The view sits in the right sidebar | `(defaulted: VS Code puts Browser beside Files and Changes)` | 01 |

## Proposed architecture

- **Data flow** - the view keeps its address list in memory, and the last address in local storage.
- **Event flow** - the toolbar drives the iframe's `src`, or the embedder's browser.
- **State flow** - `ui`-free; the view owns its own state.
- **Layer responsibilities** - `src/shell/browser/`: the view and its toolbar. `src/shell/embed/`: the optional `browser` member.
- **Source-of-truth files** - [`code://src/shell/embed/index.ts`](../../../../src/shell/embed/index.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a browser view with an iframe](task-01-a-browser-view-with-an-iframe.md) | todo | - |
| [02 - an embedder can give the browser](task-02-an-embedder-can-give-the-browser.md) | todo | 01 |

## Risks and tradeoffs

- Many sites refuse an iframe: GitHub, Google, most sites with a sign-in. The view shows an empty frame; Open in a new tab is the way out.
- The iframe gets `sandbox` with scripts, forms, popups and same-origin, so a page cannot navigate ahpw itself.
- Ctrl+Shift+B is the bookmarks bar in Chrome and Edge; plan `session-views-open-from-commands` checks the keys.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-browser-view-with-an-iframe.md](task-01-a-browser-view-with-an-iframe.md).
- **Open questions:** none.
- **Watch out for:** the iframe reports `load` when a site refuses it too.

## Final verification checklist

- [ ] A site that allows an iframe loads, and back, forward and reload work.
- [ ] A site that refuses shows the frame empty, and Open in a new tab opens it.
- [ ] With a fake embedder browser, the view uses it and not the iframe.
- [ ] Checked at 1280 and 760 wide, in both themes; `pnpm typecheck` and `pnpm test` pass.
