---
title: A connector is made on one form whose first field picks its kind
status: done
depends: [task-02-the-connectors-explorer.md]
layer: "ahpw connectors"
refs:
  - file:///github/opendoop/packages/web-next/src/resources/connectors/Form.tsx - the type select over the type's own schema, the type change that clears it
  - "[code://src/bridges/people.ts](../../../../src/bridges/people.ts) - `selfId` and `readOwnUser`, the person and their teams"
  - "[code://src/resources/users/memberships.ts](../../../../src/resources/users/memberships.ts) - `membershipParts`, a membership's team"
---

## Objective

`ahp.newConnector { host }` opens a form page: kind, id, title and owner on top, the kind's own fields below, and Create.
Create puts the connector and opens its page.

## Files

- `CREATE: src/resources/connectors/ConnectorForm.tsx` - `ConnectorForm({ host, connector? })`, for a new connector and for Settings.
- `CREATE: src/resources/connectors/NewConnectorPage.tsx` - the page around the form.
- `CREATE: src/resources/connectors/form.ts` - `topSchema(kinds, owners, editing)`, `ownerChoices(principal, user)`, `configForPut(config, schema)`.
- `CREATE: src/resources/connectors/form.test.ts` - the top schema, the owner choices, and a kept secret.
- `UPDATE: src/style/app.css` - `.web-connector-form`.
- `UPDATE: src/i18n/en.json` - `connectors/form/*`.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Build the top schema: `kind` as an enum of kind names, labelled by their titles in `x-enumOptions`.
2. Add `id` as a slug pattern, `title` as a string, and `owner` as an enum of the owner choices.
3. Offer *Me* for `user:<id>`, each team of the person's memberships, and *The host*.
4. Leave *Me* and the teams out for a `root:` connection, which has no record.
5. Draw the kind's `schema` as a second `SchemaForm`, under its description.
6. Clear the kind's fields when the kind changes on a new connector, and suggest the id from the kind.
7. Say there are no kinds to pick when the host lists none to this reader.
8. Send a secret field left empty as an empty string, so the host keeps what it stores.
9. Call `putConnector`, show a refusal with `hostSaid`, and on success open the connector's page.

## Validation

- `src/resources/connectors/form.test.ts`: the top schema; the owners for a person and for root; an empty secret sent as `""`.
- `npx tsc -b` and `npx vitest run` pass.
- By hand: make a webhook for a bot; a bad field shows the host's words; the page opens.

## Resume

Done on 2026-10-22.
scena's `SchemaForm` has no `writeOnly` and checks no `pattern`.
So `kindSchema` draws a secret as a password, and `ID_PATTERN` is ahpd's slug rule, checked before Create.
A new form starts on the first kind, because the select shows the first option while its value is empty.
The owner choices follow ahpd's owner rule: teams with `team:write`, the host with `config:write`, through `*:*`, `*:<operation>` and `<subject>:*`.
The kind's description shows only when its schema has none, since the form already shows the schema's.
By hand: a webhook for `bot://helper` owned by me, and one for an automation owned by a team; each opened.

