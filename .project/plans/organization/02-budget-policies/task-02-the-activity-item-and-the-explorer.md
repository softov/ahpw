---
title: An activity item opens the policies, listed by kind, by scope or in one list
status: done
depends: [task-01-the-policy-bridge.md]
layer: "resources/policies"
refs:
  - "[code://src/resources/usage/index.ts](../../../../src/resources/usage/index.ts) - the activity item, explorer and Group menu this follows"
  - "[code://src/shell/explorer/choice.ts](../../../../src/shell/explorer/choice.ts) - `registerChoice`, the Group menu"
---

## Objective

While a host serves `x-ahpd-policies`, the activity bar shows ⚖, which opens the policies in the left sidebar.
Each row shows its effect as its dot (green allow, red deny, hollow out of its window), who and what it is about, and its limits; the Group menu lists them by kind (the usual), by scope, or in one list.

## Files

- `CREATE: src/resources/policies/state.ts` - `POLICIES_SERVED`, `ACTIVE_POLICY`, `POLICIES_GROUP`, `GROUP_KEY`, `policyTab`.
- `CREATE: src/resources/policies/index.ts` - `registerPolicies`: the served flag, the Group choice, the explorer and page components, `policies.reload`, `ahp.showPolicies`, `ahp.newPolicy`, `ahp.openPolicy`, `ahp.deletePolicy`, the sidebar mount.
- `CREATE: src/resources/policies/Explorer.tsx` - `PoliciesExplorer`.
- `CREATE: src/resources/policies/words.ts` and `words.test.ts` - amounts, limits, matches, scopes, kinds, what a limit used.
- `UPDATE: src/shell/register-shell.tsx` - the `policies:nav` activity item after usage; `registerPolicies`.
- `UPDATE: src/resources/emojis.ts` - `policies: ⚖`.
- `UPDATE: src/i18n/en.json`, `es.json`, `pt.json` - `shell/nav/policies` and `policies/*`.

## Steps

1. Register as usage does, with `registerChoice` for the Group menu, since one grouping holds at a time.
2. List rows with `ExplorerList`; a row's menu offers Delete only where its host takes writes.

## Validation

- `src/resources/policies/words.test.ts`: 4 cases.
- By hand: the item shows, the list in each grouping, the Group button pressed while not by kind.

## Resume

Done 2026-10-19.
