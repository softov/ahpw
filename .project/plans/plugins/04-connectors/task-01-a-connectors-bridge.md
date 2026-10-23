---
title: A connectors bridge reads kinds and connectors, and makes and removes connectors
status: done
depends: []
layer: "ahpw bridges"
refs:
  - "[code://src/bridges/plugins.ts](../../../../src/bridges/plugins.ts) - a records channel whose types are written in ahpw"
  - file:///github/ahpd/packages/sdk/src/connectors/channel.ts - `kindRow`, `connectorRow`, `put` and `remove`
---

## Objective

`src/bridges/connectors.ts` holds the channel, the kind and connector types, the split of its rows, and the put and remove commands.

## Files

- `CREATE: src/bridges/connectors.ts` - `CONNECTORS`, `ConnectorKindRow`, `ConnectorRow`, `ConnectorOwner`, `connectorsReducer`, `servesConnectors`, `splitRows`, `putConnector`, `removeConnector`, `isSecretRef`.
- `CREATE: src/bridges/connectors.test.ts` - the split, the commands' params, and a secret reference.

## Steps

1. Define `CONNECTORS = { scheme: 'x-ahpd-connectors', channel: 'x-ahpd-connectors://', put: 'x-ahpd/connectors/put', remove: 'x-ahpd/connectors/remove' } as const`.
2. Write `ConnectorKindRow` as `kindRow` answers it, and `ConnectorRow` as `connectorRow` answers it.
3. Write `connectorsReducer = recordsReducer<ConnectorKindRow | ConnectorRow>(CONNECTORS.scheme)`.
4. Write `splitRows(records)`, which answers the kinds, by the `kind:` id prefix, and the connectors.
5. Write `putConnector(host, { id, kind, owner, title?, config })`, which answers the row.
6. Write `removeConnector(host, id)`.
7. Write `isSecretRef(value)`, true for `{ $secret: string }`.
8. Check each answer's shape, and throw with the command's name when it is wrong.

## Validation

- `src/bridges/connectors.test.ts`: the split; put and remove params; a bad answer throws; a secret reference.
- `npx tsc -b` and `npx vitest run` pass.

## Resume

Done on 2026-10-22.
The bridge also exports `KIND_PREFIX`, `CONNECTOR_STATES` and `ConnectorWanted`.
A put leaves an empty title out of its params.

