---
title: A connector page says it is signed in and what it serves - implemented
date: 2026-10-30
refs:
  - git://2068b61
  - "[code://src/bridges/connectors.ts](../../../../src/bridges/connectors.ts)"
  - "[code://src/resources/connectors/Models.tsx](../../../../src/resources/connectors/Models.tsx)"
  - "[code://src/resources/connectors/Overview.tsx](../../../../src/resources/connectors/Overview.tsx)"
  - "[code://src/resources/connectors/SignInStep.tsx](../../../../src/resources/connectors/SignInStep.tsx)"
---

A connector page shows the host's last check and the last failure.
A Models tab lists the models the connector serves, with a search field.
The sign-in step of a made connector says it is signed in, with Sign in again.

## What was built

- [`code://src/bridges/connectors.ts`](../../../../src/bridges/connectors.ts) - `ConnectorRow.health`, and `readConnectorModels` over `x-ahpd/connectors/models`.
- [`code://src/resources/connectors/Overview.tsx`](../../../../src/resources/connectors/Overview.tsx) - `healthFacts`: **Last check** and **Last failure**.
- [`code://src/resources/connectors/Models.tsx`](../../../../src/resources/connectors/Models.tsx) - the Models tab: the table, the search and Read again.
- [`code://src/resources/connectors/models.ts`](../../../../src/resources/connectors/models.ts) - `matches`, `perMillion` and `priceLine`.
- [`code://src/resources/connectors/ConnectorPage.tsx`](../../../../src/resources/connectors/ConnectorPage.tsx) - the Models tab beside Overview and Settings.
- [`code://src/resources/connectors/SignInStep.tsx`](../../../../src/resources/connectors/SignInStep.tsx) - the done state.
- [`code://src/shell/controls/CopyButton.tsx`](../../../../src/shell/controls/CopyButton.tsx) - the copy with its fallback, shared with the Models rows.
- [`code://docs/subjects/CONNECTORS.md`](../../../../docs/subjects/CONNECTORS.md) - the Models tab and the health facts.

## Verified

- `pnpm typecheck` and `pnpm test` passed. `models.test.ts` and `connectors.test.ts` test the price and the bridge.
- On a test host, at two widths, the Overview and the Models tab showed. The done sign-in step and a dimmed row were not seen.
- The checks by hand wait in [`plugins-09-sign-in-checks.md`](../../../pending/plugins-09-sign-in-checks.md), steps 10 to 12.

## Departures from the plan

- The Models tab shows only for a `ready` connector whose adapter has a `models` capability. The plan named the capability only.
- The plan was built with plugins 09 and merged in the same commit, as its answers say.

## Left for later

- None.
