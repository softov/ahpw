---
title: Computers and bots in ahpw - what exists and what Softov chose
date: 2026-10-16
refs:
  - file:///github/ahpd/packages/computer/src/provider.ts - the `computer:` scheme and the `x-ahpd/computers/*` methods
  - file:///github/ahpd/packages/computer/src/catalogue.ts - the `x-ahpd-computers://` records channel
  - file:///github/ahpd/packages/computer/src/manifest.ts - `MANIFEST_SCHEMA`, which the create form is drawn from
  - file:///github/ahpd/packages/bot/src/record.ts - `BotRecord`, `BOT_BODIES`, `BOT_COLORS`, the slug rule
  - file:///github/ahpd/packages/bot/src/catalogue.ts - the `x-ahpd-bots://` catalogue channel
  - file:///github/ahpapp/src/computers.ts - ahpapp's computer helpers, with the method or resource fallback
  - file:///github/ahpapp/src/components/ComputerDetail.tsx - ahpapp's computer panel
  - file:///github/ahpapp/src/components/MachineForm.tsx - ahpapp's create form, from the manifest schema
  - file:///github/ahpapp/src/bots.ts - ahpapp's bot helpers and `recordBody`
  - file:///github/ahpapp/src/components/BotEditor.tsx - ahpapp's bot form
  - file:///github/ahpapp/src/components/BotLayer.tsx - ahpapp's floating bots
  - file:///github/cofold/packages/bood/src/index.ts - `@cofold/bood`, with `mountBood` in its `./dom` entry
---

Softov asked, 2026-10-16, for computers as a resource, with an explorer listing and a panel.
He also asked for bots with an explorer, a panel and a form to create one, using cofold's bood and following ahpapp.
Neither is part of AHP: both come from ahpd plugins, reached through resource commands, plugin channels and `x-ahpd/...` methods.

## What exists

- Computers: `computer://` lists the machines, each a folder with `status`, `capabilities`, `stats` and `state` files.
- A machine is made by `x-ahpd/computers/create`, and started, stopped, restarted and removed by its sibling methods.
  ahpapp falls back to resource writes when a host does not offer a method.
- `x-ahpd-computers://` is a records channel of `{ id, record: { state, status } }`.
- Bots: `bot://` lists them; a bot is read, made with `createOnly`, edited with `ifMatch` on `updatedAt`, and deleted, all as resources.
- `x-ahpd-bots://` sends the bots, then added, changed and removed.
- A bot's body is one of ahpd's 15 `BOT_BODIES`, and its colour one of 11 names or `#rrggbb`.
- `@cofold/bood` draws a creature with a DOM renderer and has no React component.
- ahpw has nothing for either yet.

## Answers

| What | Source |
| --- | --- |
| ahpw depends on `@cofold/bood`, with a small React `Bood` over `mountBood`. | Softov, 2026-10-16: "Depend on @cofold/bood" |
| The bot form has the look (body, colour, preview), name, labels, description, owner, and instructions. | Softov, 2026-10-16, all four field groups chosen |
| Bots also float on screen, as ahpapp's bot layer and clusters do. | Softov, 2026-10-16: "Yes, include it" |
| Plan 03 is finished first, then computers and bots get their own plan. | Softov, 2026-10-16: "Finish plan 03, then these" |
| Softov publishes `@cofold/bood`; ahpw adds `^0.1.0`. | Softov, 2026-10-16: "You publish it" |
| The bot layer comes first as pucks on the right edge with a popover, then dragging. | Softov, 2026-10-16: "Core, then drag" |
| Instructions are editable too, not only on create. | Softov, 2026-10-16: "Editable too" |

The plan is [plugins/01](../plans/plugins/01-computers-and-bots/plan.md).
