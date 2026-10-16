---
title: Offers and bood - implemented
date: 2026-10-16
refs:
  - git://main
  - npm://@cofold/bood@^0.1.0
  - "[code://src/bridges/offers.ts](../../../../../src/bridges/offers.ts)"
  - "[code://src/resources/bots/Bood.tsx](../../../../../src/resources/bots/Bood.tsx)"
---

ahpw knows which plugins each host serves, and draws a bot with `@cofold/bood`.

## What was built

- [`code://src/bridges/offers.ts`](../../../../../src/bridges/offers.ts) - the offers off the `initialize` answer, at `ahpPaths(host).offers`.
- [`code://src/resources/bots/look.ts`](../../../../../src/resources/bots/look.ts) and [`code://src/resources/bots/Bood.tsx`](../../../../../src/resources/bots/Bood.tsx) - a bot's body and colour, drawn.

## Verified

- `offers.test.ts`, `look.test.ts`, the suite and `pnpm typecheck` pass against `@cofold/bood` 0.1.0 from npm.

## Departures from the plan

- None.

## Left for later

- None.
