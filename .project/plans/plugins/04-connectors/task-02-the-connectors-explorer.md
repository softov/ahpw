---
title: The host's connectors have a 🔌 explorer, grouped by kind, owner or state
status: done
depends: [task-01-a-connectors-bridge.md]
layer: "ahpw connectors"
refs:
  - "[code://src/resources/plugins/index.ts](../../../../src/resources/plugins/index.ts) - the registration this one copies"
  - "[code://src/resources/plugins/Explorer.tsx](../../../../src/resources/plugins/Explorer.tsx) - hosts, the channel on each, the notice ladder"
  - "[code://src/resources/plugins/provides.ts](../../../../src/resources/plugins/provides.ts) - `linkOf`, which gains `connectors`"
---

## Objective

While a host serves `x-ahpd-connectors`, a 🔌 entry after 🔣 opens the connectors explorer.
It lists each connector with its title, a state dot, and its id, kind and owner, grouped by kind by default.

## Files

- `CREATE: src/resources/connectors/index.ts` - `registerConnectors(scena)`, `CONNECTORS_SECTION`.
- `CREATE: src/resources/connectors/state.ts` - `CONNECTORS_SERVED`, `ACTIVE_CONNECTOR`, `CONNECTORS_GROUP`, `GROUP_KEY`, `connectorTab`.
- `CREATE: src/resources/connectors/Explorer.tsx` - the explorer.
- `CREATE: src/resources/connectors/rows.ts` - `connectorRows(entries, by, words)`.
- `CREATE: src/resources/connectors/rows.test.ts` - each grouping, the state dots, an owner's words.
- `UPDATE: src/resources/emojis.ts` - `connectors: mono('🔌')`, which `mcpServer` shares today.
- `UPDATE: src/resources/plugins/provides.ts` - `connectors` entries open the connectors section.
- `UPDATE: src/shell/register-shell.tsx` - the 🔌 item after 🔣, and `registerConnectors(scena)`.
- `UPDATE: src/i18n/en.json` - a `connectors` block.
- `UPDATE: src/i18n/es.json` - the same block.
- `UPDATE: src/i18n/pt.json` - the same block.

## Steps

1. Write `state.ts` as the plugins resource's.
2. Register `ConnectorsExplorer` with `+` for a new connector, reload, the Group menu and `HOST_FILTER_ACTION`.
3. Register the Group choice with values `kind`, `owner` and `state`, and `usual: 'kind'`.
4. Name a kind group by the kind's title, and a kind the host does not list by its name.
5. Name an owner as *Me*, *Team* and its id, or *The host*.
6. Order states as unavailable, invalid, open, and give them the `failed`, `attention` and `ok` dots.
7. Make a row's line its id, its kind's title and its owner, with the host's name first in multi mode.
8. Give a row the menu *Open* and *Delete*, Delete after a danger confirm.
9. Register `connectors.reload`, `ahp.showConnectors`, `ahp.openConnector` and `ahp.newConnector`.
10. Mount the explorer in `sidebar:left`, and the 🔌 item with `when: ${CONNECTORS_SERVED} == true`.
11. Link a plugin's connector kinds to `ahp.showConnectors`.

## Validation

- `src/resources/connectors/rows.test.ts`: kind, owner and state groupings; the dots; *Me* for the reader's own.
- `npx tsc -b` and `npx vitest run` pass.
- By hand, light and dark: the entry, the three groupings, the menu, and the plugin page's link.

## Resume

Done on 2026-10-22.
A row's line leaves out what its group already says: by kind it shows no kind, by owner no owner.
The owner words and the delete are in `src/resources/connectors/actions.ts`, shared with the page.
By hand on ahpd main in Chromium, light and dark: the 🔌 entry, the three groupings, the menu, and the plugin page's *Connector kinds* link.

