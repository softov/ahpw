---
title: A team's and a project's members are added as on the user page, a person and then which projects or which team
status: done
depends: [task-01-the-user-page-in-sections.md]
layer: "resources/teams"
refs:
  - "[code://src/resources/teams/NamedPage.tsx](../../../../src/resources/teams/NamedPage.tsx) - the members section"
---

## Objective

A team adds a member to the team, every project of it, or one project; a project adds a member through a team.

## Files

- `CREATE: src/resources/users/PickTwo.tsx` - two buttons that pick in turn, each opening a menu.
- `UPDATE: src/resources/users/MembershipList.tsx` - uses `PickTwo`; `scopeTitle`.
- `UPDATE: src/resources/users/memberships.ts` and `memberships.test.ts` - `teamChoices`, `titled`.
- `UPDATE: src/resources/teams/NamedPage.tsx` - `PickTwo` in place of the selects; chips read as words.
- `UPDATE: src/bridges/people.ts` and `people.test.ts` - `membershipOf` and `membershipOptions` go.
- `UPDATE: src/style/app.css` - `.web-pick-two`; the ✕ on a primary chip.
- `UPDATE: src/i18n/en.json`, `es.json`, `pt.json` - *Add somebody*, *Which team*.

## Steps

1. *+ Add somebody* lists everyone with a choice left, members included.
2. On a team, *Which projects* offers `projectChoices`; on a project, *Which team* offers `teamChoices`.
3. A pick writes that user's memberships at once.

## Validation

- `src/resources/users/memberships.test.ts`.
- By hand in Chromium against an isolated ahpd, light and dark.

## Resume

Done 2026-10-19.
