---
title: Bot chat and bood life - implemented
date: 2026-10-18
refs:
  - git://7de1f08
  - npm://@cofold/bood@0.2.0
  - "[code://src/resources/bots/chat/BotChat.tsx](../../../../src/resources/bots/chat/BotChat.tsx)"
  - "[code://src/resources/bots/Bood.tsx](../../../../src/resources/bots/Bood.tsx)"
  - "[code://src/resources/bots/look.ts](../../../../src/resources/bots/look.ts)"
---

A session with a bot's mark opens as a chat with that bot, the floating bots live (they follow the pointer, stare, tilt, glance and play their moves), any body bood draws can be a bot's, and ahpw takes bood from npm.

## What was built

- [`code://src/resources/bots/chat/BotChat.tsx`](../../../../src/resources/bots/chat/BotChat.tsx) - the chat page a marked session opens as: the person's messages, the bot's bubbles, notices and the bot's state over the composer.
- [`code://src/resources/bots/Bood.tsx`](../../../../src/resources/bots/Bood.tsx) - a bot's life: pointer follow, stares, tilts, glances, a move every few minutes (`actEvery`), arrival.
- [`code://src/resources/bots/look.ts`](../../../../src/resources/bots/look.ts) - the bodies bood draws, old tags read through bood's aliases.
- [`code://package.json`](../../../../package.json) - `@cofold/bood@^0.2.0` from npm, with no local link.

## Verified

- `pnpm typecheck`, `pnpm test` (434) and `pnpm build` pass on bood 0.2.0 from the store.
- On scratch hosts: the chat page with a bot's mark, its bubbles and an approval in one; bots in every body saved, listed and drawn.
- Softov uses the chat page against a host with ahpd plugin/52 p2 at a desktop width.

## Departures from the plan

- Task 03 installs bood 0.2.0, not 0.1.2: 0.1.2 was staged on npm and never approved, and 0.2.0 carries it with the names, the random flame and `glide`.

## Left for later

- The chat page at a phone width against a host with plugin/52 p2 is not checked yet.
