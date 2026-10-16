---
title: A computer's page
status: done
depends: [task-01-the-computers-list.md]
layer: "src/resources/computers"
refs:
  - "[code://src/resources/automations/Page.tsx](../../../../../src/resources/automations/Page.tsx) - facts with `HostTag`, actions in the page header"
  - file:///github/ahpapp/src/components/ComputerDetail.tsx - Usage tiles, Mounts, Made from, Danger zone
---

## Objective

Opening a computer shows a page: host, state words, image; Usage (CPU, memory, PIDs, network, disk) polled every 5 seconds while running; Mounts; Made from.
Its actions are Start or Stop, Restart, and Remove behind a confirm.

## Files

- `CREATE: src/resources/computers/Page.tsx` - `ComputerPage({ host, id })`.
- `CREATE: src/resources/computers/usage.ts` - `usageOf(stats)`, `sizeWords(bytes)`.
- `UPDATE: src/resources/computers/index.ts` - `ahp.openComputer`, the `ComputerPage` component.

## Steps

1. Read `computer://<id>/status` on open and after each action; poll `/stats` while running.
2. Draw the sections; leave out a field the runtime does not give.
3. Wire the actions to the calls in `machines.ts`; Remove uses `confirm` with `tone: 'danger'`.

## Validation

- `usage.test.ts`: a stopped machine gives none; sizes in binary units.
- By hand: Stop, Start, Restart and Remove on a scratch machine.

## Resume

- Done 2026-10-16: `Page.tsx`, `usage.ts`, the page CSS.
- The page reads the channel's record, which carries `status`, so it follows changes without reading the leaf.
- The page prop is `machine`, since scena keeps `id` for itself.
- Checked in a browser: the ssh box's page shows host, destination and the folded record.
- Not checked by hand: Start, Stop, Restart, Remove and Usage, since this machine has no Docker.
