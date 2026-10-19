---
title: A field shows its key on hover and offers reset, copy and the JSON
status: done
depends: [task-01-schemaform-draws-a-list-of-views.md]
layer: "scena forms"
refs:
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/forms/SchemaForm.tsx#L218-L279 - `renderField`
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/overlay/Popup.tsx - the popup the menu sits in
---

## Objective

With `fieldActions`, each top-level field sits in a row that shows its key in a tooltip on hover or focus, and a gear button opens a menu of the field's actions.

## Files

- `UPDATE: packages/scena/src/ui/forms/SchemaForm.tsx` - `fieldActions?: boolean`; `renderField` wraps a field in `FieldRow` when it is on.
- `CREATE: packages/scena/src/ui/forms/FieldRow.tsx` - the row, the tooltip, the gear and the menu.
- `UPDATE: packages/scena/src/ui/forms/SchemaForm.css` - `.oo-schema-form__row`, its tooltip and gear.
- `UPDATE: packages/scena/test/ui/SchemaForm.test.tsx` - the actions' cases.

## Steps

1. `FieldRow` takes `{ fieldKey, value, inValue, onReset, onShowJson?, children }`; the gear is visible on hover and focus within, and always while its menu is open.
2. The tooltip is a `role="tooltip"` span with the key, referenced by the row's `aria-describedby`.
3. The menu, in a `Popup` at the gear's bottom-left: *Reset setting* (`t('form/resetField')`, disabled when the key is not in the value), *Copy setting ID*, *Copy setting as JSON* (`"<key>": <value as JSON>`), and *Show in JSON* when the form has a `json` view.
4. Reset takes the key out of the value (`commit` without it); copy writes through `navigator.clipboard.writeText` and closes the menu.
5. Off by default: no row, no tooltip, no gear.

## Validation

- Cases: no gear without `fieldActions`; the tooltip carries the key; Reset takes the key out and is disabled when it is out; Copy setting ID writes the key (clipboard stubbed); Show in JSON switches to the JSON view.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` in the scena checkout.

## Resume

Done 2026-10-19 in the scena checkout.
`FieldRow.tsx`; two cases cover the default off and the whole menu.
Found in the browser: a tooltip above the row covered the section heading, so the key shows at the row's top right instead.
