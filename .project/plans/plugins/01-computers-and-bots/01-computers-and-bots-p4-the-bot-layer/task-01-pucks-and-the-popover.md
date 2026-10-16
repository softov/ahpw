---
title: Pucks and the popover
status: done
depends: []
layer: "src/resources/bots/layer"
refs:
  - "[code://src/shell/notify/index.ts#L20-L34](../../../../../src/shell/notify/index.ts#L20-L34) - the overlay mount"
  - "[code://src/resources/sessions/Composer.tsx#L292-L296](../../../../../src/resources/sessions/Composer.tsx#L292-L296) - turn start or queue"
---

## Objective

`BotLayer` draws the bots in pucks of up to four on the right edge, with `+N` for the rest.
Hover makes a bot `observing`, and an open one `happy`.
A click opens a `Popup` with name, labels, description, a one-line composer, Open chat and Edit.

## Files

- `CREATE: src/resources/bots/layer/pucks.ts` - `Puck { id, edge, at, bots }`, `fillPucks(bots, pucks)`, `splitCluster(bots, 4)`.
- `CREATE: src/resources/bots/layer/BotLayer.tsx`, `BotPopover.tsx`.
- `UPDATE: src/resources/bots/index.ts` - the `BotLayer` chrome component and its overlay mount.
- `UPDATE: src/style/app.css` - `.web-bots`, `.web-bot-puck`, `.web-bot-popover`.

## Steps

1. Write `pucks.ts` and its test.
2. Draw the pucks from every shown host's catalogue.
3. The composer sends `chat/turnStarted`, or a queued message while a turn runs, to the bot's session's default chat.

## Validation

- `pucks.test.ts`: a new bot joins the right edge's puck; a puck of six shows four and `+2`.
- By hand: a message from the popover appears in the bot's chat.

## Resume

- Done 2026-10-16: `layer/pucks.ts` with its test, `layer/BotLayer.tsx`, `layer/BotPopover.tsx`, the overlay mount, the words and CSS.
- The popover follows the bot's session for its default chat, and the chat for a turn already running.
- Checked in a browser: six bots draw four and `+2`; the overflow list opens Teo; a message from Mia's popover reached her chat.
