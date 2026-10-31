---
title: The host restarts from ahpw - implemented
date: 2026-10-31
refs:
  - "[code://src/bridges/restart.ts](../../../../src/bridges/restart.ts)"
  - "[code://src/resources/host/restart.ts](../../../../src/resources/host/restart.ts)"
---

A Restart button calls the host's `x-ahpd/restart` where ahpw says a restart is needed. A refusal shows the host's words with "Restart anyway".

## What was built

- [`code://src/bridges/restart.ts`](../../../../src/bridges/restart.ts) - `RESTART`, `mayRestart`, `restartHost(host, force)` and `mayForce`.
- [`code://src/resources/host/restart.ts`](../../../../src/resources/host/restart.ts) - `restartWithNotice`, which asks first, then says the host is restarting, or shows the refusal with "Restart anyway". "Restart anyway" does not ask again.
- [`code://src/resources/host/index.ts`](../../../../src/resources/host/index.ts) - the command `ahp.restartHost` in the Host category, shown while a host offers the method.
- [`code://src/resources/host/Info.tsx`](../../../../src/resources/host/Info.tsx) - a danger zone with Restart at the bottom of the host page.
- [`code://src/shell/controls/DangerZone.tsx`](../../../../src/shell/controls/DangerZone.tsx) - an optional `note`, because a restart can be undone.
- [`code://src/style/app.css`](../../../../src/style/app.css) - a table on a page is the page's width less both gutters. Before, the host page scrolled sideways.
- [`code://src/resources/plugins/Explorer.tsx`](../../../../src/resources/plugins/Explorer.tsx) and [`code://src/resources/plugins/PluginPage.tsx`](../../../../src/resources/plugins/PluginPage.tsx) - a Restart button in both restart notes.
- `en.json`, `pt.json` and `es.json` - `host/commands/restart` and `host/restart/*`, with the confirm title and the note.

## Verified

- `pnpm typecheck` and `pnpm test` passed. `bridges/restart.test.ts` covers the request, the offer and the refusal codes. `host/restart.test.ts` covers the confirm.
- Not verified: a restart against a running daemon. That check waits in [hosts-restart-checks.md](../../../pending/hosts-restart-checks.md).

## Departures from the plan

- The refusal shows in a notification, not an alert on the page. The palette, the host page and the notes share one place for it.
- Restart sits in a danger zone and asks before it restarts. Softov asked for this on 2026-10-31.
- ahpd sends a busy refusal as an internal error with its words. So ahpw offers "Restart anyway" for every refusal but `-32009`. That code is for a caller who may never restart.

## Left for later

- Nothing.
