---
title: A plugin's and an adapter's own icon, in their lists and on their pages
domain: plugins
status: built
priority: medium
created: 2026-10-23
revalidated: 2026-10-23
requires:
  - plans/plugins/03-plugins-explorer-and-page/plan.md
  - plans/plugins/04-connectors/plan.md
refs:
  - "[code://src/shell/explorer/ExplorerList.tsx#L12-L30](../../../../src/shell/explorer/ExplorerList.tsx#L12-L30) - `Row`, whose `icon` replaces the dot today"
  - "[code://src/bridges/plugins.ts#L46-L53](../../../../src/bridges/plugins.ts#L46-L53) - `PluginManifest`, which gets `icons`"
  - "[code://src/bridges/connectors.ts#L53-L63](../../../../src/bridges/connectors.ts#L53-L63) - `AdapterRow`, which gets `icons`"
  - "[code://src/resources/bots/Bood.tsx#L73](../../../../src/resources/bots/Bood.tsx#L73) - the light or dark scheme a drawing follows"
  - "[code://src/resources/plugins/PluginPage.tsx#L45](../../../../src/resources/plugins/PluginPage.tsx#L45) - the head that reads `🔣 <title>`"
  - "[code://src/resources/connectors/ConnectorPage.tsx#L39](../../../../src/resources/connectors/ConnectorPage.tsx#L39) - the head that reads `🔌 <title>`"
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `Icon`: `src`, `contentType`, `sizes`, `theme`
  - git://d41f318c - ahpd main with icons on `x-ahpd-plugins` and `x-ahpd-adapters` (PR 80)
  - file:///github/ahpd/docs/plugins/PLUGINS.md - "Icons": the shape, the 32 KB limit, and "draw an icon as an image"
  - file:///github/ahpd/packages/server/src/icons.ts - how the host reads an icon; an `https:` URL is sent as it is
---

## Goal

A plugin and an adapter that carry an icon show it wherever ahpw names them.
That is the plugin and connector lists, their pages, and the connector form.
A row keeps its state as a small badge on the icon's corner.
A plugin or an adapter with no icon shows as it does today.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "icons|iconProblems" src .project` in ahpw - nothing reads a host's icons.
- `git grep '"icons"' packages/*/package.json` in ahpd at `d41f318c` - no bundled plugin declares one; Activepieces pieces carry their logos.
- `rg "https" packages/server/src/icons.ts` in ahpd - a manifest's `https:` icon is sent as a URL, not read into a `data:` URI.

### Runtime path

```
x-ahpd-plugins row.manifest.icons ─┐
x-ahpd-adapters row.icons ─────────┴─> pickIcon(icons, scheme) -> <img src=data:...> in a row, a group heading, a page head
```

### Gaps

- `PluginManifest` and `AdapterRow` have no `icons`.
- A `Row` draws an icon or a dot, never both.
- A group heading and a page head take only text.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A row draws the icon where the dot was, and the dot becomes a badge on its corner. | Softov, 2026-10-23: "Icon with a state badge" | 01 |
| An icon is an `<img>`, never SVG put into the page. | ahpd's PLUGINS.md, "Icons": "never inline in the document" | 01 |
| The icon whose `theme` is the scheme shown wins, then one with no `theme`, then any. | (defaulted: the protocol's `theme` says which background the icon is made for) | 01 |
| Only a `data:` icon is drawn; any other `src` counts as no icon. | (defaulted: a URL would make the browser ask a third party, and the protocol asks for a trusted domain) | 01 |
| An icon on a page head takes the place of the 🔣 or 🔌. | (defaulted: the icon names the thing more closely than the kind's emoji) | 02, 03 |
| A connector shows its adapter's icon: its row, its page head, its Overview line, the form's heading. | (defaulted: a connector is made from its adapter) | 03 |
| By adapter, each group heading shows the adapter's icon. | (defaulted: the heading names the adapter) | 03 |
| No plugin or adapter is named in code. | Peer session for Softov, 2026-10-23: "Hardcode no plugin or adapter by name" | 01-03 |

## Proposed architecture

- **Data flow** - The plugins and adapters channels already reach the explorers and pages; each row now carries `icons`.
- **State flow** - The scheme is `resolveThemeMode` of `THEME_MODE_PATH`, as a bot's drawing reads it.
- **Layer responsibilities** - `src/bridges/icons.ts` picks an icon. `src/shell/HostIcon.tsx` draws it. `ExplorerList` draws a row's icon with its badge, and a group's icon.
- **Source-of-truth files** - ahpd's `packages/server/src/icons.ts` and `packages/sdk/src/types/plugin.ts`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - An icon is picked and drawn, and a row keeps its dot as a badge](task-01-pick-and-draw-an-icon.md) | done | - |
| [02 - A plugin's icon in its row and its head](task-02-a-plugins-icon.md) | done | 01 |
| [03 - An adapter's icon on its connectors](task-03-an-adapters-icon.md) | done | 01 |

## Risks and tradeoffs

- A host before `d41f318c` sends no `icons` - every row and head reads as today.
- A plugin with an `https:` icon shows none - its name still shows, and the rule is one line in `pickIcon`.

## Resume state

- **Done so far:** tasks 01 to 03, the check by hand, and [implemented.md](implemented.md).
- **Next action:** none.
- **Watch out for:** nothing.

## Final verification checklist

- [x] `npx tsc -b`, `npx vitest run` and `pnpm build` pass.
- [x] By hand, on an isolated ahpd at `d41f318c` or later, light and dark: an icon, and none.
- [x] `plans/index.md` updated.
