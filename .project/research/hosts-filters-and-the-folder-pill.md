---
title: Hosts, filters and the folder pill - notes after the window with every host
date: 2026-10-16
refs:
  - "[code://src/bridges/hosts.ts](../../src/bridges/hosts.ts) - the host filter and its menu"
  - "[code://src/resources/sessions/New.tsx](../../src/resources/sessions/New.tsx) - the new session's host, agent and folder pills"
  - "[code://src/resources/sessions/FolderPill.tsx](../../src/resources/sessions/FolderPill.tsx) - the folder pill"
  - file:///github/ahpw/.project/plans/hosts/02-a-window-with-every-host/plan.md - the plan these notes follow
---

Softov's notes from trying the window with every host on the desk, 2026-10-16.
Nothing here is decided; each point is to weigh when the next plan is written.
The window with every host works; these are what comes next.

## The host filter's menu is too long

- The filter lists each host's Info and Settings under the hosts.
  With 10 hosts that is 30 items in one menu.
- The filter only needs to filter: the host pages should leave it.
- A host's Settings and Info could move to a host list, as VS Code's Remote menu does.
  There, one row per host opens that host's options.
  VS Code's options for a remote are Rename, Remove Remote, Copy Address and Open Settings.

## Filtering and grouping the lists

- VS Code's sessions filter is one menu with submenus: Ordering, Grouping, Show, Environment, Created In, Harness, Created Externally, Show Done, Reset Filters.
  "Created In" is its host filter, with a check per host.
- ahpw could keep calling it Hosts, or keep it one click away, but needs more beside it:
  - grouping by day or by week;
  - sorting;
  - grouping by two keys, such as host then folder, or host then week.
- Look at ahpapp's filters too, before choosing.
- A filter on automations, as on sessions.
- Today the host filter set in one list holds in the others: the explorer, the sessions and the automations share it.
  That is fine for now; it is noted so it is a choice later, not an accident.

## Host info in the side panels

- The panels of a session, an automation and an agent should show the host it is on.

## New session

- Ctrl+N opens a new session.
- The host and agent pills open their list below the pill; it should open above, toward the box, as VS Code's does.
- The new session's composer should sit at the end of the panel, as a session's composer does.
- An automation can be made for a host already; that stays.

## One pill for the folder and its host

- In the new session's line, the folder comes after the agent; it should come before it.
- In VS Code the host and the folder are mostly one control.
  It shows the folder and the host, with an icon of the host's kind: `folder [host]`, so `/github/ahpd` on `dev1` reads `ahpd [dev1]`.
- Its list, under a search box:
  - Chat, for a session with no folder;
  - the folders used, each as `name [host]` with its path, a remote one with the remote icon;
  - Open Folder, and Work in Repository;
  - one row per host, `<host> Folders`, which opens that host's folder picker, a path box over the folder's listing;
  - Remote, a submenu: each host with its state, to manage it, and the ways to add one, such as tunnels, WSL and SSH.
- SSH lists the configured SSH hosts, then Add New SSH Host and Configure SSH Hosts.
- This would take the place of the separate host pill and folder pill in the new session.
