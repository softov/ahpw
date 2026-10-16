---
title: Mono works end to end, as today
status: done
depends: [task-05-callers-take-the-handle.md]
layer: "ahpw, ahp-desk"
refs:
  - file:///github/ahp-desk/.project/specs/app-window.md - the desk window, its host switch and its pages under the host's address
---

## Objective

ahpw looks and works as before in all three places it runs: served by ahpd, run with `ahpw serve --connect`, and in a desk window.

## Files

None; this task changes no file unless a check fails.

## Steps

1. Serve ahpw from a scratch ahpd, with `XDG_CONFIG_HOME` and `HOME` on scratch folders.
2. Send a turn in a session; open a file, a diff, a terminal, an automation, an agent and host Info.
3. Open each one again, and check that ahpw focuses its tab and does not open a second one.
4. Reload the page, and check that the open tabs come back.
5. Repeat steps 2 to 4 with `ahpw serve --connect` to the same ahpd.
6. In a debug desk with a scratch `AHP_DESK_CONFIG_DIR` and two hosts, repeat steps 2 to 4.
7. Switch the window to the other host and back.
8. Stop every server you started.

## Validation

- Each step works as it does on `@ahpd/web` 0.4.0, and the browser console shows no new error.
- `pnpm test` and `pnpm typecheck` pass; ahpw has no lint script.

## Resume

- Done 2026-10-16 on ahpd 0.12.0 from npm, with `HOME`, `XDG_CONFIG_HOME` and `AHP_DESK_CONFIG_DIR` on scratch folders.
- The backend was `@ahpd/agent-cofold`, pointed at a stand-in OpenAI-compatible endpoint in the scratch folder, so turns ran without a real model.
- Served by ahpd, with the plugin from `dist/plugin`: a session and its turns, a file approval, two files, and the text and Markdown switch.
  Also a terminal, an agent, host Info, host Settings, and an automation with edit, run and its run's session.
- Every tab key named the host, such as `session:daemon:<uri>`, and opening a page again focused its tab.
  A reload brought every tab back, and each drew its page.
- A diff opened under `diff:daemon:...`; its content was refused by the host, which serves no `ahp-edit:` URI for cofold.
- `ahpw serve --connect` to the same ahpd: a session, a diff and host Info opened, focused again, and came back after a reload.
- A release desk with this ahpw staged and two hosts: the same pages and a reload.
  A switch to the other host and back kept each host's own tabs.
- Fixed on the way: `TerminalPage` follows again when its host changes, and a session row no longer shows `null` when the host clears its activity.
- Not checked: the browser console for new errors, since the pages were driven over CDP without a console listener.
- Every server started was stopped.
