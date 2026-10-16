---
title: Users, teams and usage - deferred
date: 2026-10-16
---

These wait on a sign-in ahpw does not have yet, or on a host the scratch runs did not have.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| A person signed in with their own token | ahpd treats that token as nobody until the client sends `authenticate` against the users resource; ahpw never sends it, so only the deployment token reaches the people channels and other people's usage | a plan of its own in the hosts domain, mirroring file:///github/ahpapp/src/saved-sign-in.ts |
| Read-only pages tried against a host that does not allow `write` | no scratch host was set up that way; the pages read `writesPeople` and hide the buttons | the next E2E pass on organization |
| Multi mode for the three sections | tried in mono only | the next E2E pass on organization |
| The usage list asking again after a reconnect | a read in flight when the socket drops shows the error until reload | unplanned |
