---
title: Both composers ask "What should it do?", and the new session box shows one tip
status: done
depends: []
layer: "ahpw src/sessions"
refs:
  - "[code://src/sessions/Composer.tsx#L329](../../../../src/sessions/Composer.tsx#L329) - the session composer's placeholder today"
  - "[code://src/sessions/New.tsx#L362](../../../../src/sessions/New.tsx#L362) - the new session box's placeholder today, which names `/` only when the agent has commands"
  - "[code://src/sessions/New.tsx#L151](../../../../src/sessions/New.tsx#L151) - `commands`, the chosen agent's skills and commands"
  - "[code://src/sessions/New.tsx#L404-L409](../../../../src/sessions/New.tsx#L404-L409) - the end of the box, where the tip goes"
  - "[code://src/folders/added.ts#L23-L39](../../../../src/folders/added.ts#L23-L39) - the localStorage read and write pattern"
  - "[code://src/app.css#L1673-L1684](../../../../src/app.css#L1673-L1684) - `.web-new`, the page the tip sits on"
---

## Objective

Both composers show the placeholder "What should it do?" when no turn runs.
The new session box shows one tip from a fixed list in a rounded notice under the box, the next tip on each open.
The steps follow the proposed answers to open questions 5 and 6 of the plan.

## Files

- `CREATE: src/sessions/tips.ts` - `Tip`, `NEW_TIPS`, `tipsFor`, `tipAt`, `readTipCount` and `writeTipCount`.
- `CREATE: src/sessions/tips.test.ts` - which tips show, their order, and the counter in storage.
- `UPDATE: src/sessions/Composer.tsx:329` - the idle placeholder becomes "What should it do?".
- `UPDATE: src/sessions/New.tsx:362` - the placeholder becomes "What should it do?".
- `UPDATE: src/sessions/New.tsx:404-409` - the tip under the box.
- `UPDATE: src/app.css` - `.web-new__tip`, the rounded notice, after `.web-new__composer` rules near line 1695.

## Steps

1. In `tips.ts`, export `interface Tip { keys: string; text: string; needsCommands?: boolean }`.
2. Export `NEW_TIPS` with `/` "lists skills and commands" and `needsCommands: true`.
3. Add `@` "refers to a file" and `+` "adds files, images and sessions" to `NEW_TIPS`.
4. Add `Enter` "starts; an empty box creates the session without a message" to `NEW_TIPS`.
5. Add `Shift+Enter` "breaks a line" to `NEW_TIPS`, and no Alt+Enter tip.
6. Export `tipsFor(hasCommands: boolean): Tip[]`, which drops a `needsCommands` tip when `hasCommands` is false.
7. Export `tipAt(tips: readonly Tip[], count: number): Tip`, which returns `tips[count % tips.length]`.
8. Export `TIP_KEY = 'ahpd-web.new-tip'`, with no `hostKey`, as a tip belongs to no host.
9. Export `readTipCount(): number` and `writeTipCount(count: number): void`, shaped like `readAdded` and `writeAdded`.
10. Make `readTipCount` return 0 when storage throws or holds no whole number.
11. In `NewSessionPage`, read the count once with `useState(() => readTipCount())`.
12. Write `count + 1` in a `useEffect` with no dependencies, so a second run in StrictMode writes the same value.
13. Render `<p className="web-new__tip">` after the box, with the tip's `keys` in a `kbd` and its `text`.
14. Pick the tip with `tipAt(tipsFor(commands.length > 0), count)`.
15. Set the new session box's placeholder to "What should it do?".
16. Set the session composer's idle placeholder to "What should it do?".
17. Keep "Queue a message for after this turn, or steer it" while a turn runs.
18. Style `.web-new__tip` as a rounded notice: muted text, the border colour, `--oo-radius-md`, centred under the box.

## Validation

- `src/sessions/tips.test.ts`: `tipsFor(false)` has no `/` tip, and `tipsFor(true)` starts with it.
- The same file: `tipAt` walks the list in order and wraps after the last tip.
- The same file: `readTipCount` returns 0 for blocked storage and for a value that is not a whole number.
- `pnpm typecheck` and `pnpm test` pass.
- In the browser: each open of New session shows the next tip, in both themes.
- In the browser: an agent with no commands never shows the `/` tip.
- In the browser: a session's composer shows no tip, and its placeholder reads "What should it do?".

## Resume
