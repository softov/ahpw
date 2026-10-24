---
title: A plugin is turned on, turned off, configured and imported again while the host runs - implemented
date: 2026-10-23
refs:
  - git://f68b6c0
  - "[code://src/bridges/offers.ts](../../../../src/bridges/offers.ts)"
  - "[code://src/bridges/plugins.ts](../../../../src/bridges/plugins.ts)"
  - "[code://src/resources/plugins/actions.ts](../../../../src/resources/plugins/actions.ts)"
  - git://b27cb152 - ahpd main with PR 81, which this was checked against
---

A person imports a plugin's code again from its page or its row menu, with "Import again".
A person applies the configuration file from the plugins explorer.
Each plugin button has the host's description of its command as its tooltip.
Enable, disable and an option apply at once, and the restart note shows only when the host marks its root.

## What was built

- [`code://src/bridges/offers.ts`](../../../../src/bridges/offers.ts) - `Offers.described`, each method's description from `ahpd.methods`.
- [`code://src/bridges/plugins.ts`](../../../../src/bridges/plugins.ts) - `reloadPlugin` and `applyPlugins`, and comments that say each command applies at once.
- [`code://src/resources/plugins/actions.ts`](../../../../src/resources/plugins/actions.ts) - `reloadOne`, `applyAll`, `mayReload` and `saidOf`.
- [`code://src/resources/plugins/PluginPage.tsx`](../../../../src/resources/plugins/PluginPage.tsx) and [`code://src/resources/plugins/Explorer.tsx`](../../../../src/resources/plugins/Explorer.tsx) - "Import again", and the host's tooltips on it and on the toggle.
- [`code://src/resources/plugins/index.ts`](../../../../src/resources/plugins/index.ts) - the explorer's apply action, shown when a host offers `x-ahpd/plugins/apply`.

## Verified

- `npx tsc -b`, `pnpm build` and `npx vitest run` (104 files, 551 tests) pass on 2026-10-23.
- By hand in headless Chromium on ahpd main `b27cb152`: disable, enable and "Import again" apply at once, with no restart note.
- By hand: apply loaded a package plugin newly added to the configuration file.
- By hand: "Import again" and the toggle show the host's descriptions as tooltips.
- Not checked by hand: an option on this ahpd, and a reply with `restart: true`, since no configured plugin holds a port or a URI scheme.

## Departures from the plan

- none.

## Left for later

- none.
