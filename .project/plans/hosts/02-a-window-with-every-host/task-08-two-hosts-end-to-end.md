---
title: Two hosts end to end on the desk, and mono as it is
status: done
depends: [task-01-the-embedder-says-its-mode.md, task-02-a-connection-per-host.md, task-03-a-down-host-says-so.md, task-04-the-host-filter.md, task-05-new-session-asks-the-host.md, task-06-host-pages-from-the-filter.md, task-07-the-status-bar-covers-every-host.md, task-09-folders-per-host.md]
layer: "end to end"
refs:
  - file:///github/ahp-desk/.project/plans/desk/12-a-window-with-every-host/plan.md - the desk's setting and window, built beside this plan
---

## Objective

On a desk set to one window with every host, two hosts work side by side.
Mono, in a browser and on the desk, works as hosts plan 01 left it.

## Files

None; this task changes no file unless a check fails.

## Steps

1. Run two scratch ahpds, with `HOME`, `XDG_CONFIG_HOME` and `AHP_DESK_CONFIG_DIR` on scratch folders.
2. Build the desk with this ahpw staged, set it to every host, and open it.
3. Check that both hosts' sessions list, the filter narrows them, and the host grouping groups them.
4. Open a session, a file and a terminal on each host, and check each tab's key names its host.
5. Make a session on the second host from the host pill.
6. Open each host's Info and Settings from the filter.
7. Stop one ahpd, and check that its rows say "Down" and the other host keeps working.
8. Set the desk back to per host, and repeat hosts plan 01 task 06's checks in short.
9. Stop every server you started.

## Validation

- Each step works, and the browser console shows no new error.
- `pnpm test` and `pnpm typecheck` pass.

## Resume

- 2026-10-16, a browser pass before the desk: headless Edge on the built app with no CSP, a stand-in embedder in multi, and three hosts.
  The hosts were a scratch ahpd with no token, one on the local ahpd build with a token, and an address nothing listens on.
- The page ahpd serves has `connect-src 'self'`, so a multi stand-in must load the app from a server with no CSP, as the desk does.
- Published ahpd 0.12.0 answers a plain request 426 whatever the token; the 401 for a refused token came after it, in ahpd `aef00a1b`.
- Passed: the refused host says "Token refused" with Sign in, which asks the embedder to edit it; the closed address says "Down" with Retry.
- Passed: a fixed token and a new host list connect the host at once; one probe per failure, while the socket retries.
- Passed: a session made on the second host from the pill opens on it, in its folder.
- Passed: a file and a terminal open there, each key naming the host.
- Passed: the filter, the title bar's host menu and the grouping by host; each host's Info and Settings open as their own tabs.
- Passed: stopping the first host names it in the notice and its line, and the second host keeps working.
- Passed: mono in a browser, served by ahpd, with no filter and one host's status.
- Fixed on the way: the title bar's host menu names "Every host" or the one host shown, and a pick filters.
  Its dots are this page's own.
- Fixed on the way: host lists name a host's state, and a host's line keeps its name readable.
- 2026-10-16, on the desk: a release build with this ahpw staged and its own identifier.
  It ran on a scratch config with two hosts and no token stored.
- Passed: with "One window with every host", Open on either host shows the one window, filtered to that host.
- Passed: a host refusing its token says so in the filter, and Sign in opens that host's form in the desk's host list.
- Passed: the host back up, Retry connects it, and the status bar says "2 of 2 hosts".
- Passed: switched to per host, Open makes a window of one host, as hosts plan 01 left it, beside the window with every host.
- Not run on the desk: making sessions there, and removing a host, which writes to the OS keyring; the browser pass covered sessions.
