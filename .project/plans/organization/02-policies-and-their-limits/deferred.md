---
title: Policies and their limits - deferred
date: 2026-10-18
---

These need a live host or a second client, or wait on a decision.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| The Limits rows checked against `usage://limits`, and a host with `policies.ownLimits` off | no live ahpd host was available here | the next E2E pass on organization |
| A policy made in ahpw and shown in a second client, a refused write, and the read-only page | needs a live host and a second client | the next E2E pass on organization |
| Reload reading the figures again | needs a live host | the next E2E pass on organization |
| Mono and multi at two window sizes | needs a browser against a live host | the next E2E pass on organization |
| Clearing a policy's `pool` from the form | ahpd documents no write that takes a pool away | a later plan with a write ahpw can send |
| The New command in multi mode | it shows when any shown host takes writes, not only the host the new row lands on | the next E2E pass on organization, if it matters |
