---
title: The box picks the host first
status: implemented
depends: []
layer: "composer"
refs:
  - "[code://src/resources/sessions/New.tsx#L363](../../../../src/resources/sessions/New.tsx#L363) - the Host list"
---

## Objective

With every host, the new session box has a Host pill before the Folder pill, and the Folder list shows the picked host's folders only.

## Files

- `UPDATE: src/resources/sessions/New.tsx` - the Host pill and `ahp.new.host`, `pickHost` and `pickFolder`, and a Folder list for one host.
- `UPDATE: src/bridges/host-state.ts` - `hostFix(state)`: the string key of Sign in, Retry, or nothing.
- `UPDATE: src/bridges/host-state.test.ts` - cases for `hostFix`.
- `UPDATE: src/shell/embed/HostSwitcher.tsx` - use `hostFix`.
- `UPDATE: src/shell/explorer/HostLines.tsx` - use `hostFix`.
- `UPDATE: src/i18n/en.json` - `host`, `hostHint` and `manage`; `whereHint` drops the host; `folders` goes.
- `UPDATE: src/i18n/es.json` - the same keys in Spanish.
- `UPDATE: src/i18n/pt.json` - the same keys in Portuguese.

## Steps

1. Write `hostFix` and use it in the host switcher and the explorer's host lines.
2. Replace `pickWhere` with `pickHost` and `pickFolder`.
3. Register `ahp.new.host` with every host, its state and its fix, and the Manage group.
4. Make `ahp.new.where` list the picked host's folders and its Open folder item.
5. Draw the Host pill before the Folder pill, with the state while the host is not connected.
6. Put the host name first in the folded tray.

## Validation

- `src/bridges/host-state.test.ts` - `hostFix` gives Sign in for refused, Retry for down, and nothing otherwise.
- `pnpm typecheck` and `pnpm test` pass.
- By hand at 1280 light and 420 dark, check the tray order and the Host list states.
- By hand, check that a refused host opens the host form.
- By hand, check that another connected host starts its folder from its home.

## Resume

Checked with a test embedder in multi mode that gives three hosts.
They are the host on 37537, the same host with a bad token, and a closed port.
