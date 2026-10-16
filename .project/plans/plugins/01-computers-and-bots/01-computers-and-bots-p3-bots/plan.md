---
title: Bots
domain: plugins
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugins/01-computers-and-bots/01-computers-and-bots-p1-offers-and-bood/plan.md
refs:
  - "[code://src/resources/automations/Explorer.tsx](../../../../../src/resources/automations/Explorer.tsx) - a list over every shown host"
  - "[code://src/resources/automations/Edit.tsx](../../../../../src/resources/automations/Edit.tsx) - a hand-written form page"
  - file:///github/ahpd/packages/bot/src/catalogue.ts - the catalogue channel
  - file:///github/ahpd/packages/bot/src/record.ts - `BotRecord` and its rules
  - file:///github/ahpapp/src/bots.ts - `recordBody`, `slugOf`
  - file:///github/ahpapp/src/components/BotEditor.tsx - the form's fields and order
---

## Goal

A host's bots list in the side bar, open in a page, and are made, edited and deleted from a form with a live preview.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p3.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the bots list and page](task-01-the-bots-list-and-page.md) | done | - |
| [02 - the bot form](task-02-the-bot-form.md) | done | 01 |

## Risks and tradeoffs

- A deleted bot's slug is never free again - a refused slug gets the next one, up to five tries, as ahpapp does.

## Resume state

- **Done so far:** both tasks, 2026-10-16; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the catalogue's actions carry `bot`, not `id` and `record` as the computers channel does.

## Final verification checklist

- [x] Bots list with their drawing, mono and multi, and open in a page.
- [x] The form makes, edits and deletes a bot.
- [x] `pnpm test` and `pnpm typecheck` pass.
