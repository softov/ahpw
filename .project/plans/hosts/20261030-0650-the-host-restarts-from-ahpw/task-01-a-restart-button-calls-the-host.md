---
title: A Restart button calls the host
status: implemented
depends: []
layer: "bridges, host, plugins"
refs:
  - "[code://src/resources/plugins/index.ts#L54-L83](../../../../src/resources/plugins/index.ts#L54-L83) - `plugins.apply` behind `PLUGINS_APPLY`, the pattern to copy"
  - "[code://src/resources/host/Info.tsx#L122-L125](../../../../src/resources/host/Info.tsx#L122-L125) - the host page's buttons"
---

## Objective

A Restart button restarts the host through `x-ahpd/restart`, and shows a refusal with a way to force.

## Files

- `CREATE: src/bridges/restart.ts` - the method name and `restartHost(host, force)`.
- `UPDATE: src/resources/host/index.ts:49-62` - the command `ahp.restartHost` and its `when` flag from `trackServed`.
- `UPDATE: src/resources/host/Info.tsx:122-125` - a Restart button beside Settings.
- `UPDATE: src/resources/plugins/Explorer.tsx:87` - a Restart button in the short restart note.
- `UPDATE: src/resources/plugins/PluginPage.tsx:71` - a Restart button in the restart alert.
- `UPDATE: src/i18n/en.json` - the button, the command and the refusal strings.
- `UPDATE: src/i18n/pt.json` - the same strings in Portuguese.
- `UPDATE: src/i18n/es.json` - the same strings in Spanish.
- `CREATE: src/bridges/restart.test.ts` - the request and the refusal cases.

## Steps

1. Write `restartHost(host, force)` that sends `x-ahpd/restart` with `{ force }` only when `force` is true.
2. Register `ahp.restartHost` in the palette's Host category, with the title "Restart host".
3. Keep a `when` flag true while a host offers `x-ahpd/restart`, as `PLUGINS_APPLY` does.
4. Draw the Restart button on the host page and in both notes only when that host offers the method.
5. Show a refusal in an alert with the host's words and a "Restart anyway" button.
6. Send `force: true` when the person presses "Restart anyway".
7. Add the strings to `en.json`, `pt.json` and `es.json`.

## Validation

- `restart.test.ts`: the request is `x-ahpd/restart` with `{}`, and with `{ force: true }` when forced.
- `restart.test.ts`: a host whose offers lack the method gives no Restart command.
- `pnpm typecheck` passes, and the touched tests pass.

## Resume

