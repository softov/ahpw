---
title: The bots list and page
status: done
depends: []
layer: "src/resources/bots, src/shell"
refs:
  - "[code://src/resources/automations/index.ts](../../../../../src/resources/automations/index.ts) - registration and the sidebar mount"
  - "[code://src/shell/explorer/ExplorerList.tsx](../../../../../src/shell/explorer/ExplorerList.tsx) - `Row`, which has a dot and no icon slot yet"
---

## Objective

A 👾 entry opens a list of every shown host's bots: a still drawing, name, labels and host.
A bot's page shows its drawing, description, labels, owner, session, made and changed dates, with Open chat, Edit and Delete.

## Files

- `CREATE: src/resources/bots/catalogue.ts` - `BOTS = 'x-ahpd-bots://'`, `botsReducer` (snapshot `{bots}`, added and changed with `bot`, removed with `id`), `BotRecord` (`import type` from `@ahpd/bot`).
- `CREATE: src/resources/bots/state.ts`, `index.ts`, `Explorer.tsx`, `Page.tsx`.
- `UPDATE: src/shell/explorer/ExplorerList.tsx` - `Row.icon?: ReactNode`, drawn in place of the dot when given.
- `UPDATE: src/shell/register-shell.tsx` - the `bots:nav` mount after `computers:nav`; `registerBots(scena)`.
- `UPDATE: src/resources/emojis.ts` - `bots: mono('👾')`.
- `UPDATE: src/i18n/{en,es,pt}.json` - `bots/*`, `shell/nav/bots`.

## Steps

1. Write `catalogue.ts` and its test.
2. Register the list, the page and `ahp.openBot`; Open chat runs `ahp.openSession` on the bot's `session`.
3. Delete asks the person to confirm, then `resourceDelete bot://<slug>`.

## Validation

- `catalogue.test.ts`: the reducer folds the three actions.
- By hand: a bot made with `doop` shows, opens, and its chat opens.

## Resume

- Done 2026-10-16: `catalogue.ts`, `state.ts`, `index.ts`, `Explorer.tsx`, `Page.tsx`, the `bots:nav` mount, `Row.icon`, the words and CSS.
- Delete and Open chat are commands, `ahp.deleteBot` and `ahp.chatWithBot`, shared by the menu and the page.
- Checked in a browser: the list draws each bot; the page; Open chat opens the bot's session; Delete asks, then the bot goes.
