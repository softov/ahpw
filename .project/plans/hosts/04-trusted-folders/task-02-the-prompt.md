---
title: The prompt
status: done
depends: [task-01-the-answers-sent-on-every-connect.md]
layer: "src/resources/sessions, src/shell/notify, src/bridges"
refs:
  - "[code://src/resources/sessions/New.tsx](../../../../src/resources/sessions/New.tsx) - `start`"
  - "[code://src/shell/notify/confirm.ts](../../../../src/shell/notify/confirm.ts) - `confirm` and `settle`"
  - "[code://src/shell/notify/ConfirmDialog.tsx](../../../../src/shell/notify/ConfirmDialog.tsx) - Escape and a click outside answer no today"
  - file:///github/ahpd/packages/sdk/src/host/trust.ts - `vscode/requestWorkspaceTrust { workspace }` answered `{ trusted }`
---

## Objective

A new session in a folder the host has no answer for asks "Trust <folder>?" before it is created.
The host's `vscode/requestWorkspaceTrust` asks the same way and answers with it.
Trust sends the list and keeps the yes once the host takes it; Don't trust keeps a no; closing the prompt keeps nothing.

## Files

- `UPDATE: src/shell/notify/confirm.ts` - `settle(answer: boolean | null)`, where `null` is closed without an answer; `confirm` reads `null` as no; `choose(options)` answers `true`, `false` or `null`.
- `UPDATE: src/shell/notify/ConfirmDialog.tsx` - Escape and a click outside settle `null`.
- `CREATE: src/bridges/trust-ask.ts` - `askTrust(store, host, folder): Promise<'trusted' | 'untrusted' | 'closed'>`, which prompts, pushes and keeps.
- `UPDATE: src/resources/sessions/New.tsx` - `start` asks before `createSession` when the folder has no answer.
- `UPDATE: src/bridges/data.ts` - on `connected`, the client's request handler answers `vscode/requestWorkspaceTrust` through `askTrust`.
- `UPDATE: src/i18n/{en,es,pt}.json` - `trust/ask/*`.

## Steps

1. Ask only when the folder has no answer; a kept yes or no starts the session at once.
2. On Trust, push the list with the folder added and wait; a refusal shows the host's words where the session error shows, and nothing is created.
3. On a request, answer `{ trusted: true }` for a folder already answered yes, `{ trusted: false }` for a no, and ask otherwise.

## Validation

- By hand on a scratch ahpd: a session in a new folder asks; Trust lets an ACP agent start; Don't trust keeps it refused and does not ask again.
- `pnpm test` and `pnpm typecheck` pass.

## Resume
