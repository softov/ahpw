---
title: The page shows the health and the models
status: implemented
depends: []
layer: "bridge, connectors, i18n, docs"
refs:
  - "[code://src/resources/connectors/Models.tsx](../../../../src/resources/connectors/Models.tsx) - the Models tab"
  - "[code://src/bridges/connectors.ts](../../../../src/bridges/connectors.ts) - `health` and `readConnectorModels`"
---

## Objective

The connector page shows the last check and the last failure, and a Models tab lists what a provider connector serves.
After a sign-in on a made connector, the sign-in step says it is signed in and offers to sign in again.

## Files

- `UPDATE: src/bridges/connectors.ts` - adds `ConnectorRow.health`, `CONNECTORS.models`, `ConnectorModel`, `ConnectorModels` and `readConnectorModels`.
- `UPDATE: src/bridges/connectors.test.ts` - the models call and an answer with no list.
- `CREATE: src/resources/connectors/models.ts` - the search and the price per million tokens.
- `CREATE: src/resources/connectors/models.test.ts` - the search and the price.
- `CREATE: src/resources/connectors/Models.tsx` - the tab: search, count, read time, Read again, and the table.
- `UPDATE: src/resources/connectors/ConnectorPage.tsx` - adds the Models tab for a ready connector whose adapter has a `models` capability.
- `UPDATE: src/resources/connectors/state.ts` - the tab key `models`.
- `UPDATE: src/resources/connectors/Overview.tsx` - the health facts, `models` in `KNOWN_TYPES`, and the shared copy.
- `UPDATE: src/resources/connectors/SignInStep.tsx` - the done state and Sign in again.
- `UPDATE: src/resources/connectors/ConnectorForm.tsx` - passes the provider, and a made connector's sign-in no longer says "Saved.".
- `UPDATE: src/shell/controls/CopyButton.tsx` - exports `copyText`, the copy with its fallback.
- `UPDATE: src/style/app.css` - the done note and the models table.
- `UPDATE: src/i18n/en.json` - the new strings.
- `UPDATE: src/i18n/es.json` - the new strings.
- `UPDATE: src/i18n/pt.json` - the new strings.
- `UPDATE: docs/subjects/CONNECTORS.md` - the Models tab, the health facts and the done sign-in step.

## Steps

1. Add the health and the models types and the models call to the bridge.
2. Export `copyText` from `CopyButton.tsx`, and copy with it in the capability row.
3. Add the health facts and the `models` type to the Overview.
4. Add the Models tab and its helpers.
5. Give the sign-in step its done state.
6. Add the strings in EN, ES and PT, and the docs.

## Validation

- Run `pnpm typecheck` and `pnpm test`.
- Open an OpenRouter connector on a test host, at 1280 and 420 pixels, light and dark.

## Resume

Built on 2026-10-28. Typecheck and all tests pass. The page was checked on a test host, except the done sign-in step and a dimmed row.
