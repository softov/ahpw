---
title: Organization - what exists today
domain: organization
refs:
  - file:///github/ahpd/packages/sdk/src/people.ts - `user://`, `team://`, `project://`, `role://`, their channels and commands
  - file:///github/ahpd/packages/sdk/src/usage.ts - `usage://` and the `x-ahpd/usage/*` commands
  - file:///github/ahpd/docs/sdk/USERS.md - roles, grants and the people schemes
  - file:///github/ahpd/docs/sdk/USAGE.md - pools, periods and groups
---

ahpd keeps who may use a host: users, the teams and projects their work is charged to, and the roles that say what they may do.
It also keeps usage: what each user, team, project and host has spent, by day, week, month or range.
A client reaches people through `x-ahpd-users://`, `x-ahpd-teams://`, `x-ahpd-projects://` and `x-ahpd-roles://`, and `x-ahpd/<domain>/put` and `/remove`, or the resource commands on each scheme.
It reaches usage through `x-ahpd/usage/*`, or `usage://`.
Spending limits are stored on policies, but nothing enforces them yet.

## Today in ahpw

- 👤 lists users and roles, and 👥 teams and projects, each made, edited and deleted from its page where the host takes writes; [`code://src/bridges/people.ts`](../../../src/bridges/people.ts) holds the channels and writes.
- 📊 lists usage pools by period, or summed by user, team or project, and a pool's page shows its records; [`code://src/bridges/usage.ts`](../../../src/bridges/usage.ts) holds the reads.
- [`code://src/bridges/offers.ts`](../../../src/bridges/offers.ts) reads what a host offers, including `allows(provider, 'write')` and the signed-in `principal`.
- ahpw never sends `authenticate`, so a person's own token reaches only what ahpd gives nobody; see [the deferred list](01-users-teams-and-usage/deferred.md).
