---
title: The connector state ready is read and drawn
status: implemented
depends: []
layer: "ahpw connectors"
refs:
  - "[code://src/bridges/connectors.ts#L73-L75](../../../../src/bridges/connectors.ts#L73-L75) - `ConnectorState` and `CONNECTOR_STATES`"
  - "[code://src/resources/connectors/ConnectorPage.tsx#L15](../../../../src/resources/connectors/ConnectorPage.tsx#L15) - `TONE`"
  - "[code://src/resources/connectors/rows.ts#L11](../../../../src/resources/connectors/rows.ts#L11) - `DOT`"
---

## Objective

ahpw reads `state: 'ready'` on a connector row and labels it "Ready", "Pronto" and "Listo".

## Files

- `UPDATE: src/bridges/connectors.ts:73-75` - `ConnectorState` and `CONNECTOR_STATES` say `ready` in place of `open`.
- `UPDATE: src/resources/connectors/ConnectorPage.tsx` - `TONE` and the note check read `ready`.
- `UPDATE: src/resources/connectors/rows.ts` - `DOT` reads `ready`.
- `UPDATE: src/resources/connectors/rows.test.ts` - the rows and the expected groups say `ready`.
- `UPDATE: src/bridges/connectors.test.ts` - the rows say `ready`.
- `UPDATE: src/i18n/en.json` - `connectors.states.ready` is "Ready", and `connectors.states.open` goes.
- `UPDATE: src/i18n/pt.json` - `connectors.states.ready` is "Pronto", and `connectors.states.open` goes.
- `UPDATE: src/i18n/es.json` - `connectors.states.ready` is "Listo", and `connectors.states.open` goes.

## Steps

1. Change `ConnectorState` to `'ready' | 'invalid' | 'unavailable'`.
2. Change the last item of `CONNECTOR_STATES` to `ready`.
3. Change the `open` keys of `TONE` and `DOT` to `ready`.
4. Change the note check in `ConnectorPage.tsx` to `row.state === 'ready'`.
5. Replace `connectors.states.open` with `connectors.states.ready` in each catalog.
6. Change each test row and expected group from `open` to `ready`.
7. Keep `connectors.actions.open`, because it is the verb on the button.

## Validation

- The catalog test passes, so each locale has `connectors.states.ready`.
- `pnpm -s typecheck && pnpm -s test` passes.
- A working connector shows "Pronto" in ahpw against an ahpd with plugin 62.

## Resume

- Changed `ConnectorState` and `CONNECTOR_STATES` to `ready` in `src/bridges/connectors.ts`.
- Changed the comment that names the state there, and the one on the grouping in `rows.ts`.
- Changed the `TONE` key and the note check in `ConnectorPage.tsx`, and the `DOT` key in `rows.ts`.
- Changed `connectors.states.open` to `connectors.states.ready` in `en.json`, `pt.json` and `es.json`.
- Changed the test rows and the expected group in `rows.test.ts` and `connectors.test.ts`.
- Kept `connectors.actions.open`, the verb on the button.
- `pnpm -s typecheck` and `pnpm -s test` pass, with 105 files and 558 tests.
- Left: a working connector against a live ahpd with plugin 62 shows "Pronto".
