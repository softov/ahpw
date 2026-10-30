---
title: The right sidebar shows the host's bot
status: dropped
depends: []
layer: "bots, sessions"
refs:
  - "[code://src/shell/right-sidebar.ts#L18-L47](../../../../src/shell/right-sidebar.ts#L18-L47) - `mountRight`, which mounts the Bot tab"
  - "[code://src/resources/bots/catalogue.ts#L104-L116](../../../../src/resources/bots/catalogue.ts#L104-L116) - `readBotChat`"
  - "[code://src/resources/sessions/Page.tsx#L209-L212](../../../../src/resources/sessions/Page.tsx#L209-L212) - the write of `ACTIVE_SESSION` to skip"
  - "[code://src/resources/host/place.ts#L16-L39](../../../../src/resources/host/place.ts#L16-L39) - the localStorage pattern to copy"
---

Task 03 replaces this task: the right sidebar shows the bot chat last opened on the right, with no pick and no Bot tab.

## Objective

When the focused session's host has a picked bot, the right sidebar has a Bot tab with the reader's chat with that bot.
Without a pick, the right sidebar has no Bot tab.

## Files

- `CREATE: src/resources/bots/sidebar.ts` - `sidebarBots`, `keepSidebarBot` and `SIDEBAR_BOTS`, the picks in localStorage and in the store.
- `CREATE: src/resources/bots/sidebar.test.ts` - the picks: read, kept, cleared, and a browser that keeps nothing.
- `CREATE: src/resources/bots/chat/SidebarChat.tsx` - the Bot tab: reads the bot and its chat, then draws `SessionPage`.
- `UPDATE: src/resources/bots/index.ts` - registers `SidebarChat` and mounts the Bot tab while the focused host has a pick.
- `UPDATE: src/resources/sessions/Page.tsx:209-212` - a `beside` prop that skips the write of `ACTIVE_SESSION` and the unread mark.
- `UPDATE: src/i18n/en.json` - the tab title and the notes of the tab; the same keys in `es.json` and `pt.json`.

## Steps

1. Write `sidebar.ts`: a map from host to slug under the localStorage key `ahpw.sidebarBots`.
2. Mirror the map into the store at `SIDEBAR_BOTS`, as `keepSettingsPlace` does.
3. Write `SidebarChat`: read the host of `ACTIVE_SESSION` and its pick.
4. Read the bot from the host's catalogue, then call `readBotChat`.
5. Draw `SessionPage` with the chat, the host and `beside`.
6. Show a note when the bot is gone, or when this reader may not chat with it.
7. Add the `beside` prop to `SessionPage`, and skip the writes to `ACTIVE_SESSION` and the unread mark with it.
8. Mount the Bot tab with `mountRight`, with the key `bots:sidebar` and the bots icon.
9. Mount the tab only while the focused host has a pick.

## Validation

- `sidebar.test.ts` passes.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: with no pick, the right sidebar has no Bot tab.
- By hand: pick a bot, send it a message from the Bot tab, and see the reply.
- By hand: the session in `main` stays the session that Session Info shows.
- By hand: the tab at 1280 and 420 pixels, light and dark.

## Resume

- The picks are a map from host to slug under the localStorage key `ahpw.sidebarBots`, mirrored at `SIDEBAR_BOTS` (`$/ahp/bots/sidebar`).
- `SidebarChat` reads the host of `ACTIVE_SESSION`, its pick, the host's bots channel and `readBotChat`, then draws `SessionPage` with `beside`.
- `SessionPage` no longer writes `ACTIVE_SESSION`, so `beside` skips only the unread mark.
- `mountBotTab` in `src/resources/bots/index.ts` mounts the tab while the focused host has a pick, and removes it when the pick goes.
- A new pick shows the tab as the active tab; a cleared pick closes it wherever it is open.
- A Bot tab open in `main` stays on a focus change, and shows a note when the new host has no pick.
- `sidebar.test.ts` covers the picks: kept, cleared, read before the store has any, and a browser that keeps nothing.
- The test host for the checks by hand had the bot plugin and a bot on the echo harness.
- Checked by hand at 1280 light and 420 dark: no tab without a pick, a reply in the tab, and the session kept in `main`.
