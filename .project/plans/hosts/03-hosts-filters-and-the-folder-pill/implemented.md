---
title: Hosts, filters and the folder pill - implemented
date: 2026-10-16
refs:
  - git://main
---

The window with every host stays usable with many hosts, and its lists group, sort and filter.

## What was built

- [p1](03-hosts-filters-and-the-folder-pill-p1-host-menu-and-panels/implemented.md) - a host's pages open from the options button on its row in the title bar's host menu; the panels name their host.
- [p2](03-hosts-filters-and-the-folder-pill-p2-the-sessions-list/implemented.md) - sessions group by two keys, by day or week too, sort with an urgency flag, and keep pinned sessions on top.
- [p3](03-hosts-filters-and-the-folder-pill-p3-the-automations-list/implemented.md) - automations group, sort and filter by status.
- [p4](03-hosts-filters-and-the-folder-pill-p4-the-new-session/implemented.md) - one `folder [host]` pill, and Ctrl+N or Alt+N.
- The two small fixes: the lists open over the new session's box, which sits at the end of its panel.

## Verified

- The suite (65 files, 363 tests), `pnpm typecheck` and `pnpm build` pass.
- Each child was checked in a browser, mono and multi; see each child's file.

## Departures from the plan

- None beyond each child's own.

## Left for later

- scena's picker types a command's shortcut into the box when a pill opens its list, and Esc leaves it there.
  That is scena's code, left unchanged.
