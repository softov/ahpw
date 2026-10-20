---
title: A user's page in sections - Roles, Teams and projects, and Sign-in, each with an icon - implemented
date: 2026-10-19
refs:
  - "[code://src/resources/users/UserPage.tsx](../../../../src/resources/users/UserPage.tsx)"
  - "[code://src/resources/users/MembershipList.tsx](../../../../src/resources/users/MembershipList.tsx)"
  - "[code://src/resources/users/memberships.ts](../../../../src/resources/users/memberships.ts)"
---

A user's page shows 👤, the name and `user://<id>`, then 🛡 Roles, 👥 Teams and projects, and 🔑 Sign-in as sections with a line above each.
Teams and projects lists each membership as "Backend · every project", "Backend · ahpapp" or "Backend · the team, no project", with a *primary* chip and a ✕.
*+ Add to a team* chooses a team, then *Which projects* chooses every project, the team alone, or one project, leaving out what is already held.
A team's page adds *+ Add somebody* then *Which projects*; a project's page *+ Add somebody* then *Which team*; both offer anyone with a choice left, members included.

## What was built

- [`code://src/resources/users/UserPage.tsx`](../../../../src/resources/users/UserPage.tsx) - the title, the sections.
- [`code://src/resources/users/MembershipList.tsx`](../../../../src/resources/users/MembershipList.tsx) - the rows, the primary chips, the two add menus.
- [`code://src/resources/users/memberships.ts`](../../../../src/resources/users/memberships.ts) - `membershipParts`, `membershipOf`, `projectChoices`, `teamChoices`, `titled`.
- [`code://src/resources/users/PickTwo.tsx`](../../../../src/resources/users/PickTwo.tsx) - the two buttons that pick in turn.
- [`code://src/resources/teams/NamedPage.tsx`](../../../../src/resources/teams/NamedPage.tsx) - members added through `PickTwo`, their chips read as words.
- [`code://src/bridges/people.ts`](../../../../src/bridges/people.ts) - `membershipOf` and `membershipOptions` gone, replaced by `memberships.ts`.
- [`code://src/resources/emojis.ts`](../../../../src/resources/emojis.ts) - `signIn`.

## Verified

- `vitest run`: 466 tests; new `src/resources/users/memberships.test.ts`.
- `tsc` against scena's source: no error in `src/`.
- In Chromium against an isolated ahpd: testing then ahpc added, made primary, the "the team, no project" row dropped, saved; the host's users file read back `backend:*`, `backend:ahpapp`, `testing:ahpc` with primary `testing:ahpc`; no console errors.
- In Chromium, light and dark: the testing team added soft to ahpapp (`testing:ahpapp`); the ahpc project added tester through Backend (`backend:ahpc`); read back from the host's users file; no console errors.

## Departures from the plan

- None.
