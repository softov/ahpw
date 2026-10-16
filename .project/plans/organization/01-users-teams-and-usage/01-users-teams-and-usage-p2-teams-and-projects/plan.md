---
title: Teams and projects
domain: organization
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/organization/01-users-teams-and-usage/01-users-teams-and-usage-p1-users-and-roles/plan.md
refs:
  - file:///github/ahpd/packages/sdk/src/people.ts - `team://` and `project://`: an id and a title, removal refused while a membership names one
  - file:///github/ahpapp/src/components/NamedRecord.tsx - a team's or project's title and its members, worked out from the users' memberships
---

## Goal

A 👥 section lists every shown host's teams and projects, in two groups.
A team or project opens in a page that edits its title and shows who belongs to it; new ones are made there, and each can be deleted.
A person is added to or taken off a team or project from its page, which writes that user's memberships.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.
A project has no members of its own: a user works on it through a team, as the membership `team:project` or `team:*`.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p2.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the teams section and pages](task-01-the-teams-section-and-pages.md) | done | - |
| [02 - members](task-02-members.md) | done | 01 |

## Risks and tradeoffs

- A team or project still named by a membership is refused on delete - the page lists its members, so they can be taken off first.

## Resume state

- **Done so far:** tasks 01 and 02, 2026-10-16.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a team or project body holds only `title`; the id is the URI.

## Final verification checklist

- [ ] Teams and projects list, open, are made, renamed and deleted, mono and multi.
- [ ] A member is added and taken off from a team's and a project's page, and the user's page shows it.
- [ ] `pnpm test` and `pnpm typecheck` pass.
