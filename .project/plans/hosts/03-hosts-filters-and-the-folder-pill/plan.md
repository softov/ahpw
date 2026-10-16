---
title: Hosts, filters and the folder pill
domain: hosts
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/hosts/02-a-window-with-every-host/plan.md
refs:
  - "[code://src/bridges/hosts.ts#L37-44](../../../../src/bridges/hosts.ts#L37-44) - `HOST_FILTER_ACTION`, and the filter's menu with each host's pages"
  - "[code://src/resources/sessions/grouping.ts](../../../../src/resources/sessions/grouping.ts) - one grouping key, no time grouping"
  - "[code://src/resources/sessions/index.ts#L60-107](../../../../src/resources/sessions/index.ts#L60-107) - the sessions header: New, Reload, Archived, Group, Hosts"
  - "[code://src/resources/automations/index.ts#L38-43](../../../../src/resources/automations/index.ts#L38-43) - the automations header: New, Reload, Hosts; no group or sort"
  - "[code://src/resources/sessions/New.tsx](../../../../src/resources/sessions/New.tsx) - the new session's host, agent and folder pills"
  - file:///github/ahpw/.project/research/hosts-filters-and-the-folder-pill.md - Softov's notes this plan is made from
  - file:///github/ahpapp/src/session-filter.ts - ahpapp's session grouping, sorting and pinned section
  - file:///github/ahpapp/src/automation-list.ts - ahpapp's automation grouping, sorting, status filter and next-run days
---

## Goal

The window with every host stays usable with many hosts.
A host's pages move out of the host filter into the title bar's host menu, and the side panels name their host.
The sessions list groups by two keys, by day or week too, sorts, and keeps pinned sessions on top.
The automations list groups, sorts and filters by status.
The new session picks its folder and host in one pill, `folder [host]`, and opens with Ctrl+N or Alt+N.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.
Each child plan names the files it changes.

### Gaps

- The host filter's menu holds three items per host, so ten hosts make thirty.
- The side panels of a session, an automation and an agent do not say which host they are on.
- Sessions group by one key, never by day or week, never sort, and cannot be pinned.
- Automations have no group, sort or status filter.
- The new session has a host pill and a folder pill apart, the folder after the agent.
- `ahp.newSession` has no key.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The host filter only filters; a host's pages leave it. | Softov, 2026-10-16: "the filtering for host does not need to add pages... think 10 hosts, that will be 30 menus" | p1 |
| A host's Info, Settings, Sign in or Retry, and manage open from an options button on its row in the title bar's host menu. | Softov, 2026-10-16: "Title-bar host menu" | p1 |
| The session, automation and agent panels name their host. | Softov, 2026-10-16: "panel for session, automation, agent, need to show host info" | p1 |
| The lists keep separate header buttons; a sort button is added beside the group button. | Softov, 2026-10-16: "Keep separate buttons" | p2, p3 |
| Sessions group by a first key and an optional second, among host, folder, agent, status, day and week. | Softov, 2026-10-16: "Two keys, day and week too" | p2 |
| The group button's menu has two headed sections: Group by, and Then by. | Softov, 2026-10-16: "Group menu, two sections" | p2 |
| Sessions sort by last changed, created or name, newest or oldest first for the dates, with a flag that puts sessions waiting on the person first. | Softov, 2026-10-16: "First option with a urgency flag" | p2 |
| Sessions can be pinned, and pinned sessions show in their own section on top. | Softov, 2026-10-16: "we also need pinned ones" | p2 |
| A pin is this window's own, kept in storage under `hostKey`, never sent to a host. | `(defaulted: as ahpapp's observed mark, which "must never be sent")` | p2 |
| Automations get ahpapp's set: group by none, host, status or next run; sort by next run, name or last run; a status filter. | Softov, 2026-10-16: "ahpapp's group, sort, status" | p3 |
| The new session's host and folder are one pill, `folder [host]`, before the agent pill. | Softov, 2026-10-16: "One pill, before the agent" | p4 |
| That pill's list holds the folders used, one `<host> Folders` row per host opening its folder picker, and Remote, with each host to manage and Add host. | Softov, 2026-10-16: "One pill, before the agent", with its option text | p4 |
| SSH and WSL are left out of Remote, since the desk adds neither. | Softov, 2026-10-16: "SSH and WSL are not in the desk, so they are left out", in the option chosen | p4 |
| New session opens with Ctrl+N and Alt+N. | Softov, 2026-10-16: "Ctrl+N and Alt+N" | p4 |
| The lists open over the new session's box, which sits at the end of its panel. | Softov, 2026-10-16: "fix the two small", done before this plan | - |

## Proposed architecture

- **Data flow** - Grouping, sorting and pins are pure functions over the rows the explorers already build; only the choices are kept.
- **Event flow** - Each choice is a command with `active`, in a header button's menu slot, as the sessions Group menu is today.
- **State flow** - Choices live in the store and in storage, per window, as the grouping and the host filter do.
- **Layer responsibilities** - `src/resources/sessions` and `src/resources/automations`: the lists; `src/shell/embed`: the host menu; `src/resources/sessions/New.tsx`: the pill.
- **Source-of-truth files** - [`code://src/resources/sessions/grouping.ts`](../../../../src/resources/sessions/grouping.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [p1 - The host menu and the panels](03-hosts-filters-and-the-folder-pill-p1-host-menu-and-panels/plan.md) | built | - |
| [p2 - The sessions list](03-hosts-filters-and-the-folder-pill-p2-the-sessions-list/plan.md) | built | - |
| [p3 - The automations list](03-hosts-filters-and-the-folder-pill-p3-the-automations-list/plan.md) | built | p2 |
| [p4 - The new session](03-hosts-filters-and-the-folder-pill-p4-the-new-session/plan.md) | built | p1 |

## Risks and tradeoffs

- Two grouping keys make nested headings in a flat list - the second key's headings are indented, and folding works per heading.
- Removing the folder pill's own walking menu leaves typing a path to the folder picker's path box.

## Resume state

- **Done so far:** the two small fixes and p1 to p4; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** scena's picker types a command's shortcut into the box when a pill opens its list, and Esc leaves it there.

## Final verification checklist

- [x] With every host, the filter's menu lists only the hosts, and each host's pages open from the title bar's host menu.
- [x] Sessions group by two keys, sort, and keep pinned sessions on top; automations group, sort and filter.
- [x] The new session picks `folder [host]` in one pill, and Ctrl+N or Alt+N opens it.
- [x] Mono works as before.
- [x] `plans/index.md` updated.
