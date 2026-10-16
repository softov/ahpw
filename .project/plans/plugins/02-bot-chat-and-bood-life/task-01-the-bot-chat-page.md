---
title: The bot chat page
status: done
depends: []
layer: "src/resources/bots, src/resources/sessions"
refs:
  - "[code://src/resources/sessions/Page.tsx](../../../../src/resources/sessions/Page.tsx) - opens a marked session as `BotChat`"
  - "[code://src/resources/sessions/Composer.tsx](../../../../src/resources/sessions/Composer.tsx) - `placeholder` and `steers`"
  - "[code://src/resources/bots/catalogue.ts](../../../../src/resources/bots/catalogue.ts) - `readBotChat`"
---

## Objective

Chat on a bot reads `bot:/<slug>` and opens its `chat` session; a session marked as a bot's opens as a chat page.

## Files

- `CREATE: src/resources/bots/chat/mark.ts`, `mark.test.ts`, `BotChat.tsx`.
- `CREATE: src/lib/save-file.ts` - `saveFile(name, blob)`, shared with the folders' download.
- `UPDATE: src/resources/bots/{catalogue,index,state,Page,Explorer}.ts(x)`, `layer/BotPopover.tsx` - `readBotChat`, `BOT_CHAT_OPENING`, Chat always offered; the bot `session` field is gone.
- `UPDATE: src/resources/sessions/{Page,Composer}.tsx`, `src/style/app.css`, `src/i18n/{en,es,pt}.json`.

## Steps

1. Done as listed.

## Validation

- `mark.test.ts`: the mark, the item layout, no reply, the error notice.
- Checked in a browser against a stand-in for ahpd plugin/52 p2, at 390 by 780 and 1352 wide.

## Resume

- Done 2026-10-16; not committed, waiting for Softov's approval.
- Not checked against a real host: ahpd plugin/52 p2, the session `_meta` mark and the bot record's `chat`, has not landed.
- File rows and notices are checked by unit tests only.
