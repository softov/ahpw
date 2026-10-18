---
title: Trusted folders - implemented
date: 2026-10-16
refs:
  - git://7de1f08
  - "[code://src/bridges/trust.ts](../../../../src/bridges/trust.ts)"
  - "[code://src/bridges/trust-ask.ts](../../../../src/bridges/trust-ask.ts)"
---

ahpw asks once per folder and host whether to trust it, keeps the answer in this browser, and tells the host the trusted folders on every connect, so an ACP agent such as Codex can start from ahpw.

## What was built

- [`code://src/bridges/trust.ts`](../../../../src/bridges/trust.ts) - the answers per host in the store and in storage, one spelling per folder, and the `workspaceTrust` push.
- [`code://src/bridges/trust-ask.ts`](../../../../src/bridges/trust-ask.ts) - `askTrust`, `sendTrust` and `answerTrust`: the prompt, a yes kept only once the host takes it, a no kept at once, a closed prompt keeping nothing.
- [`code://src/bridges/data.ts`](../../../../src/bridges/data.ts) - `dispatchAndWait`, settled by the echo's `rejectionReason`; on every connect, the trusted folders are pushed and `vscode/requestWorkspaceTrust` is answered through `answerTrust`.
- [`code://src/shell/notify/confirm.ts`](../../../../src/shell/notify/confirm.ts) - `choose`, which tells the two buttons from closing the question; `confirm` reads closing as no, as before.
- [`code://src/resources/sessions/New.tsx`](../../../../src/resources/sessions/New.tsx) - a new session asks before `createSession`.
- [`code://src/resources/host/Trusted.tsx`](../../../../src/resources/host/Trusted.tsx) - the Trusted folders section on the host page, with Forget.
- The `trust` words in en, es and pt.

## Verified

- `src/bridges/trust.test.ts`: 4 tests; `pnpm test` 423 pass, `pnpm typecheck` passes.
- On a scratch ahpd 0.12.0 host: a new session in `work3` asked first; Trust pushed `workspaceTrust` with the folder before the session was made; a reload pushed it again right after the new connection; Forget pushed an empty list and the row went; asked again, Don't trust made the session, pushed nothing, and the next session did not ask.
- Softov, 2026-10-18, on his own host: a Codex session over ACP started from ahpw, with its folder trusted from ahpw's prompt.

## Departures from the plan

- The prompt's title names the folder by its name, and the body carries its full path, since a whole path made the title hard to read.

## Left for later

- See [deferred.md](deferred.md).
