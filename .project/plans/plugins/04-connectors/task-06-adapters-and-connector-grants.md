---
title: Adapters come from their own channel, and the form offers the owners ahpd's connector grants allow
status: done
depends: [task-04-a-connectors-page.md]
layer: "ahpw connectors"
refs:
  - file:///github/ahpd/packages/sdk/src/connectors/adapters.ts - `x-ahpd-adapters`, keyed by name, read with `connector:list`, at main 13b19150
  - file:///github/ahpd/packages/sdk/src/connectors/channel.ts - connector rows only, the `adapter` field, `ownerAllows` and `mayRead`
---

## Objective

ahpw reads adapters from `x-ahpd-adapters` and connectors from `x-ahpd-connectors`, and says "adapter" where it said "kind".
The form offers only the owners ahpd's connector grants allow.

## Files

- `UPDATE: src/bridges/connectors.ts` - `ADAPTERS`, `AdapterRow`, `adaptersReducer`, `servesAdapters`; `ConnectorRow.adapter`; no `splitRows`.
- `UPDATE: src/resources/connectors/rows.ts` - the `adapter` grouping, and *No adapter* for a record from before the split.
- `UPDATE: src/resources/connectors/form.ts` - `holds`, and `ownerChoices` by `connector:put`, `connector:host` and membership.
- `UPDATE: src/resources/connectors/ConnectorForm.tsx` - both channels, and a note for no adapters or no `connector:put`.
- `UPDATE: src/resources/connectors/Explorer.tsx` - both channels.
- `UPDATE: src/resources/connectors/ConnectorPage.tsx` - the adapter, and a note for a record that names none.
- `UPDATE: src/resources/connectors/Overview.tsx` - the adapter.
- `UPDATE: src/resources/plugins/provides.ts` - the contract key `adapters`.
- `UPDATE: src/i18n/en.json` - the adapter words and the connector grants.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Read adapters from `x-ahpd-adapters` and connectors from `x-ahpd-connectors`.
2. Send `adapter` on a put, and read it on a row.
3. Offer owners only with `connector:put`: the person, each team they are on, and the host with `connector:host`.
4. Say so when the host lists no adapters, or the person may not make a connector.
5. Show a record with no `adapter` field as one from before the split, to delete and make again.
6. Say "adapter" in every word and in the plugin page's *Provides*.

## Validation

- `npx tsc -b` and `npx vitest run` pass.
- By hand on ahpd main at 13b19150: an old record reads *No adapter*.
- By hand: a new webhook stores `adapter`, and the plugin page links *Adapters*.

## Resume

Done on 2026-10-22.
By hand, ana made a webhook that stored `adapter: "webhook"`, with its secret in the vault.
The record from before the split read as unavailable, under *No adapter*, with its own note.
ahpd still lists both channels to a reader without `connector:list`, so bob sees 🔌 and a refusal in ahpd's words; task 05 asks ahpd about it.
