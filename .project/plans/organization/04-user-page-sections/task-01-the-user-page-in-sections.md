---
title: The user page shows its name with an icon and its address, and its fields as sections with icons and lines
status: done
depends: []
layer: "resources/users"
refs:
  - "[code://src/resources/users/UserPage.tsx](../../../../src/resources/users/UserPage.tsx) - the page"
---

## Objective

Roles, Teams and projects, and Sign-in are sections; Teams and projects lists memberships by team and adds a team and then which of its projects, as ahpapp does.

## Files

- `UPDATE: src/resources/users/UserPage.tsx` - the title, the sections.
- `CREATE: src/resources/users/MembershipList.tsx` - the rows, the primary chips, the add menus.
- `CREATE: src/resources/users/memberships.ts` and `memberships.test.ts` - `membershipParts`, `membershipOf`, `projectChoices`.
- `UPDATE: src/resources/emojis.ts` - `signIn`.
- `UPDATE: src/style/app.css` - `.web-user__section`, `.web-memberships`.
- `UPDATE: src/i18n/en.json`, `es.json`, `pt.json` - the sections' words; the Memberships words go.

## Steps

1. A section is a heading with its icon over its fields, a line above it.
2. Teams and projects lists one row per membership as "team · scope", with a *primary* chip and a ✕.
3. *+ Add to a team* opens a menu of teams, then *Which projects* a menu of every project, the team alone and each project not yet held.

## Validation

- `src/resources/users/memberships.test.ts`.
- By hand in Chromium against an isolated ahpd.

## Resume

Done 2026-10-19.
