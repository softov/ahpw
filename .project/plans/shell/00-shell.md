---
title: Shell - what exists today
domain: shell
revalidated: 2026-10-30
---

The shell is the frame around ahpw's resources.
It holds the surfaces, the right sidebar, the layout menu, the UI settings and the contract with an embedder such as ahp-desk.
It is `src/shell/`, over scena's surfaces and layout.

## Glossary

| Term | Meaning |
| --- | --- |
| surface | A scena area: `main`, `sidebar:left`, `sidebar:right`, `panel:bottom`, `titlebar`, `activitybar`, `statusbar`, `overlay`. |
| right sidebar | The `sidebar:right` surface, whose tabs mount through `mountRight`. |
| embedder | An app that loads ahpw and sets `globalThis.ahpwEmbedder`, such as ahp-desk. |

## Packages

- [`code://src/shell`](../../../src/shell) - registered from `src/shell/register-shell.tsx`.
- `npm://@softov/scena@^0.5.16` - surfaces, layout, commands and keys.

## Contracts

- [`code://src/shell/embed/index.ts`](../../../src/shell/embed/index.ts) - what an embedder gives ahpw.
- [`code://src/shell/right-sidebar.ts`](../../../src/shell/right-sidebar.ts) - `mountRight`, a tab in the right sidebar.
- [`code://src/shell/ui-settings/settings.ts`](../../../src/shell/ui-settings/settings.ts) - `UiSetting` and the `ui.*` keys.
- [`code://src/shell/browser/index.ts`](../../../src/shell/browser/index.ts) - `registerBrowser`, the Browser view, a web page in the right sidebar.

## Runtime path

```
main.tsx -> embed contract read -> register-shell -> resources mount on surfaces
```

## Tests

- [`code://src/shell/embed/index.test.ts`](../../../src/shell/embed/index.test.ts) - the embed contract.
- [`code://src/shell/ui-settings/settings.test.ts`](../../../src/shell/ui-settings/settings.test.ts) - the UI settings.
