---
title: Users, teams and usage - implemented
date: 2026-10-16
refs:
  - git://7b333b6
---

A host's people and usage show in ahpw as three activity bar sections: 👤 users and roles, 👥 teams and projects, and 📊 usage.

## What was built

- [p1 - Users and roles](01-users-teams-and-usage-p1-users-and-roles/implemented.md).
- [p2 - Teams and projects](01-users-teams-and-usage-p2-teams-and-projects/implemented.md).
- [p3 - Usage](01-users-teams-and-usage-p3-usage/implemented.md).

## Verified

- `pnpm test` 414 pass and `pnpm typecheck` passes.
- Each part was run by hand on a scratch ahpd 0.12.0 host with the deployment token; the children say what each run showed.

## Departures from the plan

- none beyond those the children name.

## Left for later

- See [deferred.md](deferred.md).
