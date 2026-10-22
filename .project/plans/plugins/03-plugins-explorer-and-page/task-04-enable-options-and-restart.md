---
title: A plugin is enabled, disabled and configured from its page, and the page says when the host needs a restart
status: done
depends: [task-03-a-plugins-page-and-overview.md]
layer: "ahpw plugins"
refs:
  - "[code://src/resources/host/Settings.tsx#L35-L80](../../../../src/resources/host/Settings.tsx#L35-L80) - the root config's schema and values, and the save"
  - "[code://src/bridges/said.ts](../../../../src/bridges/said.ts) - `hostSaid`, a refusal in the host's words"
  - file:///github/ahpd/packages/server/src/rootconfig.ts - `plugins.<id>`: `{ enabled, options }`; `null` removes an option; `<set>` keeps a secret
---

## Objective

The header has *Enable* or *Disable*, and the Options tab has a form of the plugin's options with Save.
While the host says a restart is needed, a note says so on the page and on the explorer's rows.

## Files

- `CREATE: src/resources/plugins/Options.tsx` - the Options tab.
- `UPDATE: src/resources/plugins/PluginPage.tsx` - *Enable* and *Disable*, and the restart note.
- `UPDATE: src/resources/plugins/Explorer.tsx` - the restart note above the list.
- `UPDATE: src/i18n/en.json` - `plugins/options/*`, `plugins/actions/*`, `plugins/restart`.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Show *Disable* for an enabled plugin and *Enable* for a disabled one, when the host offers the command.
2. Call `enablePlugin` or `disablePlugin`, then refresh the plugins channel.
3. Show a refusal with `hostSaid`, in an `Alert` under the header.
4. Read `plugins.<id>` from the root channel's `config.schema` and `config.values`.
5. Draw its `options` property as a `SchemaForm`, with the held values.
6. Say the plugin must load first when its options schema is empty.
7. Save as `root/configChanged` with `{ 'plugins.<id>': { options } }`, as the settings window saves.
8. Keep a secret shown as `<set>` unless the person types a new value.
9. Read `restartNeeded` from the root state, and show the note while it is true.

## Validation

- `npx tsc -b`, `npx vitest run` and `npm run build` pass.
- By hand: Disable and Enable a plugin; the note shows; the host's config file changes.
- By hand: change an option and save; a bad value shows the host's refusal.
- By hand: a reader without `config:write` sees the host's refusal, not an error.
- By hand, light and dark: the form, the actions and the note.

## Resume

Done on 2026-10-22.
An enable or a disable answers `restart: true`, but ahpd marks the root only for a settings change.
So `restartPath(host)` is set from the answer and from an options save, beside the root's own mark.
Checked by hand: push enabled and disabled again in the config file, and Bot's `lastChats` saved as 15, `root` kept.
