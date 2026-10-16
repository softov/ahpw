---
title: The bot form makes and edits a bot
status: done
depends: [task-01-the-bots-list-and-page.md]
layer: "src/resources/bots"
refs:
  - "[code://src/resources/automations/Edit.tsx](../../../../../src/resources/automations/Edit.tsx) - `web-form` fields, the host picker, Save and Cancel"
  - file:///github/ahpapp/src/components/BotEditor.tsx - the fields, the preview, the owner picker
  - file:///github/ahpapp/src/bots.ts - `recordBody`, `freshLook`
---

## Objective

New bot and Edit open a form page: the drawing as a preview, colour swatches and a body grid.
Then name, host in multi on create, owner, labels, description and instructions.
Create writes `bot://<slug>` with `createOnly`; Edit writes with `ifMatch: updatedAt`; a conflict shows the host's words and reloads.

## Files

- `CREATE: src/resources/bots/Edit.tsx` - `BotEdit({ host, slug? })`.
- `CREATE: src/resources/bots/draft.ts` - `BotDraft`, `draftOf(record?)`, `freshLook(bots)`, `recordBody(draft, fresh)`, `parseLabels`.
- `UPDATE: src/resources/bots/index.ts` - `ahp.newBot`, `ahp.editBot`.

## Steps

1. Write `draft.ts` and its test.
2. Write the form; the owner picker offers self, the person's teams and the host, as ahpapp does.
3. Instructions show on edit too, with the hint that only later chats use a change.

## Validation

- `draft.test.ts`: `recordBody` sends owner only on create; `parseLabels` splits and de-duplicates.
- By hand: make a bot, change its colour, delete it.

## Resume

- Done 2026-10-16: `Edit.tsx`, `draft.ts` with its test.
- The owner offers the maker and, where the manifest names it, this host; ahpd sends no teams to pick from.
- Checked in a browser: made `ana-cafe`, edited it to a green ghost, deleted it; the same name then made `ana-cafe-2`.
- ahpd reads a blank description or instructions as absent, so an edit cannot clear them.
