---
title: Import again and apply, with the host's tooltips
status: done
depends: [task-01-descriptions-and-requests.md]
layer: "ahpw plugins"
refs:
  - "[code://src/resources/plugins/actions.ts](../../../../src/resources/plugins/actions.ts) - `togglePlugin`, the pattern for a command"
  - "[code://src/resources/plugins/Explorer.tsx#L44-L54](../../../../src/resources/plugins/Explorer.tsx#L44-L54) - the row menu"
  - "[code://src/resources/plugins/index.ts#L56-L68](../../../../src/resources/plugins/index.ts#L56-L68) - the explorer's actions"
  - "[code://src/resources/automations/index.ts#L50](../../../../src/resources/automations/index.ts#L50) - an action with a `when`"
---

## Objective

A plugin's page and row menu offer "Import again".
The explorer offers "Apply the configuration".
Each button and menu entry shows the host's description as its tooltip.

## Files

- `UPDATE: src/resources/plugins/actions.ts` - `mayReload`, `reloadOne`, `applyAll`.
- `UPDATE: src/resources/plugins/PluginPage.tsx` - the "Import again" button, and the tooltips.
- `UPDATE: src/resources/plugins/Explorer.tsx` - "Import again" in the row menu, and the tooltips.
- `UPDATE: src/resources/plugins/index.ts` - the `plugins.apply` command and the explorer's action.
- `UPDATE: src/resources/plugins/state.ts` - the store path that says a shown host offers `apply`.
- `UPDATE: src/i18n/en.json` - `plugins/actions/reimport`, `reimportFailed`, `apply`, `applyFailed`.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Add `reloadOne(host, id)` and `applyAll(hosts)`, which read again after the command and report a refusal.
2. Show "Import again" on the page and in the row menu when the host offers `reload`.
3. Register `plugins.apply`, which runs `apply` on each shown host that offers it.
4. Show the explorer's action only when a shown host offers `apply`.
5. Set each button's `title` to the host's description of its command.

## Validation

- `npx tsc -b` and `npx vitest run` pass.
- By hand, check that a button shows only when the host offers its command.

## Resume
