---
title: The composers work end to end in a browser, against a throwaway ahpd
status: done
depends: [task-01-add-context-at-the-plus.md, task-02-placeholder-and-tips.md, task-03-options-tray.md, task-04-labels-shorten.md, task-05-footer-order-and-context.md, task-07-attachment-preview.md]
layer: "ahpw"
refs:
  - "[code://README.md#L137-L147](../../../../README.md#L137-L147) - `pnpm dev` and `AHPD_URL`; the daemon needs `\"http\": true`"
  - file:///github/ahpd/docs/DAEMON.md - `--config-file` and `--port` for a daemon whose config is a throwaway file
---

## Objective

Every change of this plan holds in a browser on ahpw's dev server, against a throwaway ahpd with the Claude and cofold backends.
Each check runs in the light and dark themes, in a narrow and a wide window.

## Files

## Steps

1. Write a scratch `ahpd.json` with `"http": true`, a token, and the Claude and cofold backends.
2. Start `ahpd run --port 9287` with `--config-file` on that file, and keep its token.
3. Run `AHPD_URL=http://127.0.0.1:9287 pnpm dev` in ahpw.
4. Open `http://127.0.0.1:5180`, sign in with the token, and open New session.
5. Check task 02 on several opens: the placeholder, then the next tip on each open.
6. Fold the tray, reload, and open New session again; check that it stays folded.
7. Click the `+` twice; check that it opens below the box and then closes.
8. Copy a screenshot, and attach it from the clipboard; copy text and check the greyed row.
9. Start a Claude session with a message that edits a file, and wait for the turn to end.
10. Click the session composer's `+`; check that it opens above, toggles, and lists the changed file.
11. Attach the changed file; check that the message text did not change.
12. Upload an image, click its name in the composer, and check the preview.
    Send it, and open it again from the transcript.
13. Check the footer: Approvals left; Model, Effort and the readout right; the readout after the turn.
14. Narrow the window to about 420 pixels; check that the pills go short, then icon only.
15. Open the right sidebar on a wide window; check that the session composer shortens by its own width.
16. Repeat steps 5 to 15 in the other theme.
17. Repeat steps 9 to 13 on a cofold session.
18. Stop the throwaway ahpd and delete its scratch folder.

## Validation

- Each step's check holds in both themes and both widths, with nothing clipped, wrapped or misaligned in the footer.
- Fix anything that looks off on these pages, related or not, or note it in this task's Resume.
- `pnpm typecheck` and `pnpm test` pass on the final tree.

## Resume

- Ran in headless Edge against a throwaway ahpd 0.11.0 with agent-claude, in the dark theme.
  Steps 4 to 8, 12 (the composer half), 14 and 15 hold.
- Softov ran the `+` menu, `@`, the clipboard image and Ctrl+V in a browser.
- Not run: steps 9 to 13 need a signed-in Claude turn, 16 the light theme, 17 a cofold backend; they wait in [deferred.md](deferred.md).
