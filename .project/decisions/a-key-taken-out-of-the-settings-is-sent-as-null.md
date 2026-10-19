---
title: A key taken out of the settings is sent as null
status: accepted
date: 2026-10-19
refs:
  - "[code://src/resources/host/config.ts](../../src/resources/host/config.ts) - `changedKeys`, which sends only keys still in the edited value"
  - https://github.com/softov/ahpd/blob/main/packages/server/src/rootconfig.ts - "`null` is how a client says a key is taken back, as it is everywhere else on the root channel"
---

## Context

*Reset setting* takes a key out of the form's value, and so does deleting it in the JSON text.
`changedKeys` lists only the keys in the edited value, so a key taken out is never sent and the host keeps it.
ahpd removes a key from its file when a `root/configChanged` carries it as `null`, and the default applies again.

## Decision

`changedKeys` also lists, as `null`, every key the host holds that the edited value no longer has.

## Consequences

Reset in the menu and a deleted line in the JSON both reach the host.
A read-only key the form never edits is still in the value, so nothing sends it.

## Options

- Reset writes the schema's `default` as a value: lost, because the host would then hold the default as an override, and a later change of the default would not reach it.
