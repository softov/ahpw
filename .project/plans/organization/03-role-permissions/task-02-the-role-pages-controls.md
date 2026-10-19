---
title: A role's page shows a shield, its address, and its grants as cards of chips beside the text
status: done
depends: [task-01-scenas-chip-and-the-grant-model.md]
layer: "resources/users"
refs:
  - "[code://src/resources/users/RolePage.tsx](../../../../src/resources/users/RolePage.tsx) - the page"
---

## Objective

The role page's title is a shield, the name and `role://<id>`; its grants show as cards with chips, an *Add subject* menu and a controls | text switch.

## Files

- `CREATE: src/resources/users/RoleGrants.tsx` - `RoleGrants`, the cards.
- `UPDATE: src/resources/users/RolePage.tsx` - the title, the switch, `RoleGrants`.
- `UPDATE: src/resources/users/index.ts` - the role tab's icon.
- `UPDATE: src/resources/emojis.ts` - `roles`.
- `UPDATE: src/style/app.css` - the cards.
- `UPDATE: src/i18n/en.json`, `es.json`, `pt.json`.

## Steps

1. Read the catalog from the root state's `_meta`.
2. Draw a card per subject; a chip's click, the switch and × change the draft's text.

## Validation

- By hand in Chromium against an isolated ahpd.

## Resume

Done 2026-10-19.
