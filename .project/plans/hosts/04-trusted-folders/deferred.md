---
title: Trusted folders - deferred
date: 2026-10-16
---

These could not be run from ahpw, or wait on another plan.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| The host's own question, `vscode/requestWorkspaceTrust`, tried by hand | ahpw has no action yet that adds a folder to a session or moves one, which is what makes the host ask; and with Auto approvals the host does not ask at all | the plan that adds a session's folders to ahpw |
| A Codex session started by hand from ahpw | no ACP agent was set up on the scratch host; the push it needs was checked in the host's log | the next E2E pass with an ACP preset |
| A person signed in with their own token | a push from a connection that is nobody is refused until ahpw sends `authenticate`; the refusal is shown | organization/01's deferred list |
