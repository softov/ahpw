---
title: The host is told the language - implemented
date: 2026-10-31
refs:
  - "[code://src/bridges/protocol-versions.ts](../../../../src/bridges/protocol-versions.ts)"
  - "[code://src/bridges/data.ts](../../../../src/bridges/data.ts)"
---

ahpw sends its language as `locale` in `initialize` and `reconnect`. A change of language connects each connected host again.

## What was built

- [`code://src/bridges/protocol-versions.ts`](../../../../src/bridges/protocol-versions.ts) - `offeringEveryVersion(message, locale)` adds `locale` to `initialize` and `reconnect`. `offering` passes `getLocale()`.
- [`code://src/bridges/data.ts`](../../../../src/bridges/data.ts) - `onLanguageChange` skips the first language and a repeat. The provider calls `reconnectHost` for each connected host on a change.
- `protocol-versions.test.ts` and `data.test.ts` - the frame cases and the reconnect cases.

## Verified

- `pnpm typecheck` and `pnpm test` passed.
- Not verified: the frames in the log, and the host's text in Portuguese. Those checks wait in [hosts-locale-checks.md](../../../pending/hosts-locale-checks.md).

## Departures from the plan

- Nothing.

## Left for later

- Nothing.
