---
title: A plugin's icon in its row and its head
status: done
depends: [task-01-pick-and-draw-an-icon.md]
layer: "ahpw plugins"
refs:
  - "[code://src/bridges/plugins.ts#L46-L53](../../../../src/bridges/plugins.ts#L46-L53) - `PluginManifest`"
  - "[code://src/resources/plugins/rows.ts](../../../../src/resources/plugins/rows.ts) - the explorer rows"
  - "[code://src/resources/plugins/PluginPage.tsx#L45](../../../../src/resources/plugins/PluginPage.tsx#L45) - the head"
---

## Objective

A plugin with an icon shows it on its row and in place of 🔣 on its page.

## Files

- `UPDATE: src/bridges/plugins.ts:46-53` - `icons` on `PluginManifest`.
- `UPDATE: src/resources/plugins/rows.ts` - `icons` on each row.
- `UPDATE: src/resources/plugins/rows.test.ts` - a row carries its manifest's icons.
- `UPDATE: src/resources/plugins/PluginPage.tsx` - `HostIcon` in the head, with 🔣 as its fallback.

## Steps

1. Add `icons?: Icon[]` to `PluginManifest`.
2. Set `icons` on each row from `row.manifest?.icons`.
3. Draw the head's icon with `HostIcon`, and fall back to 🔣.

## Validation

- `src/resources/plugins/rows.test.ts` passes.
- `npx tsc -b` and `npx vitest run` pass.

## Resume

