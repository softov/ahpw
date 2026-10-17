---
title: Raw view and header buttons - deferred
date: 2026-10-16
---

## Browser check of three header buttons

- **What waits:** a browser check of the `+a −d`, subagents and chat switcher buttons.
- **Why:** the scratch host's agent reports no changed files, makes no subagent calls and has one chat, so none of the three showed; they are covered by `raw.test.ts` and the build only.
- **Where it goes:** the next session test against a host whose agent records changes, runs a subagent and makes a second chat.
