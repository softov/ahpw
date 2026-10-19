---
title: A policy's page edits the row from the host's manifest and shows what its limits used
status: done
depends: [task-01-the-policy-bridge.md]
layer: "resources/policies"
refs:
  - "[code://src/resources/users/RolePage.tsx](../../../../src/resources/users/RolePage.tsx) - a record page that edits"
  - "[code://src/resources/host/config.ts](../../../../src/resources/host/config.ts) - `changedKeys`, what an edit sends"
---

## Objective

A row opens as a tab in the main area: `SchemaForm` over `offers.providers.policy.manifest`, with the fields and JSON views and the field actions, then what each limit used and when it resets, then Save, Discard and Delete.
A new row has its id as the form's first field; a host that takes no writes shows the form in a disabled fieldset.

## Files

- `CREATE: src/resources/policies/PolicyPage.tsx` - `PolicyPage`, `LimitsList`, `withId`, `editable`.
- `UPDATE: src/style/app.css` - `.web-policy__form`, `.web-policy__figure`.

## Steps

1. Draw the form from the manifest; for a new row, put `id` first and required.
2. Save sends `changedKeys(held, value)`, or the whole row less its id when new, with `createOnly`.
3. Read `policy://<id>/limits` when the row has limits, again when the row changes; a refused read says why under the heading.

## Validation

- By hand against the isolated ahpd 0.12.0: an edit saved to `policies.json`, a new row listed and reopened under its id, a held id refused with the host's sentence, a delete through the confirm; the limits read refused with -32008.
- By hand against ahpd main `0e76f540`: the figures, with `resets`, the members of an `each` limit, and `Not counted yet` for hours.

## Resume

Done 2026-10-19.
The id moved into the form, rather than a field above it as on a role's page: above it, it sat 28px left of the form's rows in another label style.
