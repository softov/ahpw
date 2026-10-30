---
title: A bot chat beside the session - implemented
date: 2026-10-30
refs:
  - git://19769ec
  - "[code://src/resources/bots/index.ts](../../../../src/resources/bots/index.ts)"
  - "[code://src/resources/bots/sidebar.ts](../../../../src/resources/bots/sidebar.ts)"
  - "[code://src/resources/sessions/index.ts](../../../../src/resources/sessions/index.ts)"
---

A bot chat is a session tab that opens on `main` or in the right sidebar.
The right-click menu of a bot has "Open on main" and "Open on right".
The chat icon, a send from the popover and "Open chat" follow `ui.botChatOpens`: Ask, Main or Right, default Ask.
With Ask, the next open asks where, and the setting keeps the answer.

## What was built

- [`code://src/resources/sessions/index.ts`](../../../../src/resources/sessions/index.ts) - `ahp.openSession` takes a `place`; an open in one place closes the session's tab in the other.
- [`code://src/resources/bots/sidebar.ts`](../../../../src/resources/bots/sidebar.ts) - `BOT_CHAT_OPENS` and `ChatPlace`.
- [`code://src/resources/bots/index.ts`](../../../../src/resources/bots/index.ts) - `chatPlace`, and `ahp.chatWithBot` with a `place`.
- [`code://src/resources/bots/Explorer.tsx`](../../../../src/resources/bots/Explorer.tsx) and [`code://src/resources/bots/layer/BotLayer.tsx`](../../../../src/resources/bots/layer/BotLayer.tsx) - the two menu items.
- [`code://src/shell/ui-settings/settings.ts`](../../../../src/shell/ui-settings/settings.ts) and [`code://src/resources/host/sections.ts`](../../../../src/resources/host/sections.ts) - `ui.botChatOpens` in the Bot section.

## Verified

- `settings.test.ts`, `sections.test.ts` and `shown.test.ts` cover the setting, the Bot section and a closed active key.
- `pnpm typecheck`, `pnpm test` and `pnpm build` pass on the merged branch, with 629 tests; CI on PR #19 passes.
- Checked by hand against a host with three bots, at 1280 light and 420 dark.
- Both menus open the chat, a menu place does not ask, and "Open chat" asks once.
- A send from the popover was not run by hand, because a send runs the bot.

## Departures from the plan

- Tasks 01 and 02 were built, then dropped: Softov chose one setting with Ask, Main and Right, and no bot pick for each host. Task 03 removed the Bot tab, the picks, `ahp.chatWithBotInSidebar` and `SidebarChat.tsx`.
- The head of a session and of `BotChat` moves into the turns and sticks, so the turns pass under it.

## Left for later

- A drag of a chat tab from `main` to the right sidebar - see [deferred.md](deferred.md).
