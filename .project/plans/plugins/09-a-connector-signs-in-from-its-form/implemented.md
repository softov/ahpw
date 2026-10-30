---
title: A connector signs in from its form - implemented
date: 2026-10-30
refs:
  - git://2068b61
  - "[code://src/bridges/connectors.ts](../../../../src/bridges/connectors.ts)"
  - "[code://src/resources/connectors/SignInStep.tsx](../../../../src/resources/connectors/SignInStep.tsx)"
  - "[code://src/resources/connectors/form.ts](../../../../src/resources/connectors/form.ts)"
  - "[code://src/resources/log/wire.ts](../../../../src/resources/log/wire.ts)"
---

A connector form draws a sign-in button when the adapter row has `signIn`.
The button opens the provider's page, and the person pastes the code it shows.
The host makes or changes the connector with the key, and the form goes on as a save does.
A typed key still works.

## What was built

- [`code://src/bridges/connectors.ts`](../../../../src/bridges/connectors.ts) - `AdapterRow.signIn`, and `startSignIn` and `finishSignIn` over `x-ahpd/connectors/signin` and `signin-finish`.
- [`code://src/resources/connectors/form.ts`](../../../../src/resources/connectors/form.ts) - `configForSignIn`, which drops the field the host fills and sends another empty secret as `""`.
- [`code://src/resources/connectors/SignInStep.tsx`](../../../../src/resources/connectors/SignInStep.tsx) - the button and the code step.
- [`code://src/resources/connectors/ConnectorForm.tsx`](../../../../src/resources/connectors/ConnectorForm.tsx) - the step under the adapter's fields, which ends as a save does.
- [`code://src/resources/log/wire.ts`](../../../../src/resources/log/wire.ts) - `masked` hides the code of a sent `signin-finish`, and each config string of a sent `put` and `signin`.
- [`code://src/i18n/en.json`](../../../../src/i18n/en.json) - `connectors.signIn` in `en`, `pt` and `es`.
- [`code://docs/subjects/CONNECTORS.md`](../../../../docs/subjects/CONNECTORS.md) - a paragraph on the sign-in.

## Verified

- `pnpm -s typecheck`, `pnpm -s test` and `pnpm -s build` passed.
- `connectors.test.ts`, `form.test.ts` and `log.test.ts` test the two calls, `configForSignIn` and the mask.
- The checks by hand wait in [`plugins-09-sign-in-checks.md`](../../../pending/plugins-09-sign-in-checks.md).

## Departures from the plan

- None.

## Left for later

- None.
