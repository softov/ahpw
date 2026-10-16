---
title: Users and roles
domain: organization
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugins/01-computers-and-bots/plan.md
refs:
  - "[code://src/resources/computers/machines.ts](../../../../../src/resources/computers/machines.ts) - the records channel reducer and the method-or-resource fallback to mirror"
  - "[code://src/resources/bots/Edit.tsx](../../../../../src/resources/bots/Edit.tsx) - a hand-written form page"
  - file:///github/ahpd/packages/sdk/src/people.ts - `user://` and `role://`, their channels, commands and write rules
  - file:///github/ahpd/packages/sdk/src/types/users.ts - `UserRecord`, `Role`, `Grant`
  - file:///github/ahpapp/src/organization.ts - the commands and the resource fallback
  - file:///github/ahpapp/src/components/UserRecord.tsx - the user form's fields and order
  - file:///github/ahpapp/src/components/RoleRecord.tsx - the role form
---

## Goal

A 👤 section lists every shown host's users and roles, in two groups.
A user or role opens in a page that edits it, and new ones are made there; each can be deleted.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

## Answers

The answers are in the parent plan's *Answers* table, rows marked p1.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the people bridge](task-01-the-people-bridge.md) | done | - |
| [02 - the users section](task-02-the-users-section.md) | done | 01 |
| [03 - the user and role pages](task-03-the-user-and-role-pages.md) | done | 02 |

## Risks and tradeoffs

- A role still held by a user, or a built-in role, may be refused on delete - the host's error is shown on the page.
- Taking `admin` off oneself can lock a person out - the form asks before it saves that change to the signed-in person's own roles.

## Resume state

- **Done so far:** tasks 01 to 03, 2026-10-16.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the user list answer adds `grants` and `trusted`; a write sends only `roles`, `issuer`, `rolesFrom`, `memberships` and `primary`, with `null` to clear the last three.

## Final verification checklist

- [ ] Users and roles list, open, are made, edited and deleted, mono and multi.
- [ ] A host that does not allow `write` shows them read-only.
- [ ] `pnpm test` and `pnpm typecheck` pass.
