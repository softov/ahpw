---
title: A plugins bridge reads the host's plugins and enables, disables and sets them
status: done
depends: []
layer: "ahpw bridges"
refs:
  - "[code://src/bridges/people.ts#L53](../../../../src/bridges/people.ts#L53) - `recordsReducer`, the fold this channel uses"
  - "[code://src/bridges/tokens.ts](../../../../src/bridges/tokens.ts) - a bridge of `x-ahpd/*` commands with answers checked"
  - "[code://src/resources/bots/catalogue.ts](../../../../src/resources/bots/catalogue.ts) - a record type written in ahpw because the package that owns it reads `node:fs`"
  - file:///github/ahpd/packages/server/src/pluginschannel.ts - `rowOf`, the row, and the three commands' params and answers
---

## Objective

`src/bridges/plugins.ts` holds the plugins channel, the row's type, and the enable and disable commands.
It also reads `ahpd.restartNeeded` from the root state.

## Files

- `CREATE: src/bridges/plugins.ts` - `PLUGINS`, `PluginRow`, `PluginState`, `pluginsReducer`, `servesPlugins`, `enablePlugin`, `disablePlugin`, `restartNeeded`.
- `CREATE: src/bridges/plugins.test.ts` - the fold, the commands' params, and `restartNeeded`.

## Steps

1. Define `PLUGINS = { scheme: 'x-ahpd-plugins', channel: 'x-ahpd-plugins://', enable: 'x-ahpd/plugins/enable', disable: 'x-ahpd/plugins/disable', options: 'x-ahpd/plugins/options' } as const`.
2. Define `PluginState` as ahpd's six states, and `PluginRow` as `rowOf` answers it, with `PluginManifest` from `@ahpd/sdk`.
3. Write `pluginsReducer = recordsReducer<PluginRow>(PLUGINS.scheme)`.
4. Write `servesPlugins(offers)` as `offers.channels.includes(PLUGINS.scheme)`.
5. Write `enablePlugin(host, id)` and `disablePlugin(host, id)`, which answer `{ id, enabled, restart }`.
6. Write `restartNeeded(root)`, true when the root state's `_meta` holds `ahpd.restartNeeded`.
7. Check each answer's shape, and throw with the command's name when it is wrong.

## Validation

- `src/bridges/plugins.test.ts`: added, changed and removed fold; each command's params; a bad answer throws; `restartNeeded` on and off.
- `npx tsc -b` and `npx vitest run` pass.

## Resume

Done on 2026-10-22.
The channel came after ahpd 0.13, so `@ahpd/sdk` has no `PluginManifest`; the bridge writes the row and the manifest.
`specEnabled(spec)` was added, since the page and the menu ask whether a plugin is on.
