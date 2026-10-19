---
title: SchemaForm draws its value through a list of views it is given, and fields and json are the first two
status: accepted
date: 2026-10-19
refs:
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/forms/SchemaForm.tsx#L140 - `mode` is `'fields' | 'json'`, two hard-wired branches
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/forms/SchemaForm.tsx#L283-L295 - the modebar draws exactly two buttons
---

## Context

The host settings need a third way to look at the same values, beside the long form and the JSON text.
`SchemaForm` holds the value, the baseline, dirtiness, reset and JSON validity, and switches between two hard-wired bodies.
Softov asked, on 2026-10-19: "a mode inside scena as a custom render? so it can be like extended... if in a future another 4th way etc?"

## Decision

`SchemaForm` takes `views?: SchemaFormView[]`, each `{ id, label?, render }`, and draws the active one.
The default list is `[fieldsView, jsonView]`, so every caller that passes no `views` sees what it sees today.
The form keeps the state; a view only draws it, through `SchemaFormViewProps`, which hands it `renderField(key)` so a view reuses the form's own controls.
The modebar draws one button per view; `defaultView` names the view a form opens on.

## Consequences

A fourth view is one more entry in the list, with no change to `SchemaForm`.
The JSON body moves out of `SchemaForm` into `jsonView`, which holds its own text the way `TupleJson` already does, so the JSON tests must hold unchanged.
A view's label is translated by the form when the view gives none: `form/<id>`.

## Options

- A third hard-wired mode in `SchemaForm`: lost, because the next view would be a fourth branch in the same function.
- ahpw owns the switch and turns `SchemaForm`'s off: lost, because every other scena app would have to build the same switch, and the JSON text state would be duplicated outside the form.
- A global view registry on `scena`: lost for now, because nothing outside a form looks views up; a prop list is already the extension point.
