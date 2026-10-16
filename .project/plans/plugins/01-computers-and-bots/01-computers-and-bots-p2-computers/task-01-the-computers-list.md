---
title: The computers list
status: done
depends: []
layer: "src/resources/computers, src/shell"
refs:
  - "[code://src/resources/automations/index.ts](../../../../../src/resources/automations/index.ts) - `registerChoice`, the header buttons, the sidebar mount"
  - "[code://src/resources/automations/Explorer.tsx](../../../../../src/resources/automations/Explorer.tsx) - rows from `useChannelOnEach`"
  - "[code://src/shell/register-shell.tsx#L206-L216](../../../../../src/shell/register-shell.tsx#L206-L216) - the activity bar mounts"
---

## Objective

A 💻 entry at the bottom of the activity bar opens a list of every shown host's computers.
Each row shows its state dot, name, image and host; the header has New, Reload, Status and Group.
A host that does not serve `x-ahpd-computers` is left out.

## Files

- `CREATE: src/resources/computers/machines.ts` - `COMPUTERS = 'x-ahpd-computers://'`, `computersReducer` (snapshot `{records}`, added, changed, removed), `factsOf(record)`, `standingOf(facts)`, and the method-or-resource calls `startComputer`, `stopComputer`, `restartComputer`, `removeComputer`, `createComputer`.
- `CREATE: src/resources/computers/arrange.ts` - group by none, host or state; filter all, running, stopped or problem; storage as automations' `arrange.ts`.
- `CREATE: src/resources/computers/state.ts`, `index.ts`, `Explorer.tsx`.
- `UPDATE: src/shell/register-shell.tsx` - the `computers:nav` mount after `agents:nav`; `registerComputers(scena)`.
- `UPDATE: src/resources/emojis.ts` - `computers: mono('💻')`.
- `UPDATE: src/i18n/{en,es,pt}.json` - `computers/*`, `shell/nav/computers`.

## Steps

1. Write `machines.ts` and `arrange.ts` with their tests.
2. Register the explorer, its header and its commands, as automations do.
3. Mount the activity bar entry, shown only when a shown host serves the channel.

## Validation

- `machines.test.ts`: the reducer folds the three actions; `factsOf` reads docker inspect; `standingOf` gives running, problem, stopped.
- `arrange.test.ts`: groups and filters.
- By hand: a computer made with `doop` shows in the list; stopping it moves its dot.

## Resume

- Done 2026-10-16: `machines.ts`, `arrange.ts`, `state.ts`, `actions.ts`, `Explorer.tsx`, `index.ts`, the `computers:nav` mount, the words.
- `registerChoice` moved to `src/shell/explorer/choice.ts`; automations use it too, with the same ids and keys.
- `src/bridges/served.ts`: `useServingHosts` and `trackServed`; the entry shows only while a host serves the channel.
- Start, Stop, Restart and Remove show only for a machine whose record carries docker's `State`.
- An ssh box is listed only, and ahpd reports the default runtime's `capabilities` for every machine.
- Checked in a browser, multi: beta's ssh box listed with host, destination and state.
