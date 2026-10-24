---
title: A plugin's and an adapter's own icon, in their lists and on their pages - implemented
date: 2026-10-23
refs:
  - git://f68b6c0
  - "[code://src/bridges/icons.ts](../../../../src/bridges/icons.ts)"
  - "[code://src/shell/HostIcon.tsx](../../../../src/shell/HostIcon.tsx)"
  - "[code://src/shell/explorer/ExplorerList.tsx](../../../../src/shell/explorer/ExplorerList.tsx)"
---

A plugin or an adapter that carries an icon shows it in ahpw.
The icon is on its row, its group heading, its page head, the connector Overview and the connector form.
A row keeps its state as a dot on the icon's corner.
The icon follows the light or dark scheme shown, also when the system scheme changes.

## What was built

- [`code://src/bridges/icons.ts`](../../../../src/bridges/icons.ts) - `pickIcon`: the scheme's icon, then one with no theme, then any; only a `data:image/` source.
- [`code://src/shell/HostIcon.tsx`](../../../../src/shell/HostIcon.tsx) - `useScheme`, `useHostIcon`, `HostIcon` as an `<img>`, and `PageTitle` for a page head.
- [`code://src/shell/explorer/ExplorerList.tsx`](../../../../src/shell/explorer/ExplorerList.tsx) - `icons` on a row and a group; the row's dot becomes a badge.
- [`code://src/resources/plugins/rows.ts`](../../../../src/resources/plugins/rows.ts) - a plugin row carries its manifest's icons.
- [`code://src/resources/connectors/rows.ts`](../../../../src/resources/connectors/rows.ts) - a connector row and an adapter group carry the adapter's icons.
- [`code://src/resources/plugins/PluginPage.tsx`](../../../../src/resources/plugins/PluginPage.tsx) and [`code://src/resources/connectors/ConnectorPage.tsx`](../../../../src/resources/connectors/ConnectorPage.tsx) - the icon in place of 🔣 or 🔌.
- [`code://src/resources/connectors/Overview.tsx`](../../../../src/resources/connectors/Overview.tsx) and [`code://src/resources/connectors/ConnectorForm.tsx`](../../../../src/resources/connectors/ConnectorForm.tsx) - the icon before the adapter's title.

## Verified

- `npx tsc -b`, `pnpm build` and `npx vitest run` (104 files, 551 tests) pass on 2026-10-23.
- The icon tests are `icons.test.ts` and the icon cases in both `rows.test.ts` files.
- By hand in headless Chromium on ahpd main `b27cb152`, light and dark: a plugin with icons and a plugin with none.
- By hand: a connector shows its adapter's icon on its row, its group, its head, its Overview and the form.
- By hand: with the mode on `system`, a change of the system scheme changes the icon at once.

## Departures from the plan

- Task 02 - the Overview does not list `iconProblems`, because an icon problem goes only to the daemon's log by design (Softov, 2026-10-23).
- Task 01 - the scheme comes from `useScheme`, which also follows the system scheme; `resolveThemeMode` alone does not render again when it changes.

## Left for later

- An `https:` icon shows none until ahpd fetches it at load and sends it as a `data:` URI; ahpw keeps drawing `data:image/` only.
