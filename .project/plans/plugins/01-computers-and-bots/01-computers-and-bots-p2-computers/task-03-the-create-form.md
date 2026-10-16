---
title: The create form
status: done
depends: [task-01-the-computers-list.md]
layer: "src/resources/computers"
refs:
  - "[code://src/resources/host/Settings.tsx#L40](../../../../../src/resources/host/Settings.tsx#L40) - `SchemaForm` with a host-given schema"
  - "[code://src/resources/automations/Edit.tsx](../../../../../src/resources/automations/Edit.tsx) - the host picker in multi, Save and Cancel"
  - file:///github/ahpd/packages/computer/src/manifest.ts - `MANIFEST_SCHEMA`
---

## Objective

New computer opens a page with a host picker in multi, a Name field, and `SchemaForm` from the host's `computer` provider manifest.
Create calls `x-ahpd/computers/create` with `{ name, manifest }`, else writes `computer://<name>` with `createOnly`.

## Files

- `CREATE: src/resources/computers/New.tsx` - `NewComputer({ host })`.
- `CREATE: src/resources/computers/manifest.ts` - `formSchema(manifest)`: `x-choices` to `x-enumOptions`; `nameProblem(name)`; `manifestBody(values)` drops blanks.
- `UPDATE: src/resources/computers/index.ts` - `ahp.newComputer`.

## Steps

1. Write `manifest.ts` and its test.
2. Write the page; a refusal shows in a `PageAlert`.
3. After create, open the new computer's page.

## Validation

- `manifest.test.ts`: `x-choices` mapped; blanks dropped; names with `/` or `..` refused.
- By hand: a computer made from the form runs, and opens.

## Resume

- Done 2026-10-16: `New.tsx`, `manifest.ts` with its test.
- Host and name are fields of the same `SchemaForm`, so every field looks alike; the JSON switch is off.
- Checked in a browser: the form draws beta's manifest; `box/1` disables Create; Create shows the host's refusal.
- Not checked by hand: a computer made, since this machine has no Docker.
