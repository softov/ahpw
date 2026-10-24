---
title: An icon is picked and drawn, and a row keeps its dot as a badge
status: done
depends: []
layer: "ahpw shell"
refs:
  - "[code://src/shell/explorer/ExplorerList.tsx#L12-L30](../../../../src/shell/explorer/ExplorerList.tsx#L12-L30) - `Row` and its group"
  - "[code://src/resources/bots/Bood.tsx#L73](../../../../src/resources/bots/Bood.tsx#L73) - the scheme a drawing follows"
  - "[code://src/style/app.css#L1094-L1117](../../../../src/style/app.css#L1094-L1117) - the dot and the row icon"
---

## Objective

`pickIcon` chooses the icon for the scheme shown, and `HostIcon` draws it as an `<img>`.
A row with `icons` draws the icon with its dot as a badge, and a group with `icons` draws one before its label.

## Files

- `CREATE: src/bridges/icons.ts` - `pickIcon(icons, scheme)`, which answers a `data:` icon or nothing.
- `CREATE: src/bridges/icons.test.ts` - the theme order, an icon with no theme, a URL refused, an empty list.
- `CREATE: src/shell/HostIcon.tsx` - `HostIcon`, an `<img>` of the picked icon at a size, or its fallback.
- `UPDATE: src/shell/explorer/ExplorerList.tsx:12-30` - `Row.icons` and `group.icons`, drawn with `HostIcon`.
- `UPDATE: src/style/app.css:1094-1117` - the row's icon with its badge, and a group's icon.

## Steps

1. Write `pickIcon`: the `theme` of the scheme, then no `theme`, then any; skip a `src` that is not `data:`.
2. Write `HostIcon` with `alt=""`, `draggable={false}` and the scheme from `THEME_MODE_PATH`.
3. Add `icons` to `Row` and to its `group`, and draw them in `ExplorerList` when `icon` is not set.
4. Draw the row's dot as a badge on the icon's lower corner, with the same `data-dot` and label.
5. Style the badge with a ring in the row's background, so it reads on any icon.

## Validation

- `src/bridges/icons.test.ts` passes.
- `npx tsc -b` and `npx vitest run` pass.

## Resume

