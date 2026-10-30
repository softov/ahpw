---
title: A bot chat beside the session
domain: sessions
status: built
priority: medium
created: 2026-10-29
revalidated: 2026-10-29
requires:
  - plans/sessions/20261028-0951-session-views-open-from-commands/plan.md
  - plans/sessions/20261028-0951-sidebar-follows-the-focused-session/plan.md
refs:
  - "[code://src/shell/right-sidebar.ts#L9](../../../../src/shell/right-sidebar.ts#L9) - `RIGHT_SIDEBAR`, the surface a chat opens on"
  - "[code://src/resources/sessions/index.ts#L239-L262](../../../../src/resources/sessions/index.ts#L239-L262) - `ahp.openSession`, which opens a session on `main` or on the right"
  - "[code://src/resources/sessions/Page.tsx#L209-L212](../../../../src/resources/sessions/Page.tsx#L209-L212) - a session page writes `ACTIVE_SESSION` while it is empty"
  - "[code://src/resources/sessions/Page.tsx#L230-L262](../../../../src/resources/sessions/Page.tsx#L230-L262) - a session with a bot's mark draws as `BotChat`"
  - "[code://src/resources/bots/catalogue.ts#L104-L116](../../../../src/resources/bots/catalogue.ts#L104-L116) - `readBotChat`, the reader's own chat with a bot"
  - "[code://src/resources/bots/index.ts#L134-L158](../../../../src/resources/bots/index.ts#L134-L158) - `ahp.chatWithBot`, the one command that opens a bot chat"
  - "[code://src/resources/sessions/view-settings.ts#L16-L43](../../../../src/resources/sessions/view-settings.ts#L16-L43) - `chatChoice`, a choice kept in localStorage per browser"
  - "[code://src/shell/ui-settings/settings.ts#L23-L35](../../../../src/shell/ui-settings/settings.ts#L23-L35) - `UiSetting`, the shape of a UI setting"
  - "[code://src/resources/host/sections.ts#L37-L42](../../../../src/resources/host/sections.ts#L37-L42) - the sections of the Interface tab"
  - https://code.visualstudio.com/docs/copilot/chat/copilot-chat - VS Code shows Chat in the secondary side bar, beside the editor
---

## Goal

A person works in a session in the main area and talks with a bot in the right sidebar at the same time.
A bot chat is a session tab, and it opens on `main` or in the right sidebar.
The right-click menu of a bot names the place.
The other ways to open a chat follow a UI setting that asks once and keeps the answer.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "readBotChat" src` - only `ahp.chatWithBot` reads the chat.
- `rg "chatWithBot" src` - the explorer menu, the floating bot's menu, the popover and the bot page call it.
- `rg "BotChat" src` - `SessionPage` draws a bot's chat; no other component does.
- `rg "DragPayload" /github/scena/src` - a tab drag stays in one surface.

### Runtime path

```
menu (place) or chat icon, send, Open chat (ui.botChatOpens, asks when ask)
  -> ahp.chatWithBot -> readBotChat -> ahp.openSession { place }
  -> SessionPage on main, or with beside on sidebar:right -> BotChat
```

### Gaps

- `ahp.openSession` opens only on `main`.
- A `SessionPage` outside `main` still writes `ACTIVE_SESSION`.
- scena has no drag of a tab from one surface to another.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The session opens in the main area, and a bot chat can open in the right sidebar | Softov, 2026-10-29: "by default session on main panel, and bot chat on right sidebar" | 03 |
| Where the bot chat opens is a UI setting | Softov, 2026-10-29: "as configurable on ui settings" | 03 |
| The setting goes in its own Bot section, after the Session section | Softov, 2026-10-29: "the bot need to have its own settings... its not session" | 03 |
| The right-click menu of a bot has "Open on main" and "Open on right" | Softov, 2026-10-29: "I think like its best to name on context menu... open on main and open on right.. more fit"; question answer: "Open on main / Open on right" | 03 |
| `ui.botChatOpens` takes Ask, Main and Right, default Ask, and replaces the Right sidebar and As a panel setting | Softov, 2026-10-29: "so it become 3 options where to open: ask - when first time... no config yet. save when selected.. open on main, open on right"; question answer: "Replace it" | 03 |
| With Ask, the chat icon, a send from the popover and "Open chat" ask, and the setting keeps the answer | Softov, 2026-10-29: "on open chat.. the normal icon.. when click.. or after submit a message to bot.. to ask" | 03 |
| No bot pick for each host; the right sidebar shows the bot chat last opened on the right | Softov, 2026-10-29, question answer: "Remove the pick" | 03 |
| A drag of a chat tab from `main` to the right sidebar is built in scena | Softov, 2026-10-29: "I wanted to be abble to drag a chat bot from main to right sidebar"; question answer: "Drag now, change scena" | - |
| A menu place opens the chat there and is not kept | `(defaulted: the setting keeps only the answer to its question)` | 03 |
| One session has one tab: an open in one place closes its tab in the other | `(defaulted: the same session twice is two composers for one chat)` | 03 |
| A chat on the right does not write `ACTIVE_SESSION` and leaves the unread mark alone | `(defaulted: the bot chat is not the session the sidebar describes)` | 03 |
| A closed question opens nothing and keeps nothing | `(defaulted: the person did not answer)` | 03 |

## Proposed architecture

- **Data flow** - `ahp.chatWithBot` reads the place from its args or from `BOT_CHAT_OPENS`, and passes it to `ahp.openSession`.
- **Event flow** - a menu item, the chat icon, a send or "Open chat" runs `ahp.chatWithBot`; with Ask, `choose` asks first.
- **State flow** - `BOT_CHAT_OPENS` lives in localStorage as `ahpw.botChatOpens` and is mirrored into the store, as the session view settings are.
- **Layer responsibilities** - `src/resources/bots/`: the setting, the question and the menus. `src/resources/sessions/`: the open on each surface. `src/shell/ui-settings/`: the setting in the form.
- **Source-of-truth files** - [`code://src/resources/bots/sidebar.ts`](../../../../src/resources/bots/sidebar.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The right sidebar shows the host's bot](task-01-the-sidebar-shows-the-hosts-bot.md) | dropped | - |
| [02 - The settings pick the bot and its place](task-02-settings-pick-the-bot-and-its-place.md) | dropped | 01 |
| [03 - A bot chat opens on main or on the right](task-03-a-bot-chat-opens-on-main-or-right.md) | done | - |

## Risks and tradeoffs

- The first read of a bot starts the reader's chat on the host. A chat opens only on a person's action, so nothing starts before it.
- The right sidebar is narrow, and a third tab there shows a short title. `BotChat` was checked at 420 pixels.
- A host without the `bot-chat` agent gives the bot's own session, which every reader shares. The chat shows it as before.

## Resume state

- **Done so far:** task 03 is done, merged in PR #19. Tasks 01 and 02 are dropped; task 03 replaces them. The plan is built; see [implemented.md](implemented.md).
- **Next action:** the drag across surfaces waits on scena, as [deferred.md](deferred.md) says.
- **Open questions:** none.
- **Watch out for:** the drag across surfaces waits on scena.

## Final verification checklist

- [x] `pnpm typecheck` passes.
- [x] `pnpm test` passes.
- [x] By hand: both menus open the chat on main and on the right, at 1280 and 420 pixels, light and dark.
- [x] By hand: with Ask, "Open chat" asks once, and the popover chat icon then opens where the answer says.
