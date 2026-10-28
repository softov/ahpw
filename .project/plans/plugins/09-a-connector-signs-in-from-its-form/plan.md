---
title: A connector signs in from its form
domain: plugins
status: active
priority: medium
created: 2026-10-27
revalidated: 2026-10-27
requires:
  - plans/plugins/04-connectors/plan.md
refs:
  - "[code://src/bridges/connectors.ts#L30-L35](../../../../src/bridges/connectors.ts#L30-L35) - `CONNECTORS`, the connector commands ahpw calls today: `put` and `remove`"
  - "[code://src/bridges/connectors.ts#L55-L66](../../../../src/bridges/connectors.ts#L55-L66) - `AdapterRow`, which has no `signIn` yet"
  - "[code://src/bridges/connectors.ts#L122-L133](../../../../src/bridges/connectors.ts#L122-L133) - `putConnector`, the pattern for the two new calls"
  - "[code://src/resources/connectors/ConnectorForm.tsx#L120-L139](../../../../src/resources/connectors/ConnectorForm.tsx#L120-L139) - `save`, whose answer closes a new form and opens the connector, or marks a made one saved"
  - "[code://src/resources/connectors/ConnectorForm.tsx#L152-L159](../../../../src/resources/connectors/ConnectorForm.tsx#L152-L159) - the adapter's section, drawn by scena's `SchemaForm` from the adapter's schema"
  - "[code://src/resources/connectors/ConnectorForm.tsx#L161-L165](../../../../src/resources/connectors/ConnectorForm.tsx#L161-L165) - the form's buttons"
  - "[code://src/resources/connectors/form.ts#L205-L242](../../../../src/resources/connectors/form.ts#L205-L242) - `secretFields` and `configForPut`, which a sign-in's config reuses"
  - "[code://src/resources/log/wire.ts#L162-L188](../../../../src/resources/log/wire.ts#L162-L188) - `masked`, which hides an `authenticate` token in the wire log, and which a code and a key also need"
  - "[code://src/bridges/said.ts#L11-L14](../../../../src/bridges/said.ts#L11-L14) - `hostSaid`, the error text a failed call shows"
  - "[code://src/resources/folders/NameDialog.tsx#L58-L66](../../../../src/resources/folders/NameDialog.tsx#L58-L66) - scena's `TextField`, the input for the pasted code"
  - "[code://docs/subjects/CONNECTORS.md#L45-L58](../../../../docs/subjects/CONNECTORS.md#L45-L58) - the docs for the connector form"
  - file:///github/ahpd/.project/plans/plugin/71-a-connector-signs-in-with-its-provider/plan.md - the host side: the adapter row's `signIn` and the two commands
  - file:///github/ahpd/packages/sdk/src/connectors/channel.ts - `x-ahpd/connectors/signin` and `x-ahpd/connectors/signin-finish`, their params, answers and errors
  - file:///github/ahpd/packages/sdk/src/connectors/adapters.ts - `rowOf`, which sends `signIn: { title, field }` on the adapter row
  - file:///github/ahpd/packages/sdk/src/types/connectors.ts - `SignIn` and `Adapter.signIn`
  - file:///github/ahpd/.project/pending/plugin-71-sign-in-checks.md - the check by hand; step 10 runs from this button
---

## Goal

A person signs a connector in to its provider from the connector form in ahpw.
The form draws a sign-in button when the host says the adapter has a sign-in.
The person opens the provider's page, copies the code it shows, and pastes the code in the form.
The host makes or changes the connector with the key, and the form goes on as a save does.
OpenRouter is the first adapter with a sign-in, and a typed key still works.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "signIn|signin" src` - no match. ahpw has no sign-in.
- `rg -n "SchemaForm" src/resources/connectors` - `ConnectorForm.tsx` draws the top fields and the adapter's fields with scena's `SchemaForm`.
- `rg -n "hostBridge\(host\).request" src/bridges/connectors.ts` - `putConnector` and `removeConnector` are the only connector commands ahpw calls.
- `rg -n "window.open" src` - ahpw opens an outside page with `window.open(url, '_blank', 'noopener')`.
- `rg -n "masked|HIDDEN" src/resources/log` - the wire log keeps every sent frame as the line's detail, and hides only an `authenticate` token.
- `find src -name "*.test.tsx"` - no match. ahpw tests pure functions and bridges, not components.

### Runtime path

```
x-ahpd-adapters row { signIn: { title, field } } -> ConnectorForm -> sign-in button, labelled signIn.title
click -> startSignIn(host, wanted) -> x-ahpd/connectors/signin { id, adapter, owner, title?, config } -> { url, state }
      -> window.open(url) and a link to it -> the code step
paste code, Finish -> finishSignIn(host, state, code) -> x-ahpd/connectors/signin-finish { state, code } -> ConnectorRow { state: "ready" }
      -> the same end as a save: a new form opens the connector, a made one says "Saved."
```

### Gaps

- `AdapterRow` has no `signIn`, so the form cannot know that an adapter signs in.
- The bridge has no call for `signin` or `signin-finish`.
- The form has no button and no step for a pasted code.
- The wire log keeps a sent frame whole, so it would keep the pasted code. It keeps a typed key in a `put` today.

## Mockup

A new connector of an adapter with a sign-in, before the click.
The button label is `signIn.title` from the adapter row.

```
New connector
+--------------------------------------------------------------+
| Adapter *  [ (icon) OpenRouter                     Change ]  |
| Title      [ My OpenRouter                                ]  |
| Id *       [ my-openrouter                                ]  |
| Owner *    [ Me                                        v ]   |
|                                                              |
| (icon) OpenRouter settings                                   |
|   Key *       [ ••••••••                                  ]  |
|   Endpoint    [ https://openrouter.ai/api/v1              ]  |
|                                                              |
|   [ Sign in with OpenRouter ]                                |
|   Sign in, or type the key above.                            |
|                                                              |
| [ Create ]                                                   |
+--------------------------------------------------------------+
```

After the click, the button is replaced by the code step.
A new tab shows the provider's page.

```
| (icon) OpenRouter settings                                   |
|   Key *       [ ••••••••                                  ]  |
|   Endpoint    [ https://openrouter.ai/api/v1              ]  |
|                                                              |
|   Sign in with OpenRouter                                    |
|   Sign in on the page that opened, copy the code it shows,   |
|   and paste it here.  Open the page again                    |
|   Code        [ ••••••••••••••                            ]  |
|   [ Finish ]  [ Cancel ]                                     |
|                                                              |
| [ Create ]                                                   |
```

When the host refuses, the step closes and the form shows the alert.

```
|   [ Sign in with OpenRouter ]                                |
|   ! The sign-in did not finish                               |
|     Sign in with OpenRouter answered 401                     |
```

## Answers

| What | Source | Task |
| --- | --- | --- |
| The button shows only when the adapter row has `signIn`, and its label is `signIn.title` | Softov, 2026-10-27: "The button comes from the adapter row's `signIn`, its label from `signIn.title`" | 02 |
| ahpw names no adapter, key or field. It reads `signIn.field` from the row | Softov, 2026-10-27: "ahpw draws only what the host sends" | 02 |
| A typed key still works, and the key field stays in the form | file:///github/ahpd/.project/plans/plugin/71-a-connector-signs-in-with-its-provider/plan.md, row "A typed `key` still works" | 02 |
| The code and the key never show in the store, a log line or an error | Softov, 2026-10-27: "Never let the code or key show in UI state, logs or errors" | 01, 02 |
| The pasted code lives only in the step's own React state, in a password input, and is cleared on finish, failure, cancel and unmount | (defaulted: no store path, so no other view or the log reads it) | 02 |
| The wire log hides `params.code` of a sent `signin-finish` | (defaulted: `masked` already hides an `authenticate` token the same way) | 01 |
| The wire log hides each non-empty string in `params.config` of a sent `put` and `signin` | (defaulted: the log does not know which fields an adapter keeps secret, and a typed key reaches it today) | 01 |
| The sign-in sends the form's config without `signIn.field`, and every other secret left empty as `""` | (defaulted: the host fills that field, and `""` keeps a stored secret, as `configForPut` does) | 01 |
| The button sits in the adapter's section, under its fields, on a new connector and on a made one's Settings | (defaulted: the field it fills is in that section, and a made connector may sign in again) | 02 |
| The button is enabled when Create is: an adapter, a valid id and an owner. A made one needs no change first | (defaulted: `signin` runs the put's checks; a second sign-in changes only the key) | 02 |
| ahpw opens the URL in a new tab with `noopener`, and the step always shows a link to it | (defaulted: a browser may block a tab opened after an await) | 02 |
| A finished sign-in ends as a save does: a new form closes and opens the connector, a made one says "Saved." | [code://src/resources/connectors/ConnectorForm.tsx#L130-L136](../../../../src/resources/connectors/ConnectorForm.tsx#L130-L136) | 02 |
| A failed start or finish shows `hostSaid` of the error under a new title, and closes the step | (defaulted: the host's errors carry no code or key, and a state is used once) | 02 |
| A change of adapter closes an open step | (defaulted: the state belongs to the adapter it started with) | 02 |
| The words around the button are ahpw's catalog strings in `en`, `pt` and `es` | [code://src/i18n/en.json#L2438-L2455](../../../../src/i18n/en.json#L2438-L2455) | 02 |

## Proposed architecture

- **Data flow** - the adapter row's `signIn` names the button and the field. `startSignIn` sends the put's params without that field and answers `{ url, state }`. `finishSignIn` sends `{ state, code }` and answers the connector row.
- **Event flow** - the host sends the connector row on `x-ahpd-connectors://` as a put does, so the list and the page follow without a change here.
- **State flow** - the step holds `{ url, state }` and the code in `SignInStep`'s own state. Nothing goes to the scena store.
- **Layer responsibilities** - bridges: the `signIn` type and the two calls · connectors screen: the button, the code step, the end of the flow · log: the mask.
- **Source-of-truth files** - [`code://src/bridges/connectors.ts`](../../../../src/bridges/connectors.ts), [`code://src/resources/connectors/ConnectorForm.tsx`](../../../../src/resources/connectors/ConnectorForm.tsx)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The bridge signs in, and the log hides the code](task-01-the-bridge-signs-in.md) | implemented | - |
| [02 - The form draws the sign-in button](task-02-the-form-draws-the-sign-in-button.md) | implemented | 01 |

## Risks and tradeoffs

- The code in a log or an error gives away the account. The wire log masks it, the step clears it, and no error text carries it.
- The masked `put` config hides values that are not secret, such as an endpoint, in the log detail. A person reads them on the connector page.
- A browser may block the new tab. The step shows a link, so the person opens the page by hand.
- A state lives ten minutes on the host. A late paste gets the host's "expired" error, and the person starts again.

## Resume state

- **Done so far:** tasks 01 and 02 are implemented on branch `plugins/09-a-connector-signs-in-from-its-form`.
- **Next action:** Softov runs the checks by hand in [`plugins-09-sign-in-checks.md`](../../../pending/plugins-09-sign-in-checks.md).
- **Open questions:** none.
- **Watch out for:** the code is never in the scena store, a `console` call, or a thrown message that ahpw writes.

## Final verification checklist

- [ ] Step 10 of `plugin-71-sign-in-checks.md` passes from the button: the connector row is `ready`.
- [ ] The wire log shows `••••••` for the code and for a typed key.
- [ ] An adapter row with no `signIn` draws no button.
- [ ] `plans/index.md` updated.
