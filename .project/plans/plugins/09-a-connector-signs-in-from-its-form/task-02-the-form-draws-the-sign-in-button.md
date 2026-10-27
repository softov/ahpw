---
title: The form draws the sign-in button
status: todo
depends: [task-01-the-bridge-signs-in.md]
layer: "connectors screen, catalogs, docs"
refs:
  - "[code://src/resources/connectors/ConnectorForm.tsx#L120-L139](../../../../src/resources/connectors/ConnectorForm.tsx#L120-L139) - `save`, whose answer handling the sign-in shares"
  - "[code://src/resources/connectors/ConnectorForm.tsx#L152-L159](../../../../src/resources/connectors/ConnectorForm.tsx#L152-L159) - the adapter's section, where the button goes under the `SchemaForm`"
  - "[code://src/resources/folders/NameDialog.tsx#L58-L66](../../../../src/resources/folders/NameDialog.tsx#L58-L66) - scena's `TextField`, used with `type=\"password\"` for the code"
  - "[code://src/resources/log/LogPage.tsx#L26](../../../../src/resources/log/LogPage.tsx#L26) - how ahpw opens an outside page"
  - "[code://src/i18n/en.json#L2438-L2455](../../../../src/i18n/en.json#L2438-L2455) - `connectors.form`, beside which `connectors.signIn` goes"
  - "[code://docs/subjects/CONNECTORS.md#L45-L58](../../../../docs/subjects/CONNECTORS.md#L45-L58) - the docs for the form"
  - file:///github/ahpd/.project/pending/plugin-71-sign-in-checks.md - step 10, the check by hand from this button
---

## Objective

The connector form draws a button labelled `signIn.title` for an adapter whose row has `signIn`.
A click opens the provider's page and a code step, and Finish makes or changes the connector as a save does.

## Files

- `CREATE: src/resources/connectors/SignInStep.tsx` - the button, the code step, and the calls to `startSignIn` and `finishSignIn`.
- `UPDATE: src/resources/connectors/ConnectorForm.tsx:120-139` - move the answer handling of `save` into `afterPut(row)`, which `save` and `SignInStep` share.
- `UPDATE: src/resources/connectors/ConnectorForm.tsx:152-159` - draw `SignInStep` under the adapter's `SchemaForm` when `adapter.signIn` is set.
- `UPDATE: src/i18n/en.json` - add `connectors.signIn` with `orType`, `step`, `openAgain`, `code`, `finish`, `cancel` and `failed`.
- `UPDATE: src/i18n/pt.json` - the same keys in Portuguese.
- `UPDATE: src/i18n/es.json` - the same keys in Spanish.
- `UPDATE: src/style/app.css` - a `.web-connector-form__signin` block for the step, beside `.web-connector-form__adapter`.
- `UPDATE: docs/subjects/CONNECTORS.md` - a paragraph under "Make one" on the sign-in button and the code step.

## Steps

1. Write `SignInStep` with the props `host`, `signIn`, `wanted`, `disabled` and `onDone(row)`.
2. Make `wanted` the put's params with the config from `configForSignIn`, built in `ConnectorForm`.
3. Draw a `Button` labelled `signIn.title`, with `connectors.signIn.orType` as a note under it.
4. On click, call `startSignIn`, keep `{ url, state }` in the step's own state, and open `url` with `window.open(url, '_blank', 'noopener')`.
5. In the step, draw `signIn.title`, the `step` text, and an `openAgain` link to `url` with `rel="noopener noreferrer"`.
6. Draw a `TextField` with `type="password"` for the code, kept in the step's own `useState` only.
7. Disable Finish while the code is empty or a call runs.
8. On Finish, call `finishSignIn`, clear the code and the state, and call `onDone(row)`.
9. On a refusal, clear the code and the state, and show an `Alert` titled `failed` with `hostSaid` of the error.
10. On Cancel and on unmount, clear the code and the state without a call.
11. Key `SignInStep` on the adapter name, so a change of adapter closes an open step.
12. Pass `disabled={!ready || busy}`, so the button follows Create, and needs no change on a made connector.
13. Make `afterPut(row)` close a new form and open the connector, or set `saved` on a made one.
14. Keep each string in the catalogs, and leave the button's own label to `signIn.title`.
15. Never write the code, the url or the state to the scena store or a `console` call.
16. Write the docs paragraph: the button, the new tab, the pasted code, and that a typed key still works.

## Validation

- `locales.test.ts` passes, so each locale has every `connectors.signIn` key.
- `pnpm -s typecheck && pnpm -s test && pnpm -s build` passes.
- By hand at two window widths: an adapter with no `signIn` draws no button.
- By hand at two window widths: the OpenRouter adapter draws "Sign in with OpenRouter".
- By hand: step 10 of the pending file passes from the button, and the connector page shows "Ready".
- By hand: the wire log shows `••••••` for the code.
- By hand: a wrong code shows the host's error, with no code in it.
- By hand: a made OpenRouter connector signs in again from Settings and shows "Saved.".

## Resume
