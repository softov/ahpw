---
title: The bot layer - implemented
date: 2026-10-16
refs:
  - git://main
  - "[code://src/resources/bots/layer/BotLayer.tsx](../../../../../src/resources/bots/layer/BotLayer.tsx)"
---

The shown hosts' bots float in a puck on the window's right edge, and a click opens a popover that talks to the bot.

## What was built

- [`code://src/resources/bots/layer/`](../../../../../src/resources/bots/layer/) - the pucks, the layer and the popover.

## Verified

- `pucks.test.ts`, the suite and `pnpm typecheck` pass.
- In a browser with six bots: four drawn and `+2`, the overflow list, and a message that reached the bot's chat.

## Departures from the plan

- None.

## Left for later

- None.
