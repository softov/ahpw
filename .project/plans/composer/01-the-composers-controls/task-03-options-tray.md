---
title: The Agent and folder pills fold into a tray above the new session box
status: done
depends: []
layer: "ahpw src/sessions"
refs:
  - "[code://src/sessions/New.tsx#L349-L352](../../../../src/sessions/New.tsx#L349-L352) - the Agent pill and `FolderPill` above the box today"
  - "[code://src/sessions/FolderPill.tsx#L34-L69](../../../../src/sessions/FolderPill.tsx#L34-L69) - the folder pill, which keeps its own menu"
  - "[code://src/storage-keys.ts#L9-L11](../../../../src/storage-keys.ts#L9-L11) - `hostKey`"
  - "[code://src/storage-keys.test.ts](../../../../src/storage-keys.test.ts) - how a test sets an embedder to check a host key"
  - "[code://src/folders/added.ts#L8-L39](../../../../src/folders/added.ts#L8-L39) - a key built with `hostKey`, and its read and write"
  - "[code://src/app.css#L451-L456](../../../../src/app.css#L451-L456) - `.web-composer__where`, the row the pills sit in"
---

## Objective

Above the new session box, a tray holds the once-per-session choices: the Agent pill and the folder pill.
The tray folds to one line and opens again on a click; its state is kept per host and remembered across opens.
The model and the settings stay in the box's footer.
The steps follow the proposed answer to open question 7 of the plan.

## Files

- `CREATE: src/sessions/new-tray.ts` - `TRAY_KEY`, `readTrayOpen` and `writeTrayOpen`.
- `CREATE: src/sessions/new-tray.test.ts` - the default, the round trip, blocked storage, and the host in the key.
- `UPDATE: src/sessions/New.tsx:349-352` - the tray in place of the bare `.web-composer__where` row.
- `UPDATE: src/app.css` - `.web-new__tray` and `.web-new__tray-head`, after `.web-new` near line 1684.

## Steps

1. In `new-tray.ts`, export `TRAY_KEY = hostKey('ahpd-web.new-tray')`.
2. Export `readTrayOpen(): boolean`, which returns `true` unless storage holds the string `'closed'`.
3. Export `writeTrayOpen(open: boolean): void`, which writes `'open'` or `'closed'` and ignores blocked storage.
4. In `NewSessionPage`, hold `const [trayOpen, setTrayOpen] = useState(readTrayOpen)`.
5. Make a toggle that flips `trayOpen` and calls `writeTrayOpen` with the new value.
6. Wrap the Agent pill and `FolderPill` in `<div className="web-new__tray" data-open={trayOpen}>`.
7. While open, show the pills in `.web-composer__where`, with a fold button at the row's end.
8. Give the fold button `aria-expanded={true}`, the label "Fold the options", and `EMOJIcon.caretDown`.
9. While folded, show one `<button className="web-new__tray-head" aria-expanded={false}>` instead of the pills.
10. Write its text as the agent's name and the folder's last path part, as `Agent: Claude · project`.
11. Leave the Agent pill's command, `/agent`, and the folder's text and menu as they are.
12. Start the folded line with `EMOJIcon.caretRight`, and style it as a muted chip with the hover of `.web-chip`.

## Validation

- `src/sessions/new-tray.test.ts`: with nothing stored, `readTrayOpen()` is `true`.
- The same file: `writeTrayOpen(false)` then `readTrayOpen()` is `false`, and `writeTrayOpen(true)` brings `true` back.
- The same file: blocked storage reads `true` and a write does not throw.
- The same file: with an embedder set, `TRAY_KEY` ends with `@` and the host address.
- `pnpm typecheck` and `pnpm test` pass.
- In the browser: fold the tray, close New session, open it again; the tray is still folded.
- In the browser: with the tray folded, `/agent` in the box changes the agent, and the folded line follows.
- In the browser: the model and the settings never move into the tray.

## Resume
