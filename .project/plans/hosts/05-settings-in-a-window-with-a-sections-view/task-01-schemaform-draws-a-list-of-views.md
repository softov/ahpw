---
title: SchemaForm draws a list of views, and fields and json are the first two
status: done
depends: []
layer: "scena forms"
refs:
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/forms/SchemaForm.tsx#L140-L333 - the mode state, the JSON text, the modebar and the body
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/forms/SchemaForm.tsx#L547-L574 - `TupleJson`, the text-holding pattern `jsonView` follows
---

## Objective

`SchemaForm` takes `views`, `defaultView` and `onViewChange`, draws one button per view and the active view's body.
With no `views`, a form looks and behaves as it does today.

## Files

- `CREATE: packages/scena/src/ui/forms/views.tsx` - `SchemaFormView`, `SchemaFormViewProps`, `fieldsView`, `jsonView`.
- `UPDATE: packages/scena/src/ui/forms/SchemaForm.tsx:47-80` - the props gain `views`, `defaultView`, `onViewChange`.
- `UPDATE: packages/scena/src/ui/forms/SchemaForm.tsx:140-333` - `mode` becomes the active view id; the JSON text, `enterJson`, `enterFields` and `editJson` move to `jsonView`; the modebar maps over the views.
- `UPDATE: packages/scena/src/ui/forms/index.ts` - export the view types and views.
- `UPDATE: packages/scena/test/ui/SchemaForm.test.tsx` - a custom view.

## Steps

1. In `views.tsx`, `SchemaFormViewProps` is `{ schema, value, baseline, onChange, renderField(key), keys, setView(id), hasView(id), jsonEditor? }`; `keys` are the schema's top-level keys in order.
2. `fieldsView` draws `keys.map(renderField)`, under the form's `header` when there is one.
3. `jsonView` holds its text as `TupleJson` does: the shown value's JSON, replaced when a value arrives that it did not send; it reports validity through `useJsonValidity`, which moves beside it.
4. `SchemaForm` holds `view` (from `defaultView`, else the first view), passes the props, calls `onViewChange`; the modebar keeps the `reset` button and draws `label ?? t('form/<id>', id)` per view; `jsonTextRoot === false` hides the view buttons as it hides the two today.
5. A nested object form gets the default views, as today.

## Validation

- `packages/scena/test/ui/SchemaForm.test.tsx`: every existing case passes unchanged; a new case passes a third view and checks its button, that it draws through `renderField`, and that an edit in it reaches `onChange`.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` in the scena checkout.

## Resume

Done 2026-10-19 in the scena checkout.
`views.tsx` holds `SchemaFormView`, `SchemaFormViewProps`, `fieldsView` and `jsonView`; the JSON helpers moved to a new `json-text.tsx` so `SchemaForm` and the views import them without importing each other.
The nine JSON cases pass unchanged; two new cases cover a custom view and `defaultView`.
`@softov/scena/ui` re-exports the views by name in `src/ui/index.ts`, beside `forms/index.ts`.
