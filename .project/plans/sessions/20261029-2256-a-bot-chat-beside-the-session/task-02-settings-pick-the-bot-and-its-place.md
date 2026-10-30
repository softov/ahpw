---
title: The UI settings pick the bot and where its chat opens
status: dropped
depends: [task-01-the-sidebar-shows-the-hosts-bot.md]
layer: "shell ui-settings, host settings, bots"
refs:
  - "[code://src/shell/ui-settings/settings.ts#L23-L35](../../../../src/shell/ui-settings/settings.ts#L23-L35) - `UiSetting`, the shape of both settings"
  - "[code://src/resources/host/sections.ts#L37-L42](../../../../src/resources/host/sections.ts#L37-L42) - the sections of the Interface tab"
  - "[code://src/shell/right-sidebar.ts#L18-L47](../../../../src/shell/right-sidebar.ts#L18-L47) - `showView`, which the session views plan writes"
---

Task 03 replaces this task: one setting, `ui.botChatOpens`, replaces the pick and `ui.botChatPlace`.

## Objective

A Bot section of the Interface settings has two settings.
`ui.sidebarBot` picks the bot of the focused host, or none.
`ui.botChatPlace` opens the bot chat in the right sidebar or as a tab beside the session.

## Files

- `UPDATE: src/shell/ui-settings/settings.ts` - `ui.sidebarBot` and `ui.botChatPlace`.
- `CREATE: src/shell/ui-settings/settings.test.ts` - the two keys, their values and their defaults, if the session views plan did not make the file.
- `UPDATE: src/resources/host/sections.ts:37-42` - a `bot` section with the two keys, after the `session` section.
- `UPDATE: src/resources/bots/index.ts` - the Bot tab mounts on `main` beside the session when `ui.botChatPlace` is `tab`.
- `UPDATE: src/i18n/en.json` - the Bot section name, the settings, their descriptions and their values; the same keys in `es.json` and `pt.json`.
- `UPDATE: src/resources/host/sections.test.ts` - the key order with the Bot section.

## Steps

1. Add `ui.sidebarBot`, whose values are `none` and the slugs of the focused host's bots.
2. Label each bot by its name, and `none` as "No bot".
3. Read and write the pick through `sidebarBots` and `keepSidebarBot`.
4. Add `ui.botChatPlace` with the values `sidebar` and `tab`, default `sidebar`.
5. Label the values "Right sidebar" and "As a panel", as `ui.sessionViewsPlace` does.
6. Open the Bot tab through `showView`, which reads `ui.botChatPlace`.
7. Move the open Bot tab when `ui.botChatPlace` changes.
8. Add a `bot` section with both keys.

## Validation

- `settings.test.ts`: both keys, their values and their defaults.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: pick a bot in the settings, and see the Bot tab.
- By hand: pick "No bot", and see the tab close.
- By hand: switch `ui.botChatPlace` with the chat open, and see it move.
- By hand: with two hosts, pick a bot on each, then focus a session on each host.

## Resume

- `ui.sidebarBot` reads the host of `ACTIVE_SESSION`, or the start host when no session has the focus.
- Its values are `none`, the slugs in the host's bots channel, and a kept pick that the channel does not list.
- `ui.botChatPlace` uses `BOT_CHAT`, a `Placing` from `placing` in `src/shell/right-sidebar.ts`; `ui.sessionViewsPlace` uses `SESSION_VIEWS` from the same function.
- `UiSetting.values` and `UiSetting.label` take `scena`, so a setting can read the store; `uiFields(scena)` passes it.
- `settings.test.ts` covers the bot values, their labels, the kept pick, a slug that is gone, a host with no bots, and `ui.botChatPlace`.
- Checked by hand at 1280 light and 420 dark: a pick shows the tab, `ui.botChatPlace` moves it to `main`, and "No bot" closes it.
- Not checked by hand: two hosts. A browser page connects to one host; two hosts need an embedder such as ahpapp.
