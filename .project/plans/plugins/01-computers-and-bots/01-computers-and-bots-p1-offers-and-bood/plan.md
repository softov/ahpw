---
title: Offers and bood
domain: plugins
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugins/01-computers-and-bots/plan.md
refs:
  - "[code://src/bridges/server-info.ts](../../../../../src/bridges/server-info.ts) - `readingServerInfo`, the transport wrapper the offers reading joins"
  - "[code://src/bridges/data.ts#L568](../../../../../src/bridges/data.ts#L568) - `ahpPaths` and the transport factory"
  - file:///github/cofold/packages/bood/src/dom.ts - `mountBood(container, scene)`, `BoodView.setScene`, `play`, `destroy`
  - file:///github/cofold/packages/bood/src/scene.ts - `scene(body, options)`
---

## Goal

ahpw knows which plugins each host serves, and can draw a bot.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p1.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a host's offers in the store](task-01-a-hosts-offers-in-the-store.md) | done | - |
| [02 - a bood component](task-02-a-bood-component.md) | done | - |

## Risks and tradeoffs

- The offers are read once per connection, so a plugin installed later shows after a reconnect - ahpd restarts on a plugin install.

## Resume state

- **Done so far:** both tasks, 2026-10-16; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** do not commit the local `link:` to bood.

## Final verification checklist

- [x] `ahpPaths(host).offers` holds the methods, channels and providers of a host serving both plugins.
- [x] `Bood` draws every body in `BOT_BODIES`, `semicircle` too.
- [x] `pnpm test` and `pnpm typecheck` pass.
