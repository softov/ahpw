---
title: A window with every host
domain: hosts
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/hosts/01-a-host-in-every-key/plan.md
refs:
  - "[code://src/shell/embed/index.ts](../../../../src/shell/embed/index.ts) - the embedder contract: `host()`, `hosts()`, `onHosts()`, `statuses()`, `token()`, `manageHosts()`"
  - "[code://src/bridges/data.ts#L516-L570](../../../../src/bridges/data.ts#L516-L570) - `openSocket`, `connect` and `followEmbeddedHost`, which connect one host"
  - "[code://src/lib/storage-keys.ts#L9-L11](../../../../src/lib/storage-keys.ts#L9-L11) - `hostKey`, which scopes a page's storage by its host's address"
  - "[code://src/shell/explorer/ExplorerList.tsx#L10-L45](../../../../src/shell/explorer/ExplorerList.tsx#L10-L45) - `Row` and `ExplorerList`, the sessions, automations and agents lists"
  - "[code://src/resources/sessions/grouping.ts#L7-L9](../../../../src/resources/sessions/grouping.ts#L7-L9) - `Grouping` and `GROUPINGS`, where a host grouping goes"
  - "[code://src/shell/embed/HostSwitcher.tsx](../../../../src/shell/embed/HostSwitcher.tsx) - the title bar's host menu, the pattern for a host's dot and name"
  - npm://@microsoft/agent-host-protocol - `MultiHostClient.addHost` and `removeHost`, one supervisor per host, events tagged with the host
  - file:///github/ahp-desk/.project/plans/desk/12-a-window-with-every-host/plan.md - the desk's side: the window, the setting and the tokens
---

## Goal

On the desk, a person can choose one window with every host instead of one window per host.
In that window the lists show every host's sessions, folders, terminals, automations and agents, with a host filter, and each row says its host.
A host that is down or needs a token shows so in its own rows, and the other hosts keep working.
Mono stays as it is, and stays the default.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "hostIds|hostId" ahpapp/src` - ahpapp's filter where an empty list means every host, its "host" grouping, and the host on each row.
  ahpw takes the pattern, not the code, since ahpapp is private.
- `rg "windowHost\(\)" src` - every caller that means "the window's host"; in multi each one takes its row's or its page's host instead.

### Runtime path

```
embedder mode 'multi' -> connect hostBridge(id) for each of hosts(), follow onHosts()
  -> the lists read the shown hosts' paths -> a host filter, a host on each row
  -> a page opens with its row's host
```

### Gaps

- The embedder has no mode, one `token()` for the window's host, and `manageHosts()` cannot name a host.
- `connect` adds one host, and the lists read one host's paths; nothing filters by host.
- `hostKey` scopes storage by one host's address.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Multi comes through the desk's embedder first; `ahpw serve --multi` in a browser is a later plan. | Softov, 2026-10-16: "Desk first, browser later" | - |
| Mono is the default, and a person picks multi on the desk. | Softov, 2026-10-16: "not as mandatory. user could work as today. or could select one option to see all in one ui/window" | - |
| The lists merge every host's rows, with a host filter where none picked means every host, a "host" grouping, and each row's host name. | Softov, 2026-10-16: "Merged + host filter" | 04 |
| New session asks the host with a host pill in its tray, the last host used by default. | Softov, 2026-10-16: "Host pill in the tray" | 05 |
| New automation asks the host with the same host pill, the last host used by default. | Softov, 2026-10-16: "Host pill, like New session" | 05 |
| New terminal, the panel's `+`, asks the host with a menu of the hosts. | Softov, 2026-10-16: "Ask with a host menu" | 05 |
| A host that is down or needs a token says so in its rows and in the filter; the other hosts keep working, with no wall over the page. | Softov, 2026-10-16: "In its rows and filter" | 03 |
| A host's Info and Settings open from that host's menu in the host filter, one page per host. | Softov, 2026-10-16: "Host filter's menu" | 06 |
| Open on a host row of the desk's host list shows the window with every host, filtered to that host. | Softov, 2026-10-16, for the desk's plan 12: "Focus it, filtered to the host" | 01, 04 |

## Proposed architecture

- **Data flow** - in multi, `connect` adds every host in `hosts()` and follows `onHosts()`; each list reads the paths of the hosts the filter shows.
- **Event flow** - each host's status comes from its own connection; a refused host's "Sign in" opens the desk's form for that host.
- **State flow** - the host filter is a store path kept per window; tabs keep their host in their key (plan 01).
- **Layer responsibilities** - `src/shell/embed` holds the contract, and `src/bridges` a connection per host and the shown hosts.
  `src/resources/*` holds the filter, the host on rows and the pill, and `src/shell` the status bar.
- **Source-of-truth files** - [`code://src/bridges/data.ts`](../../../../src/bridges/data.ts), [`code://src/shell/embed/index.ts`](../../../../src/shell/embed/index.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the embedder says its mode, and gives each host's token](task-01-the-embedder-says-its-mode.md) | done | - |
| [02 - a window with every host connects to each one](task-02-a-connection-per-host.md) | done | 01 |
| [03 - a down or refused host says so in its own rows](task-03-a-down-host-says-so.md) | done | 04 |
| [04 - the lists show every host, with a host filter](task-04-the-host-filter.md) | done | 02 |
| [05 - New session asks the host](task-05-new-session-asks-the-host.md) | done | 04 |
| [06 - a host's Info and Settings open from the filter](task-06-host-pages-from-the-filter.md) | done | 04 |
| [07 - the status bar and the counts cover every host](task-07-the-status-bar-covers-every-host.md) | done | 02 |
| [08 - two hosts end to end on the desk, and mono as it is](task-08-two-hosts-end-to-end.md) | done | 01 to 07, 09 |
| [09 - the folders explorer shows each host's folders](task-09-folders-per-host.md) | done | 04 |

## Risks and tradeoffs

- The lists and explorers come from scena, which has no notion of a host.
  The filter and the host on rows are new UI, built on scena's controls and `ExplorerList`.
- A token per host widens what one window may read on the desk; the desk's plan 12 holds the rule.
- `windowHost()` has no answer in multi, so a caller left on it fails loudly there rather than reach the wrong host.

## Resume state

- **Done so far:** every task, 2026-10-16; see [implemented.md](implemented.md).
- **Next action:** none; the desk pins the release that carries this contract.
- **Open questions:** none.
- **Watch out for:** an older desk gives no `mode`, so ahpw must read its absence as mono.

## Final verification checklist

- [ ] On the desk, one window shows two hosts' sessions, and each page opens on its own host.
- [x] A host that is down or refuses does not stop the other.
- [x] Mono, in the browser and on the desk, is unchanged.
- [x] `plans/index.md` updated.
