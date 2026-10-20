---
title: A role's permissions as controls - a card per subject, chips per operation, from the host's grant catalog
domain: organization
status: built
priority: medium
created: 2026-10-19
revalidated: 2026-10-19
requires:
  - plans/organization/01-users-teams-and-usage/plan.md
decisions:
  - decisions/a-roles-grants-are-edited-as-cards-from-the-hosts-catalog.md
refs:
  - file:///github/ahpd/packages/sdk/src/users.ts - `OPERATIONS`, `groupOf`, `grantProblem`
  - file:///github/ahpd/packages/sdk/src/host/root.ts - `advertisedGrants`, `_meta["ahpd.grants"]`
  - "[code://src/resources/users/RolePage.tsx](../../../../src/resources/users/RolePage.tsx) - the page that changes"
  - "[code://src/resources/users/form.ts](../../../../src/resources/users/form.ts) - `parseGrants`, the text view's parser"
  - "[code://src/bridges/ahpd-meta.ts](../../../../src/bridges/ahpd-meta.ts) - `ahpdKey`, how a `_meta` key is read"
---

## Goal

A role's page shows its name with a shield and its address, `role://<id>`, and edits its grants with controls: one card per subject it names, its operations as chips that say whether the role names them, reaches them through a group, or not, and a switch for the subject's read and write groups and `*`.
The text of the grants stays as a second view.

## Reconnaissance

ahpd checked at `origin/main` `0e76f540`; the installed 0.12.0 sends `ahpd.grants` too.

### Searches performed

- `git grep -n "covered by a group"` across the repositories - the design is not built anywhere yet.
- `ls scena/src/ui/control` - no chip with states, no segmented switch; `Badge` is a label, `ChoicePicker` picks one value.
- `grep -rn "ahpd.grants" src` - ahpw does not read the catalog yet.

### Runtime path

```
root state _meta["ahpd.grants"] -> grantCatalog -> RolePage
  grants (draft text) -> parseGrants -> subjectsOf -> RoleGrants cards
  chip click -> toggleOperation (split a covering group) -> grants -> draft text
  Save -> putPerson(roles, { grants })
```

### Gaps

- `Not found: a grant catalog reader in ahpw - searched "ahpd.grants" in src.`

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [A role's grants are edited as one card per subject, drawn from the grant catalog the host advertises, with the text kept as a second view](../../../decisions/a-roles-grants-are-edited-as-cards-from-the-hosts-catalog.md) | Softov, 2026-10-19 |

| What | Source | Task |
| --- | --- | --- |
| The role's name has a shield, a new `roles` icon, on the page and its tab. | Softov, 2026-10-19: asked which icon, answered "shield" | 02 |
| The address, `role://<id>`, shows after the name. | Softov, 2026-10-19: "show the id after name role://developer" | 02 |
| The wildcard subject `*` is a card of its own, *Every subject*, with the switch only. | (defaulted: its operations differ by subject) | 02 |
| A subject the host does not advertise, a plugin not loaded, says so on its card in place of a count. | (defaulted: "0 of 0" reads as nothing granted) | 02 |
| The controls show while the text parses; a line that is not a grant keeps the text view until it is fixed. | (defaulted: the controls edit parsed grants) | 02 |

## Proposed architecture

- **Data flow** - the catalog is read from the root state's `_meta`; the grants are the draft's text, parsed for the controls and written back as text.
- **Layer responsibilities** - `src/bridges/grants.ts`: `grantCatalog`, `subjectsOf`, `operationState`, `toggleOperation`, `toggleGroup`, `dropSubject`, pure and tested. `src/resources/users/RoleGrants.tsx`: the cards. scena `control/Chip.tsx`: the chip.
- **Source-of-truth files** - `src/bridges/grants.ts` (new).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - scena's Chip and the grant model](task-01-scenas-chip-and-the-grant-model.md) | done | - |
| [02 - The role page's controls](task-02-the-role-pages-controls.md) | done | 01 |

## Risks and tradeoffs

- A grant only adds, so nothing narrows a wildcard subject for one subject; such a chip explains itself rather than acting.

## Resume state

- **Done so far:** every task; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.

## Final verification checklist

- [x] `pnpm test` passes in ahpw and scena.
- [x] By hand: a role's cards, each chip state, a split, the switch, Add and ×, the text view, Save.
- [x] `plans/index.md` updated.
