---
title: Pinned sessions show on top
status: done
depends: [task-01-two-grouping-keys-day-and-week.md]
layer: "src/resources/sessions"
refs:
  - "[code://src/resources/sessions/Explorer.tsx](../../../../../src/resources/sessions/Explorer.tsx) - `menuOf`, the row menu Pin joins"
  - "file:///github/ahpapp/src/observed.ts - a mark that is the person's own, keyed by host and URI"
---

## Objective

A session's row menu has Pin and Unpin.
Pinned sessions show in a Pinned section on top, whatever the grouping, and their rows show a pin.

## Files

- `CREATE: src/resources/sessions/pins.ts` - `PINS_KEY` under `hostKey`, `readPins`, `writePins`, `togglePin(refKey)`, and `SESSIONS_PINS`.
- `UPDATE: src/resources/sessions/Explorer.tsx` - Pin or Unpin in `menuOf`; pinned rows first, under the Pinned heading.
- `UPDATE: src/resources/sessions/index.ts` - load the pins into the store.
- `UPDATE: src/i18n` - `sessions/pin`, `sessions/unpin`, `sessions/grouping/pinned`, in every locale.

## Steps

1. Write `pins.ts` and its test.
2. Add Pin and Unpin to the row menu.
3. Put the pinned rows in their own section on top.

## Validation

- `src/resources/sessions/pins.test.ts`: a pin toggles, and two hosts' same URI are two pins.
- `pnpm test` and `pnpm typecheck` pass.
- By hand: a pinned session stays on top across groupings and a reload.

## Resume

- Done 2026-10-16: `src/resources/sessions/pins.ts` keeps the pins per window; a session's menu has Pin or Unpin.
- Pinned sessions show under Pinned on top; with no grouping, the rest go under Other sessions.
- Verified: `pins.test.ts`; seen in a browser, a pinned session on top under two groupings.
