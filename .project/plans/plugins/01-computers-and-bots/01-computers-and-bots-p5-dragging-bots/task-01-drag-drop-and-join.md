---
title: Drag, drop and join
status: done
depends: []
layer: "src/resources/bots/layer"
refs:
  - file:///github/ahpapp/src/bots.ts - `joinPuck`, `takeOut`, `snapPuck`, `puckAt`
---

## Objective

Holding a bot 300 ms, or a puck of one, drags the whole puck; otherwise one bot comes out.
A drop on a puck joins it; elsewhere it snaps to the nearest edge as a new puck.

## Files

- `UPDATE: src/resources/bots/layer/pucks.ts` - `joinPuck`, `takeOut`, `snapPuck(point, size)`, `readPucks`, `writePucks` under `hostKey('ahpd-web.bot-pucks')`.
- `UPDATE: src/resources/bots/layer/BotLayer.tsx` - pointer events, a ghost under the pointer, a ring on the target puck.

## Steps

1. Add the pure moves and their tests.
2. Add the pointer handling.
3. Keep the pucks in storage.

## Validation

- `pucks.test.ts`: join, take out, snap to each edge.
- By hand: drag a bot to the left edge, reload, it is still there.

## Resume

- Done 2026-10-16: `joinPuck`, `takeOut`, `snapPuck`, `readPucks`, `writePucks` with their tests; pointer handling, the ghost and the target ring.
- A click now comes from the pointer's release, so Enter and Space open a bot from the keyboard.
- The popover opens off the puck's edge: above a bottom puck, below a top one.
- Checked in a browser with real mouse events: Lia to the left edge, kept after a reload.
- Then Lia onto the right puck, and the whole puck held and moved to the bottom.
