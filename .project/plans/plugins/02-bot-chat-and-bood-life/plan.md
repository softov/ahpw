---
title: Bot chat and bood life
domain: plugins
status: active
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugins/01-computers-and-bots/plan.md
refs:
  - "[code://src/resources/bots/chat/BotChat.tsx](../../../../src/resources/bots/chat/BotChat.tsx) - the chat page a bot's session opens as"
  - "[code://src/resources/bots/chat/mark.ts](../../../../src/resources/bots/chat/mark.ts) - `botMarkOf` and `chatItems`"
  - "[code://src/resources/bots/Bood.tsx](../../../../src/resources/bots/Bood.tsx) - a bot's life: pointer follow, stares, tilts, glances, moves, arrival"
  - "[code://src/resources/bots/look.ts](../../../../src/resources/bots/look.ts) - `BOT_BODIES`, copied from ahpd, and `boodBody`"
  - file:///github/ahpd/.project/plans/plugin/52-p2-a-bot-chat-is-a-session-with-no-harness - the session `_meta` mark and the bot record's `chat`, which the chat page reads
  - file:///github/ahpd/packages/bot/src/record.ts - `BOT_BODIES` and `among`, which refuse a body not on the list
  - file:///github/ahpd/packages/bot/src/store.ts - `kept`, which drops a stored bot whose body is not on the list
  - npm://@cofold/bood@^0.1.2 - the head's look, tilt and room, staged 2026-10-16
---

## Goal

Chat on a bot opens its chat as a chat page: the person's bubbles on the right, the bot's on the left with its name, colour and figure, files, notices, and a status line.
Every bot lives: it follows the pointer, stares off or tilts its head now and then, plays its moves, and teleports to where it is dropped.
Every released bood body can be picked for a bot, and a name bood does not know is still drawn.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Chat reads the bot's `chat` session; no `chat` says "You can't chat with this bot."; a failed read shows the host's error. | Softov, 2026-10-16, the bot chat brief | 01 |
| A session whose `_meta` carries a bot mark opens as the chat page; tools, reasoning and approvals stay hidden; a message sent while the bot works steers. | Softov, 2026-10-16, the bot chat brief | 01 |
| Nothing is committed or pushed until Softov approves. | Softov, 2026-10-16, the bot chat brief | 01, 02 |
| A bot follows the pointer, stares off, glances and plays a move now and then, as ahpapp did. | Softov, 2026-10-16: "the eye thing following mouse and stering some place for a few seconds" | 02 |
| A dropped bot shows at its new place with a bood transit. | Softov, 2026-10-16: "on the bot I'm missing the teleportation" | 02 |
| Looking up and left rolls the head clockwise, up and right counter-clockwise; a wander tilts the head left or right at a random angle 4 times in 10. | Softov, 2026-10-16, the six reference frames, and "sometimes tilt X angle for left or for right" | 02 |
| A bot's body is any short name; the editor offers bood's 32 released bodies less the logo; an unknown name is drawn as a fallback. | Softov, 2026-10-16: "put any name. match some for listing. if not match when listing show a slime or square", "de 17 missing ones", "less logo" | 04 |
| ahpw waits for an ahpd release that takes any body name before it offers the new bodies. | Softov, 2026-10-16: "I will wait ahpd release" | 04 |
| An unknown body name is drawn as a square. | `(defaulted: one of Softov's two, "slime or square"; square is the plainer shape)` | 04 |
| The owl is not offered: the offer is bood's released list, and the owl is not released. | `(defaulted: follows BOOD_RELEASED)` | 04 |
| ahpd takes any body word on write and on load. | git://f2fccac7 | 04 |
| A host that lists no `bot-chat` agent runs no bot chats yet, so chatting opens the bot's own `session`, as before; one that lists it answers `chat`. | Softov, 2026-10-16: "I cannot start a conversation with the bot", on a released ahpd; the agent id is ahpd plugin/52 p2's | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the bot chat page](task-01-the-bot-chat-page.md) | done | - |
| [02 - bood life](task-02-bood-life.md) | done | - |
| [03 - bood 0.1.2](task-03-bood-0-1-2.md) | blocked | - |
| [04 - every body](task-04-every-body.md) | done | - |

## Risks and tradeoffs

- The chat page is only checked against a stand-in for ahpd plugin/52 p2 - it is checked again against the real host once p2 lands.

## Resume state

- **Done so far:** tasks 01, 02 and 04, 2026-10-16, not committed: they wait for Softov's approval.
- **Next action:** [task-03-bood-0-1-2.md](task-03-bood-0-1-2.md), once Softov approves `@cofold/bood` 0.1.2 on npm.
- **Open questions:** none.
- **Watch out for:** ahpw's `node_modules/@cofold/bood` is a link to the local cofold until task 03; `pnpm install` undoes it, and vite needs its `.vite` cache cleared to see a change of bood.

## Final verification checklist

- [ ] Chat on a bot opens its chat page against a host with ahpd plugin/52 p2, at a phone width and a desktop width.
- [ ] ahpw installs `@cofold/bood@^0.1.2` from npm, with no local link.
- [ ] A bot made with a new body saves, lists and draws; one with an unknown body draws as the fallback.
- [ ] `pnpm test`, `pnpm typecheck` and `pnpm build` pass.
- [ ] `plans/index.md` updated.
