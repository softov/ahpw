---
title: The footer puts add and approvals left, and model, effort and context size right
status: done
depends: [task-04-labels-shorten.md]
layer: "ahpw src/sessions, src/app.css"
refs:
  - "[code://src/sessions/Composer.tsx#L353-L377](../../../../src/sessions/Composer.tsx#L353-L377) - the session composer's footer today: `+`, one chip group, steer, queue, send or stop"
  - "[code://src/sessions/New.tsx#L379-L404](../../../../src/sessions/New.tsx#L379-L404) - the new session box's footer today"
  - "[code://src/sessions/Page.tsx#L223-L234](../../../../src/sessions/Page.tsx#L223-L234) - where the composer gets the last turn"
  - "[code://src/sessions/turn.ts#L42-L46](../../../../src/sessions/turn.ts#L42-L46) - `tokens`, a count as `12k`"
  - "[code://src/agents/words.ts#L36-L42](../../../../src/agents/words.ts#L36-L42) - `limitsOf`, which reads `maxContextWindow` already"
  - "[code://src/app.css#L623-L635](../../../../src/app.css#L623-L635) - `.web-composer__foot` and its chip group"
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `SessionModelInfo.maxContextWindow`, `UsageInfo`
  - file:///github/ahpd/packages/agent-claude/src/claude.ts - `scope` on `permissionMode` and `effortLevel`
---

## Objective

The footer of both composers has the `+` and the session-wide settings on the left.
On the right it has the model, the per-chat settings such as effort, and a context-size readout, then steer, queue and send.
The readout shows only when the chosen model's info carries `maxContextWindow`.
The steps follow the proposed answers to open questions 10 and 12 of the plan.

## Files

- `CREATE: src/sessions/footer.ts` - `footerSide` and `contextReadout`.
- `CREATE: src/sessions/footer.test.ts` - the side of a setting, and each form of the readout.
- `UPDATE: src/sessions/Composer.tsx:65-76` - the `lastUsage` prop.
- `UPDATE: src/sessions/Composer.tsx:353-377` - the footer in two groups, and the readout.
- `UPDATE: src/sessions/New.tsx:379-404` - the footer in two groups, and the readout.
- `UPDATE: src/sessions/Page.tsx:223-234` - pass `lastUsage={chat.state.turns.at(-1)?.usage}` to `Composer`.
- `UPDATE: src/app.css:623-635` - `.web-composer__chips--left`, `.web-composer__chips--right` and `.web-composer__context`.

## Steps

1. In `footer.ts`, export `footerSide(option: Option): 'left' | 'right'`.
2. Return `'right'` when the schema's extra `scope` field is `'chat'`, and `'left'` otherwise.
3. Read `scope` through a narrow cast with a comment: AHP 1.0.0 does not type it; ahpd's backends send it.
4. Export `contextReadout(model: SessionModelInfo | undefined, usage: UsageInfo | undefined)`, returning `{ text: string; title: string } | null`.
5. Return `null` when `model?.maxContextWindow` is `undefined`.
6. With `usage?.inputTokens` set, add `cacheReadTokens` and return `text` as `12k / 200k` through `tokens`.
7. Set that `title` to the two exact counts, as "12,345 of 200,000 tokens, as of the last turn".
8. Without usage, return the window alone as `text`, and "The model's context window" with the count as `title`.
9. In `Composer`, take `lastUsage: UsageInfo | undefined`, and find the model info in `agent?.models` by `model`.
10. Split `options.filter(showsPill)` with `footerSide` into a left list and a right list.
11. Render the `+`, then `<div className="web-composer__chips web-composer__chips--left">` with the left settings.
12. Render `<div className="web-composer__chips web-composer__chips--right">` with the model pill, the right settings and the readout.
13. Render the readout as `<span className="web-composer__context" title={title}>{text}</span>` when it is not `null`.
14. Keep steer, queue and send or stop after the right group, as today.
15. In `New.tsx`, split `options` the same way, and pass `undefined` as the usage.
16. Find the new session's model info in `agent?.models` by `model`; an empty `model` finds none.
17. In `Page.tsx`, pass `lastUsage={chat.state.turns.at(-1)?.usage}` to `Composer`.
18. In `app.css`, let the left group take the free space, and push the right group to the end.
19. Draw `.web-composer__context` as muted small text with tabular numbers, the height of a chip.

## Validation

- `src/sessions/footer.test.ts`: `scope: 'chat'` goes right; `scope: 'session'` and no `scope` go left.
- The same file: no `maxContextWindow` gives `null`, with or without usage.
- The same file: a window of 200000 and no usage reads `200k`.
- The same file: 9000 input and 3000 cache read over 200000 read `12k / 200k`, with both exact counts in the title.
- `pnpm typecheck` and `pnpm test` pass.
- In the browser, on a Claude session: Approvals sits left; Model, Effort and the readout sit right.
- In the browser: a model without a context window shows no readout and leaves no gap.
- In the browser: the readout changes after a turn ends. Check both themes, narrow and wide.

## Resume
