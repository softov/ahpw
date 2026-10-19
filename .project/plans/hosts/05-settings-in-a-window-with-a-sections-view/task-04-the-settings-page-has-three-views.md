---
title: The settings page has the fields, the JSON and the sections, and sends a taken-out key as null
status: done
depends: [task-02-the-sections-view.md, task-03-a-field-shows-its-key-and-offers-its-actions.md]
layer: "ahpw host settings"
refs:
  - "[code://src/resources/host/Settings.tsx](../../../../src/resources/host/Settings.tsx) - the page"
  - "[code://src/resources/host/config.ts](../../../../src/resources/host/config.ts) - `changedKeys`"
  - "[code://src/resources/host/config.test.ts](../../../../src/resources/host/config.test.ts) - its cases"
---

## Objective

The settings page passes `[fieldsView, jsonView, sectionsView(settingsGroups(schema))]` and `fieldActions` to its form, and Save sends a key the person took out as `null`.

## Files

- `CREATE: src/resources/host/sections.ts` - `settingsGroups(schema): SchemaFormGroup[]`.
- `CREATE: src/resources/host/sections.test.ts` - its cases.
- `UPDATE: src/resources/host/Settings.tsx` - the views and `fieldActions`.
- `UPDATE: src/resources/host/config.ts` - `changedKeys` lists held keys missing from the edit as `null`.
- `UPDATE: src/resources/host/config.test.ts` - that case.
- `UPDATE: src/i18n/en.json`, `es.json`, `pt.json` - the group and section titles under `host/settings/sections`.

## Steps

1. `settingsGroups` names the sections in the plan's table; Plugins has one section per `plugins.*` key in the schema, titled by the key's plugin name; VS Code takes every remaining key the schema declares that is in the list of keys VS Code pushes, kept in `sections.ts`.
2. The titles are translated keys, read with `translate` when the groups are built.
3. `changedKeys(held, edited)` adds `[key, null]` for every key of `held` not in `edited` (decision 5).

## Validation

- `sections.test.ts`: a plugin key gets its own section; an unknown key is in no section, so scena's Other takes it; a key the schema does not declare is not listed.
- `config.test.ts`: a key taken out is sent as `null`.
- `pnpm test`; `tsc` against scena's source.

## Resume

Done 2026-10-19.
The VS Code group is split by subject (network, telemetry, approval, agents, MCP, sessions, pull requests, features), because ahpd's main now declares 43 VS Code keys; a key VS Code adds later goes to scena's Other.
Unsaved edits and the chosen view are kept per host in the module, so moving the settings to another place keeps them.
Checked in the browser against an isolated ahpd: an edit, a reset and Save wrote `closedChats: "delete"` and took `archiveDirtyWorktree` out of the file.
