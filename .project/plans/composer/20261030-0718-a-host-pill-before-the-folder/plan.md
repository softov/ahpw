---
title: A host pill before the folder
domain: composer
status: active
priority: low
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - "[code://src/resources/sessions/New.tsx#L305-L313](../../../../src/resources/sessions/New.tsx#L305-L313) - `pickHost` and `pickFolder`"
  - "[code://src/resources/sessions/New.tsx#L363](../../../../src/resources/sessions/New.tsx#L363) - the Host list"
  - "[code://src/bridges/host-state.ts#L16-L25](../../../../src/bridges/host-state.ts#L16-L25) - `hostFix` and `fixHost`, shared with the host switcher and the explorer's host lines"
  - file:///github/ahpapp/app/new.tsx - ahpapp picks a connected host first, at lines 196-199
---

## Goal

With every host, the new session box shows a Host pill before the Folder pill.
The Host list shows each host with its state, and only a connected host can be picked.
A host that is not connected offers Sign in or Retry.
The Folder list then shows the folders of the picked host only.

## Reconnaissance

### Searches performed

- `rg "pickWhere" src` - the Folder list picked the host and the folder together, from the folders of every connected host.
- `rg "hosts/signIn" src` - the host switcher and the explorer's host lines each chose Sign in or Retry inline.

### Runtime path

```
Host pill -> ahp.new.host -> pickHost (agent and folder start again) or fixHost
Folder pill -> ahp.new.where -> the picked host's folders -> pickFolder
```

### Gaps

- With every host, the Folder pill held the host, and its list mixed the folders of all hosts.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A Host pill comes before the Folder pill, with every host | Softov, 2026-10-30: "to select the host before the folder. so its more concise the host selection on a new session" | 01 |
| The Host list shows every host with its state; only a connected one can be picked, and the others offer their fix | Softov, 2026-10-30, question answer: "All, with state" | 01 |
| Another host starts its agent from its default and its folder from its home | `(defaulted: another host has its own agents and folders)` | 01 |
| Edit host and Add host move from the Folder list to the Host list, under Manage | `(defaulted: they are about hosts)` | 01 |
| A connecting host does nothing when picked | `(defaulted: it has no fix to offer yet)` | 01 |
| A window with one host shows no Host pill | `(defaulted: there is nothing to pick)` | 01 |

## Proposed architecture

- **Data flow** - the Host pill reads the picked host's connection and refusal from the store, through `hostState`.
- **Event flow** - a pick runs `pickHost`, and a fix runs `fixHost`.
- **State flow** - the picked host is kept as before, by `writeLastHost`.
- **Layer responsibilities** - `src/resources/sessions/New.tsx`: the pills and their lists. `src/bridges/host-state.ts`: the fix for a state.
- **Source-of-truth files** - [`code://src/bridges/host-state.ts`](../../../../src/bridges/host-state.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the box picks the host first](task-01-the-box-picks-the-host-first.md) | implemented | - |

## Risks and tradeoffs

- Branch `composer/20261028-0951-a-custom-agent-picker` also changes `New.tsx`, and one hunk conflicts: the head of the folded tray.
- To resolve it, keep the host name from this branch, then `{agentName}` from the agent picker.

## Resume state

- **Done so far:** task 01 is implemented, on branch `composer/20261030-0718-a-host-pill-before-the-folder`, in a PR.
- **Next action:** Softov reviews.
- **Open questions:** none.
- **Watch out for:** the Host pill shows only when the embedder gives `mode: 'multi'`; a browser alone is a window with one host.

## Final verification checklist

- [x] The tray reads Host, Folder, Agent, and the folded tray names the host.
- [x] A refused host opens the host form, and a down host offers Retry.
- [x] Another connected host starts its folder from its home.
- [x] Checked at 1280 light and 420 dark; `pnpm typecheck` and `pnpm test` pass.
