---
title: Organization - what exists today
domain: organization
refs:
  - file:///github/ahpd/packages/sdk/src/people.ts - `user://`, `team://`, `project://`, `role://`, their channels and commands
  - file:///github/ahpd/packages/sdk/src/usage.ts - `usage://` and the `x-ahpd/usage/*` commands
  - file:///github/ahpd/packages/sdk/src/policy.ts - the `policy:` scheme, its manifest and `policy://<id>/limits`
  - file:///github/ahpd/docs/sdk/USERS.md - roles, grants and the people schemes
  - file:///github/ahpd/docs/sdk/USAGE.md - pools, periods and groups
  - file:///github/ahpd/docs/sdk/POLICY.md - the row, the channel, what is checked and the two limit reads
---

ahpd keeps who may use a host: users, the teams and projects their work is charged to, and the roles that say what they may do.
It also keeps usage: what each user, team, project and host has spent, by day, week, month or range.
A client reaches people through `x-ahpd-users://`, `x-ahpd-teams://`, `x-ahpd-projects://` and `x-ahpd-roles://`, and `x-ahpd/<domain>/put` and `/remove`, or the resource commands on each scheme.
It reaches usage through `x-ahpd/usage/*`, or `usage://`.
A policy says who may use which agent, model and computer, and how much.
It is a row with a scope, a kind, an effect, a match and its limits.
A daemon enforces the rows only when `policies.check` is on, and a host with the switch off refuses nobody.
A client reads the rows through `x-ahpd-policies://` or `policy://<id>`.
It reads a limit's figure through `policy://<id>/limits` and `usage://limits`.

## Today in ahpw

- 👤 lists users and roles, and 👥 teams and projects, each made, edited and deleted from its page where the host takes writes; [`code://src/bridges/people.ts`](../../../src/bridges/people.ts) holds the channels and writes.
- 📊 lists usage pools by period, or summed by user, team or project, and a pool's page shows its records; [`code://src/bridges/usage.ts`](../../../src/bridges/usage.ts) holds the reads.
- 📊 starts the list with a person's limits, each with its amount, what the period used and when it resets. [`code://src/bridges/policies.ts`](../../../src/bridges/policies.ts) holds the read.
- ⚖ lists policies by kind, by scope or in one list, and a row's page edits it from the host's manifest and shows what its limits used; [`code://src/bridges/policies.ts`](../../../src/bridges/policies.ts) holds the channel, writes and the limits read.
- [`code://src/bridges/offers.ts`](../../../src/bridges/offers.ts) reads what a host offers, including `allows(provider, 'write')` and the signed-in `principal`.
- ahpw never sends `authenticate`, so a person's own token reaches only what ahpd gives nobody; see [the deferred list](01-users-teams-and-usage/deferred.md).
