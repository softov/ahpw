---
title: The bot layer
domain: plugins
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugins/01-computers-and-bots/01-computers-and-bots-p3-bots/plan.md
refs:
  - "[code://src/shell/notify/index.ts#L20-L34](../../../../../src/shell/notify/index.ts#L20-L34) - an always-on component mounted in the `overlay` surface"
  - "[code://src/resources/sessions/Page.tsx#L174-L176](../../../../../src/resources/sessions/Page.tsx#L174-L176) - `send`, which dispatches to the session's chat"
  - "[code://src/resources/sessions/Composer.tsx#L292-L296](../../../../../src/resources/sessions/Composer.tsx#L292-L296) - `messageOf`, and `chat/turnStarted` or a queued message"
  - file:///github/ahpapp/src/components/BotLayer.tsx - pucks and the popover
  - file:///github/ahpapp/src/components/BotCluster.tsx - up to four bodies and `+N`
  - file:///github/scena/packages/scena/src/ui/overlay/Popup.tsx - `Popup`, anchored and closed on Escape
---

## Goal

Every shown host's bots float in pucks on the window's right edge, and a click opens a popover that talks to the bot.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p4.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - pucks and the popover](task-01-pucks-and-the-popover.md) | done | - |

## Risks and tradeoffs

- Pucks cover the page's edge - they are tucked past the edge, and come out on hover.

## Resume state

- **Done so far:** task 01, 2026-10-16; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the layer sits under the toasts (z-index below 900).

## Final verification checklist

- [x] Bots float on the right edge, four to a puck, then `+N`.
- [x] A click opens the popover; a message reaches the bot's session.
- [x] `plans/index.md` updated.
