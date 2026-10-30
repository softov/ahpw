---
title: A bot chat opens on main or on the right
status: done
depends: []
layer: "bots, sessions, shell ui-settings, host settings"
refs:
  - "[code://src/resources/sessions/index.ts#L239-L262](../../../../src/resources/sessions/index.ts#L239-L262) - `ahp.openSession`, which takes a `place`"
  - "[code://src/resources/bots/index.ts#L38-L51](../../../../src/resources/bots/index.ts#L38-L51) - `chatPlace`, which asks once and keeps the answer"
  - "[code://src/resources/bots/index.ts#L134-L158](../../../../src/resources/bots/index.ts#L134-L158) - `ahp.chatWithBot`, which takes a `place`"
  - "[code://src/resources/bots/Explorer.tsx#L45-L47](../../../../src/resources/bots/Explorer.tsx#L45-L47) - the right-click menu of a bot in the explorer"
  - "[code://src/resources/bots/layer/BotLayer.tsx#L256](../../../../src/resources/bots/layer/BotLayer.tsx#L256) - the right-click menu of a floating bot"
  - "[code://src/resources/sessions/view-settings.ts#L16-L43](../../../../src/resources/sessions/view-settings.ts#L16-L43) - `chatChoice`, the shape of `BOT_CHAT_OPENS`"
  - "[code://src/shell/notify/confirm.ts](../../../../src/shell/notify/confirm.ts) - `choose`, the question with two buttons"
---

## Objective

A bot chat opens as a session tab on `main` or in the right sidebar.
The right-click menu of a bot has "Open on main" and "Open on right".
The chat icon, a send from the popover and the "Open chat" button follow the `ui.botChatOpens` setting, Ask, Main or Right.
With Ask, the next open asks where, and the setting keeps the answer.

## Files

- `UPDATE: src/resources/sessions/index.ts` - `OpenSessionArgs.place`; a tab on the right is a `SessionPage` with `beside`, and an open in one place closes the tab in the other.
- `UPDATE: src/resources/sessions/Page.tsx` - the doc of `beside`; the head moves into the turns, so the turns pass under it.
- `UPDATE: src/resources/bots/chat/BotChat.tsx` - the head moves into the turns, as on a session.
- `UPDATE: src/style/app.css` - both heads stick and fade to the surface colour; the turns lose their padding and keep the gutter on each turn.
- `UPDATE: src/resources/sessions/view-settings.ts` - export `chatChoice`.
- `UPDATE: src/resources/bots/sidebar.ts` - `BOT_CHAT_OPENS` and `ChatPlace`, in place of the picks.
- `UPDATE: src/resources/bots/index.ts` - `chatPlace`, and `BotArgs.place` passed to `ahp.openSession`; remove the Bot tab and `ahp.chatWithBotInSidebar`.
- `UPDATE: src/resources/bots/Explorer.tsx` - the two menu items with their `place`.
- `UPDATE: src/resources/bots/layer/BotLayer.tsx` - the two menu items with their `place`; the bood comes back when its chat closes.
- `UPDATE: src/resources/bots/layer/shown.ts` - an active key that names a closed mount falls back to the newest open mount, as scena draws it.
- `UPDATE: src/resources/bots/layer/shown.test.ts` - the case for a closed active key.
- `UPDATE: src/shell/notify/index.ts` - export `choose`.
- `UPDATE: src/shell/ui-settings/settings.ts` - `ui.botChatOpens` in place of `ui.sidebarBot` and `ui.botChatPlace`.
- `UPDATE: src/shell/ui-settings/settings.test.ts` - the case for `ui.botChatOpens`.
- `UPDATE: src/resources/host/sections.ts` - the Bot section holds `ui.botChatOpens`.
- `UPDATE: src/resources/host/sections.test.ts` - the key order ends with `ui.botChatOpens`.
- `UPDATE: src/i18n/en.json` - `bots.actions.openMain`, `openRight`, `bots.chat.where`, `whereBody`, `host.settings.ui.botChatOpens`; remove `bots.sidebar`.
- `UPDATE: src/i18n/es.json` - the same keys in Spanish.
- `UPDATE: src/i18n/pt.json` - the same keys in Portuguese.
- `DELETE: src/resources/bots/chat/SidebarChat.tsx` - the Bot tab goes.
- `DELETE: src/resources/bots/sidebar.test.ts` - it tested the picks.

## Steps

1. Add `place` to `OpenSessionArgs`, and open a `SessionPage` with `beside` on `sidebar:right` for `right`.
2. Close the session tab in the other place before the open, so one session has one tab.
3. Write `BOT_CHAT_OPENS` with `chatChoice`, values `ask`, `main` and `right`, default `ask`.
4. Write `chatPlace`: a kept place returns it; `ask` calls `choose` and keeps the answer.
5. Make `ahp.chatWithBot` take `place` from its args, else from `chatPlace`.
6. Put "Open on main" and "Open on right" in both right-click menus.
7. Replace the two old settings with `ui.botChatOpens` in the Bot section.
8. Remove the picks, the Bot tab, `ahp.chatWithBotInSidebar` and their strings.

## Validation

- `src/shell/ui-settings/settings.test.ts` - `ui.botChatOpens` reads `ask`, offers Ask, Main and Right sidebar, and keeps `right`.
- `src/resources/host/sections.test.ts` - the Bot section holds `ui.botChatOpens`.
- `pnpm typecheck` and `pnpm test` pass.
- By hand at 1280 light and 420 dark, check that both menus have both items.
- By hand, check that a menu place does not ask and is not kept.
- By hand, check that "Open on main" moves the chat from the right.
- By hand, check that "Open chat" asks once, and the popover chat icon then opens on the right.
- By hand, check that the Bot section shows one field.
- Do not send from the popover by hand, because a send runs the bot.

## Resume

Built and checked by hand against a host with three bots, at 1280 light and 420 dark, with no horizontal scroll.
A drag of the chat tab from `main` to the right sidebar needs scena; a brief in scena holds it.
