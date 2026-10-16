---
title: A host's options open from its row in the host menu
status: done
depends: []
layer: "src/shell/embed, src/bridges"
refs:
  - "[code://src/shell/embed/HostSwitcher.tsx](../../../../../src/shell/embed/HostSwitcher.tsx) - the menu the options join"
  - "[code://src/bridges/hosts.ts](../../../../../src/bridges/hosts.ts) - the `hosts.info.<id>`, `hosts.settings.<id>` and `hosts.fix.<id>` commands that leave `HOST_SLOT`"
---

## Objective

In multi, each host row in the title bar's host menu has an options button.
It opens Info, Settings, Sign in or Retry while the host is not connected, and Manage in the embedder.
The host filter's menu lists only Every host and the hosts.

## Files

- `UPDATE: src/bridges/hosts.ts` - drop `hosts.info.<id>`, `hosts.settings.<id>` and `hosts.fix.<id>` from `registerHosts`; the words `hosts/pages`, `hosts/info`, `hosts/settings`, `hosts/signInOn`, `hosts/retryOn` go with them.
- `UPDATE: src/shell/embed/HostSwitcher.tsx` - in multi, a `⋯` button at each row's end opens a second menu with the host's options, as the row menu of an explorer does.
- `UPDATE: src/shell/embed/embed.css` - the options button, shown on hover and focus.
- `UPDATE: src/i18n` - `shell/embed/hostOptions`, `shell/embed/info`, `shell/embed/settings`, `shell/embed/manage`, in every locale.

## Steps

1. Remove the per-host page and fix commands from `registerHosts`, and their words.
2. Add the options button to each row in multi.
3. Its `ContextMenu` holds Info, Settings, Sign in or Retry, and Manage.
4. Info and Settings run `ahp.openHostInfo` and `ahp.openSettings` with `{ host }`; Sign in or Retry runs `fixHost`; Manage runs `manageHosts({ edit })`.

## Validation

- `pnpm test` and `pnpm typecheck` pass.
- By hand, with two hosts: the filter lists only the hosts; each row's options open that host's Info and Settings.

## Resume

- Done 2026-10-16: the filter's menu lists only Every host and the hosts; the per-host page and fix commands and their words are gone.
- In multi, each row of the title bar's host menu has a `⋯` button, shown on hover and focus.
  Its `ContextMenu` holds Info, Settings, Sign in or Retry while the host is not connected, and Edit host.
- Verified: the suite, 60 files and 347 tests, and `pnpm typecheck` pass; checked by hand in p4's run.
