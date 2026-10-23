---
title: A connector's page shows what it is and whether it is open, and changes or deletes it
status: done
depends: [task-03-the-connector-form.md]
layer: "ahpw connectors"
refs:
  - "[code://src/resources/plugins/PluginPage.tsx](../../../../src/resources/plugins/PluginPage.tsx) - the head and the tabs"
  - file:///github/opendoop/packages/web-next/src/resources/connectors/Detail.tsx - Overview, and Settings reusing the form
---

## Objective

`ahp.openConnector { host, id }` opens a connector's page: a head with its title, id and state, Delete, and Overview and Settings tabs.
Settings is the form with the kind and id fixed, and Save.

## Files

- `CREATE: src/resources/connectors/ConnectorPage.tsx` - the head, Delete and the tabs.
- `CREATE: src/resources/connectors/Overview.tsx` - the kind, its plugin, the owner, the state and the capabilities.
- `UPDATE: src/resources/connectors/ConnectorForm.tsx` - the edit mode: kind and id read-only, Save.
- `UPDATE: src/i18n/en.json` - `connectors/page/*`.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Render the head as the plugin page's, with a `Badge` toned by state.
2. Say what `invalid` and `unavailable` mean under the head when the connector is in one.
3. Show the kind's title and description, and its plugin as a link to `ahp.openPlugin`.
4. Show the owner in words, and the capabilities by type, with their titles and descriptions.
5. Render Settings as `ConnectorForm` with the connector, its kind and id read-only.
6. Show a secret field as kept, with a hint that a new value replaces it.
7. Delete after a danger confirm, then close the page.

## Validation

- `npx tsc -b`, `npx vitest run` and `npm run build` pass.
- By hand: change a field and save; the host keeps the secret; the state stays `open`.
- By hand: delete the connector; the page closes and the row goes.
- By hand, light and dark: the head, Overview and Settings.

## Resume

Done on 2026-10-22.
In edit mode the form draws only the title and owner; the head shows the kind and id.
A capability's type is a `Badge`.
The tab keeps the title the connector had when it opened; a rename shows in the head and the list.
By hand: a title change saved, the vault reference kept, the state stayed open; Delete closed the page and took the record off the host.

