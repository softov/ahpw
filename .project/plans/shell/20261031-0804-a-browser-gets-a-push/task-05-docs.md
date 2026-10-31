---
title: The docs say how to turn push on
status: implemented
depends: [task-03-a-browser-subscribes.md, task-04-an-embedder-shows-alerts.md]
layer: docs
refs:
  - "[code://docs/use/INTERFACE.md#L46-L62](../../../../docs/use/INTERFACE.md#L46-L62) - *Notifications*, with the browser notifications"
  - "[code://docs/use/PALETTE.md#L50-L56](../../../../docs/use/PALETTE.md#L50-L56) - the *Notifications* commands"
---

## Objective

The docs say how to get a notification with the tab closed, what the audience switch does, and that ahp-desk shows alerts itself.

## Files

- `UPDATE: docs/use/INTERFACE.md:46-62` - push with the tab closed, HTTPS, the audience switch, and the desk.
- `UPDATE: docs/use/PALETTE.md:50-56` - the three push commands.

## Steps

1. Add a paragraph on push with the tab closed, after the paragraph on browser notifications.
2. Say that push needs HTTPS or `localhost`.
3. Say what each audience value sends, and that the default is every session of the person.
4. Say that ahp-desk shows the alerts itself while it runs.
5. Add the three commands to the palette table.

## Validation

- `node <do-spec>/scripts/lint-prose.mjs docs/use/INTERFACE.md docs/use/PALETTE.md` prints nothing new.
