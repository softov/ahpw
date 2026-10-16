---
title: New session asks the host
status: done
depends: [task-04-the-host-filter.md]
layer: "src/resources/sessions"
refs:
  - "[code://src/resources/sessions/New.tsx#L94-L100](../../../../src/resources/sessions/New.tsx#L94-L100) - `NewSessionPage`, on `windowHost()`"
  - "[code://src/resources/sessions/FolderPill.tsx#L35](../../../../src/resources/sessions/FolderPill.tsx#L35) - `FolderPill`, the pattern for a pill in the tray"
  - "[code://src/resources/sessions/new-tray.ts](../../../../src/resources/sessions/new-tray.ts) - the tray's open state, kept per window"
---

## Objective

In multi, the new session tray and the new automation page have a host pill, and New terminal asks the host with a menu.
Its default is the last host used, and the agents, the folder and the session follow the host picked.

## Files

- `CREATE: src/resources/sessions/HostPill.tsx` - the pill: the host's dot and name, and a menu of the hosts.
- `CREATE: src/resources/sessions/last-host.ts` - `LAST_HOST_KEY` under `hostKey`, with `readLastHost()` and `writeLastHost(id)`.
- `UPDATE: src/resources/sessions/New.tsx:94-100` - a `host` state from `readLastHost()`; every `windowHost()` in the page becomes that state; `HostPill` in the tray in multi.
- `UPDATE: src/resources/sessions/FolderPill.tsx:35` - a `host` prop, for `childFolders` and the default folder.
- `UPDATE: src/resources/sessions/index.ts` - `ahp.newSession` takes `host?` in its arguments.
- `UPDATE: src/resources/automations/Edit.tsx`, `src/resources/automations/index.ts` - the new automation page has the same `HostPill`; `ahp.newAutomation` takes `host?`.
- `UPDATE: src/resources/terminals/index.ts` - in multi, `ahp.newTerminal` without a host opens a menu of the hosts, on scena's palette list, and creates on the one picked.

## Steps

1. Write `last-host.ts` and its test.
2. Write `HostPill`, on scena's `ContextMenu`, drawn like the folder pill.
3. Give `NewSessionPage` the `host` state, and pass it to `FolderPill`, the agents path and each request.
4. Write the host on create, and open the new session with it.
5. Give the new automation page the pill, and `ahp.newTerminal` its host menu.

## Validation

- `src/resources/sessions/last-host.test.ts`: a written host reads back; none reads the first host.
- `pnpm test` and `pnpm typecheck` pass.
- By hand, in task 08: a session made on the second host opens on it.
- By hand, in task 08: the pill keeps that host next time.

## Resume

- Done 2026-10-16: `src/resources/sessions/last-host.ts` keeps the last host picked, with `startHost` choosing it while it is listed, else the first host.
- New session has a host pill in its tray in multi, on a list command `ahp.new.host` like the agent pill's.
  Picking another host starts its agent and folder again.
- `HostPill.tsx` was not needed: the pill is the existing `Pill`.
- `FolderPill` takes the host, and the new session box keeps one composer path whichever host it is on.
- `ahp.newSession` takes `host?`, and a host with no agent still shows its pill, so another host can be picked.
- New automation picks its host with a Host select at the top of its form, since that form's fields are selects; `ahp.newAutomation` takes `host?`.
- New terminal without a host opens a list of the hosts in multi; the session sidebar's terminal button passes its session's host.
- Verified: `src/resources/sessions/last-host.test.ts`; the suite, 58 files and 341 tests, and `pnpm typecheck` pass.
