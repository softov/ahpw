---
title: scena draws a three-state Chip, and ahpw reads the grant catalog and works out each operation's state
status: done
depends: []
layer: "scena control, bridges"
refs:
  - file:///github/ahpd/packages/sdk/src/users.ts - the rules the model mirrors
---

## Objective

scena's `Chip` is a pill button that is on, implied or off; `src/bridges/grants.ts` reads the catalog and answers, for a role's grants, each subject's operations and what a click does.

## Files

- `CREATE: scena packages/scena/src/ui/control/Chip.tsx`, `Chip.css` - `Chip`, `ChipProps`, `ChipState`.
- `UPDATE: scena packages/scena/src/ui/control/index.ts`, `catalog.ts`, `../index.ts` - export and register.
- `CREATE: scena packages/scena/test/ui/Chip.test.tsx`.
- `CREATE: src/bridges/grants.ts` and `grants.test.ts`.

## Steps

1. `Chip`: `label`, `state`, `onClick`, `title`, `disabled`, `aria-pressed` on for on.
2. `grantCatalog(meta)`, `subjectsOf(grants, catalog)`, `operationState`, `toggleOperation`, `toggleGroup`, `dropSubject`.

## Validation

- `test/ui/Chip.test.tsx`; `src/bridges/grants.test.ts`.

## Resume

Done 2026-10-19.
