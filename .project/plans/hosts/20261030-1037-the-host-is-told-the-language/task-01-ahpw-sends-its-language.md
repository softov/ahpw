---
title: ahpw sends its language
status: todo
depends: []
layer: bridges
refs:
  - "[code://src/bridges/protocol-versions.ts#L30-L59](../../../../src/bridges/protocol-versions.ts#L30-L59) - the outgoing `initialize` rewrite"
  - "[code://src/bridges/data.ts#L693-L706](../../../../src/bridges/data.ts#L693-L706) - `reconnectHost`"
  - "[code://src/i18n/messages.ts#L23-L33](../../../../src/i18n/messages.ts#L23-L33) - the language and its change"
---

## Objective

`initialize` and `reconnect` carry ahpw's language as `locale`.
A change of language connects each connected host again.

## Files

- `UPDATE: src/bridges/protocol-versions.ts:30-59` - add `locale: getLocale()` to the params of `initialize` and `reconnect`.
- `UPDATE: src/bridges/data.ts:693-706` - on a language change, call `reconnectHost` for each connected host.
- `UPDATE: src/bridges/protocol-versions.test.ts` - the `locale` cases.

## Steps

1. In the outgoing rewrite, add `locale: getLocale()` to `initialize` params.
2. Add the same field to `reconnect` params.
3. Leave every other frame as it is.
4. Subscribe to `subscribeI18n` in the data bridge, and keep the last language.
5. When the language differs from the last one, call `reconnectHost` for each host whose status is `connected`.
6. Write the tests.

## Validation

- An `initialize` frame carries `locale` with the current language.
- A `reconnect` frame carries the same `locale`.
- A `subscribeSessions` frame goes as it came.
- A language change calls `reconnectHost` once for each connected host, and a repeat of the same language calls nothing.
- `pnpm typecheck` passes, and the touched tests pass.

## Resume
