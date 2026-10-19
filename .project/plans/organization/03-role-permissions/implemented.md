---
title: A role's permissions as controls - a card per subject, chips per operation, from the host's grant catalog - implemented
date: 2026-10-19
refs:
  - "[code://src/bridges/grants.ts](../../../../src/bridges/grants.ts)"
  - "[code://src/resources/users/RoleGrants.tsx](../../../../src/resources/users/RoleGrants.tsx)"
  - "[code://src/resources/users/RolePage.tsx](../../../../src/resources/users/RolePage.tsx)"
---

A role's page shows a shield, its name and `role://<id>`, and edits its grants as one card per subject the host advertises, with chips that say whether each operation is granted, covered by a group, or not, and a controls | text switch.

## What was built

- [`code://src/bridges/grants.ts`](../../../../src/bridges/grants.ts) - `grantCatalog`, `subjectsOf`, `subjectInfo`, `operationState`, `reached`, `toggleOperation`, `toggleGroup`, `dropSubject`.
- [`code://src/resources/users/RoleGrants.tsx`](../../../../src/resources/users/RoleGrants.tsx) - the legend, the cards, *Add subject*.
- [`code://src/resources/users/RolePage.tsx`](../../../../src/resources/users/RolePage.tsx) - the title, the switch.
- [`code://src/resources/emojis.ts`](../../../../src/resources/emojis.ts) - `roles`.
- scena `packages/scena/src/ui/control/Chip.tsx` - `Chip`, three states.

## Verified

- `vitest run`: 464 tests; new `src/bridges/grants.test.ts` (5). scena `test/ui/Chip.test.tsx` (1).
- `tsc` against scena's source: no error in `src/`.
- In Chromium against an isolated ahpd: a role's cards with counts; splitting `policy:write` by `put` left `policy:delete`; a chip and a group toggled; × dropped a subject; *Add subject* added an empty card; Save wrote the grants to the host; the text view; dark; a subject the host does not serve.

## Departures from the plan

- The explorer's roles group keeps its label; the shield is on the page and its tab.
