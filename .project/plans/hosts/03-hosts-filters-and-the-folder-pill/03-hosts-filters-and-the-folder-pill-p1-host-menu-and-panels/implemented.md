---
title: The host menu and the panels - implemented
date: 2026-10-16
refs:
  - git://main
  - "[code://src/shell/embed/HostSwitcher.tsx](../../../../../src/shell/embed/HostSwitcher.tsx)"
  - "[code://src/shell/explorer/HostLines.tsx](../../../../../src/shell/explorer/HostLines.tsx)"
---

The host filter only filters.
A host's Info, Settings, Sign in or Retry, and its form in the embedder open from its row in the title bar's host menu.
With every host, the session, automation and agent panels name their host.

## What was built

- [`code://src/shell/embed/HostSwitcher.tsx`](../../../../../src/shell/embed/HostSwitcher.tsx) - the options button and `optionsOf`.
- [`code://src/shell/explorer/HostLines.tsx`](../../../../../src/shell/explorer/HostLines.tsx) - `HostTag`.

## Verified

- The suite, 60 files and 347 tests, and `pnpm typecheck` pass.

## Departures from the plan

- Manage is named Edit host, since it opens the host's form.

## Left for later

- None.
