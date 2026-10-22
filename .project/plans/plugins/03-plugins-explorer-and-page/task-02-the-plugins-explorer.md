---
title: The host's plugins have an explorer, grouped by state or by category, and a 🔣 entry
status: done
depends: [task-01-a-plugins-bridge.md]
layer: "ahpw plugins"
refs:
  - "[code://src/resources/policies/index.ts#L68-L116](../../../../src/resources/policies/index.ts#L68-L116) - served, `registerChoice`, the explorer, reload, show and open commands, the sidebar mount"
  - "[code://src/resources/computers/Explorer.tsx](../../../../src/resources/computers/Explorer.tsx) - hosts, `useChannelOnEach`, rows, and the notice ladder"
  - "[code://src/shell/register-shell.tsx#L288-L293](../../../../src/shell/register-shell.tsx#L288-L293) - the activity bar item"
  - "[code://src/shell/explorer/ExplorerList.tsx#L12-L30](../../../../src/shell/explorer/ExplorerList.tsx#L12-L30) - `Row`, with `group`"
---

## Objective

While a host serves `x-ahpd-plugins`, a 🔣 entry opens the plugins explorer.
It lists each plugin with its title, a state dot, its id and its categories, grouped by state by default or by category.

## Files

- `CREATE: src/resources/plugins/index.ts` - `registerPlugins(scena)`, `PLUGINS_SECTION`.
- `CREATE: src/resources/plugins/state.ts` - `PLUGINS_SERVED`, `ACTIVE_PLUGIN`, `PLUGINS_GROUP`, `GROUP_KEY`, `pluginTab`.
- `CREATE: src/resources/plugins/Explorer.tsx` - the explorer.
- `CREATE: src/resources/plugins/rows.ts` - `pluginRows(entries, by, words)`, the rows and their groups.
- `CREATE: src/resources/plugins/rows.test.ts` - the state order, a plugin under each of its categories, *Other*.
- `UPDATE: src/resources/emojis.ts` - `hostPlugins: mono('🔣')`.
- `UPDATE: src/shell/register-shell.tsx:288-293` - the 🔣 activity bar item, after policies, and `registerPlugins(scena)`.
- `UPDATE: src/i18n/en.json` - a `plugins` block: the explorer, the states, the categories, the notices.
- `UPDATE: src/i18n/es.json` - the same block.
- `UPDATE: src/i18n/pt.json` - the same block.

## Steps

1. Write `state.ts` with `PLUGINS_SERVED = '$/ahp/plugins/served'` and the other paths, as `policies/state.ts` does.
2. Register `PluginsExplorer` with the reload action, the Group menu action and `HOST_FILTER_ACTION`.
3. Register the Group choice with values `state` and `category`, and `usual: 'state'`.
4. Order states as error, missing, incompatible, unconfigured, ready, disabled.
5. Give error and missing the `failed` dot, incompatible and unconfigured `attention`.
6. Give ready the `ok` dot, and disabled `off`.
7. By category, put a plugin under each category its manifest names, and under *Other* when it names none.
8. Make a row's lines its id and its categories, and its problem when it has one.
9. Prefix the first line with the host's name in multi mode.
10. Give a row the menu *Open*, and *Enable* or *Disable* when the host offers the command.
11. Register `plugins.reload`, `ahp.showPlugins` and `ahp.openPlugin`, as the policies resource does.
12. Mount the explorer in `sidebar:left`, and the 🔣 item with `when: ${PLUGINS_SERVED} == true`.

## Validation

- `src/resources/plugins/rows.test.ts`: the state order; a two-category plugin in both groups; *Other*.
- `npx tsc -b` and `npx vitest run` pass.
- By hand, light and dark: the entry, both groupings, the menu, and a reader without `config:read` seeing no entry.

## Resume

Done on 2026-10-22.
ahpd lists `x-ahpd-plugins` in `ahpd.channels` to every reader, with the grant beside it.
So a reader without `config:read` sees 🔣, and the list shows the host's refusal in its words.
Hiding the entry needs the reader's grants, which `x-ahpd/me` answers.
A channel's error and a failure toast now drop the client's `RPC error <code>:` everywhere, through `hostSaid`.
Only ahpd's five categories are translated; any other shows as the plugin wrote it.
Checked in Chromium on ahpd main at port 9199, light and dark, by state and by category.
