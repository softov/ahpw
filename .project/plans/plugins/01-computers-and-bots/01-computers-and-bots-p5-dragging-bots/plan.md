---
title: Dragging bots
domain: plugins
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugins/01-computers-and-bots/01-computers-and-bots-p4-the-bot-layer/plan.md
refs:
  - file:///github/ahpapp/src/bots.ts - `joinPuck`, `takeOut`, `snapPuck`
  - file:///github/ahpapp/src/components/BotLayer.tsx - the drop rules
---

## Goal

A person drags a bot or a whole puck to any of the four edges, or onto another puck to join it.
It stays there in this browser.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p5.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - drag, drop and join](task-01-drag-drop-and-join.md) | done | - |

## Risks and tradeoffs

- A drag and a click share the pointer - a drag starts after a 6 pixel move, as ahpapp does.

## Resume state

- **Done so far:** task 01, 2026-10-16; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a puck's place is a share along its edge, so it survives a window resize.

## Final verification checklist

- [x] A bot is dragged out of its puck to another edge, and a puck onto another.
- [x] The places hold after a reload.
- [x] `plans/index.md` updated.
