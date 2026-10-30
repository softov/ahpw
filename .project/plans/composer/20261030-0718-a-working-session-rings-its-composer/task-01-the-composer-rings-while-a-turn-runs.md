---
title: The composer rings while a turn runs
status: done
depends: []
layer: "composer"
refs:
  - "[code://src/resources/sessions/status.ts](../../../../src/resources/sessions/status.ts) - `activityOf`"
---

## Objective

The session composer's box has a moving ring while a turn runs, and a steady warning ring while the turn waits for the person.

## Files

- `UPDATE: src/resources/sessions/status.ts` - `ringOf(status)`: `running`, `input` or undefined.
- `UPDATE: src/resources/sessions/status.test.ts` - cases for `ringOf`.
- `UPDATE: src/resources/sessions/Composer.tsx` - `data-ring` on `.web-composer__box`.
- `UPDATE: src/style/app.css` - the moving ring, the warning ring, and the still ring for reduced motion.

## Steps

1. Write `ringOf` from `activityOf`.
2. Set `data-ring={ringOf(summary.status)}` on the composer's box.
3. Draw the moving ring as a masked `conic-gradient` on `::before`, turned by an `@property` angle.
4. Draw the warning ring as a warning border with a 1px shadow.
5. Stop the animation for reduced motion, and fill the ring with the accent colour.

## Validation

- `src/resources/sessions/status.test.ts` - `ringOf` gives `running` for 8, `input` for 24, and nothing for idle, error and read.
- `pnpm typecheck` and `pnpm test` pass.
- By hand at 1280 light and 420 dark, check that the ring moves on a running session.
- By hand, check that a waiting turn shows the warning ring.
- By hand with reduced motion, check that the ring does not move.

## Resume

Built and checked on a live running session from the host on 37537.
The waiting state was set on the box by hand, because no session waited at the time.
