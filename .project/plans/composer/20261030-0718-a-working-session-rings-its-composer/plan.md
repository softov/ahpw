---
title: A working session rings its composer
domain: composer
status: active
priority: low
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - "[code://src/resources/sessions/status.ts](../../../../src/resources/sessions/status.ts) - `activityOf`, which reads a running turn and a turn that waits from the session status"
  - "[code://src/resources/sessions/Composer.tsx](../../../../src/resources/sessions/Composer.tsx) - the session composer's box"
  - file:///github/doop/packages/web/src/app/globals.css - `.composer-input-border.working`, doop's ring: a `conic-gradient` turned by an `@property` angle
---

## Goal

While a session's turn runs, a light moves around the border of its composer.
While the turn waits for the person, the border stays in the warning colour.
A person sees which session works, and which one needs them, without reading its status.

## Reconnaissance

### Searches performed

- `rg "activityOf" src` - the page header and the session list read the activity from `summary.status`; the composer does not.
- `rg "composer-input-border" /github/doop/packages/web/src` - doop's ring, a masked `conic-gradient` on a pseudo-element.

### Runtime path

```
summary.status -> ringOf -> data-ring on .web-composer__box -> CSS ring
```

### Gaps

- The composer shows no sign of a running or waiting turn, other than the stop button.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A light moves around the composer while a turn runs | Softov, 2026-10-30: "session working show a effect cyrcling the composer" | 01 |
| A turn that waits for the person shows a steady warning ring | Softov, 2026-10-30, question answer: "A steady warning ring" | 01 |
| The ring takes the theme's accent colour, not doop's indigo and violet | `(defaulted: ahpw draws with the theme tokens)` | 01 |
| With reduced motion the ring does not move and the border takes the accent colour | `(defaulted: ahpw stops animations for reduced motion)` | 01 |
| The session composer only; the new session box has no turn | `(defaulted: a box with no session has nothing running)` | 01 |

## Proposed architecture

- **Data flow** - `ringOf(summary.status)` gives `running`, `input` or nothing.
- **Event flow** - none; the status comes with the session summary.
- **State flow** - no state; the attribute follows the summary.
- **Layer responsibilities** - `src/resources/sessions/`: the attribute. `src/style/app.css`: the ring.
- **Source-of-truth files** - [`code://src/resources/sessions/status.ts`](../../../../src/resources/sessions/status.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the composer rings while a turn runs](task-01-the-composer-rings-while-a-turn-runs.md) | implemented | - |

## Risks and tradeoffs

- The ring moves for as long as a turn runs, which can be minutes; reduced motion stops it.

## Resume state

- **Done so far:** task 01 is implemented, on branch `composer/20261030-0718-a-working-session-rings-its-composer`, in a PR.
- **Next action:** Softov reviews.
- **Open questions:** none.
- **Watch out for:** `@property` animates the angle; without it the ring stays still.

## Final verification checklist

- [x] A running session shows the moving ring, and a waiting one the warning ring.
- [x] Reduced motion shows a still accent border.
- [x] Checked at 1280 light, 420 dark and 1280 dark with reduced motion; `pnpm typecheck` and the status tests pass.
