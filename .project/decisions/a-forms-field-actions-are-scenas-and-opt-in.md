---
title: A form's field actions are scena's, and a form asks for them
status: accepted
date: 2026-10-19
refs:
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/forms/SchemaForm.tsx#L218-L279 - `renderField`, where every top-level field is drawn
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/overlay/Popup.tsx - the anchored popup the menu sits in
---

## Context

Softov asked, on 2026-10-19, for what VS Code's settings do: "mouse over key. tooltip shows the ID of the key and a button with options."
VS Code's menu offers Reset Setting, Copy Setting ID, Copy Setting as JSON, Copy Setting as URL and Apply Setting to all Profiles.
ahpw has no link to one setting and no profiles.

## Decision

`SchemaForm` takes `fieldActions?: boolean`, off by default.
With it on, each top-level field is drawn in a row that shows the field's key in a tooltip on hover and focus, and a gear button that opens a menu: *Reset setting*, *Copy setting ID*, *Copy setting as JSON*, and *Show in JSON* when the form has a `json` view.
*Reset setting* takes the key out of the value, so the control shows the schema's default; it is disabled when the key is not in the value.
The menu is a `Popup` with plain buttons, so a form outside a scena root, as in its tests, still draws it.

## Consequences

Every view that uses `renderField` gets the actions, the long form as much as the sections view.
A consumer that saves must treat a key taken out of the value as a key taken back.

## Options

- The actions drawn by ahpw around each field: lost, because the field's row and its label are inside `SchemaForm`.
- Always on: lost, because a sign-up or user form has no use for a key in a tooltip.
- `ContextMenu`: lost, because it needs `useScena`, and `SchemaForm` is used without a scena root.
