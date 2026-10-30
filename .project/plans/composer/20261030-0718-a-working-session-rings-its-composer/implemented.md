---
title: A working session rings its composer - implemented
date: 2026-10-30
refs:
  - git://c5daf3c
  - git://3137b1c
  - "[code://src/resources/sessions/status.ts](../../../../src/resources/sessions/status.ts)"
  - "[code://src/style/app.css#L554](../../../../src/style/app.css#L554)"
---

While a session's turn runs, a light moves around the border of its composer. While the turn waits for the person, the border stays in the warning colour. With reduced motion, the ring does not move and takes the accent colour.

## What was built

- [`code://src/resources/sessions/status.ts`](../../../../src/resources/sessions/status.ts) - `ringOf(status)`: `running`, `input` or nothing, from `activityOf`.
- [`code://src/resources/sessions/Composer.tsx#L375`](../../../../src/resources/sessions/Composer.tsx#L375) - `data-ring` on `.web-composer__box`.
- [`code://src/style/app.css`](../../../../src/style/app.css) - the moving ring, a masked `conic-gradient` on `::before` turned by the `--web-ring-angle` property; the warning ring; the still ring for reduced motion.

## Verified

- [`code://src/resources/sessions/status.test.ts`](../../../../src/resources/sessions/status.test.ts) - `ringOf` gives `running` for 8, `input` for 24, and nothing for idle, error and read.
- `pnpm typecheck` and `pnpm test` passed, and CI passed on PR #16.
- By hand on a live running session from the host on 37537, at 1280 light, 420 dark, and 1280 dark with reduced motion.
- The waiting ring was checked with the state set on the box by hand, because no session waited at the time.

## Departures from the plan

- None.

## Left for later

- Nothing.
