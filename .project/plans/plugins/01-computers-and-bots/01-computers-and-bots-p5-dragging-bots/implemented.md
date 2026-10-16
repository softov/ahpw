---
title: Dragging bots - implemented
date: 2026-10-16
refs:
  - git://main
  - "[code://src/resources/bots/layer/pucks.ts](../../../../../src/resources/bots/layer/pucks.ts)"
---

A person drags a bot, or a whole puck when held, to any edge or onto another puck, and it stays there in this browser.

## What was built

- [`code://src/resources/bots/layer/pucks.ts`](../../../../../src/resources/bots/layer/pucks.ts) - the moves and their storage under `hostKey('ahpd-web.bot-pucks')`.
- [`code://src/resources/bots/layer/BotLayer.tsx`](../../../../../src/resources/bots/layer/BotLayer.tsx) - the pointer handling, the ghost, the target ring.

## Verified

- `pucks.test.ts`, the suite and `pnpm typecheck` pass.
- In a browser with real mouse events: out to an edge, kept after a reload; onto a puck; a whole puck held and moved.

## Departures from the plan

- The popover opens off the puck's edge, which the plan did not say.

## Left for later

- None.
