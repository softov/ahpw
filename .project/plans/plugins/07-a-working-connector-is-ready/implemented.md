---
title: A working connector shows as ready - implemented
date: 2026-10-30
refs:
  - git://b3e1c26
  - "[code://src/bridges/connectors.ts](../../../../src/bridges/connectors.ts)"
  - "[code://src/resources/connectors/rows.ts](../../../../src/resources/connectors/rows.ts)"
  - "[code://src/resources/connectors/ConnectorPage.tsx](../../../../src/resources/connectors/ConnectorPage.tsx)"
---

ahpw reads the connector state `ready` in place of `open`, and shows it as "Ready", "Pronto" and "Listo".

## What was built

- [`code://src/bridges/connectors.ts`](../../../../src/bridges/connectors.ts) - `ConnectorState` and `CONNECTOR_STATES` name `ready`.
- [`code://src/resources/connectors/rows.ts`](../../../../src/resources/connectors/rows.ts) - the `DOT` key for `ready`.
- [`code://src/resources/connectors/ConnectorPage.tsx`](../../../../src/resources/connectors/ConnectorPage.tsx) - the `TONE` key and the note check for `ready`.
- [`code://src/i18n/en.json`](../../../../src/i18n/en.json) - `connectors.states.ready` in `en`, `pt` and `es`.

## Verified

- `pnpm -s typecheck` and `pnpm -s test` passed, with 105 files and 558 tests.
- `rows.test.ts` and `connectors.test.ts` use `ready`.
- No record shows a working connector against a live ahpd with plugin 62.

## Departures from the plan

- None.

## Left for later

- None.
