---
title: The policies section and page
status: implemented
depends:
  - task-01-the-policies-bridge.md
layer: "src/resources/policies"
refs:
  - "[code://src/resources/teams/index.ts](../../../../src/resources/teams/index.ts) - the section to copy"
  - "[code://src/resources/users/UserPage.tsx](../../../../src/resources/users/UserPage.tsx) - a record page that edits, and is read-only without `write`"
  - "[code://src/resources/users/form.ts](../../../../src/resources/users/form.ts) - one value a line"
  - "[code://src/shell/register-shell.tsx](../../../../src/shell/register-shell.tsx) - the activity bar mount and the register call"
  - file:///github/ahpd/packages/sdk/src/policy.ts - the manifest: the enums, and the `allOf` per kind
---

## Objective

A ⚖️ section lists each shown host's policies from the policies channel.
A policy opens in a page with its fields and its limits, each with what the period used.
The page edits the policy, and a New command makes one.
The form offers only the values the host's manifest allows for the policy's kind.

## Files

- `CREATE: src/resources/policies/index.ts` - the section, its commands, the sidebar mount and the page component.
- `CREATE: src/resources/policies/state.ts` - the active policy path and the tab key.
- `CREATE: src/resources/policies/Explorer.tsx` - the list.
- `CREATE: src/resources/policies/PolicyPage.tsx` - the fields, the figures and the form.
- `CREATE: src/resources/policies/form.ts` - the draft, the manifest pickers, and the checks before a save.
- `CREATE: src/resources/policies/form.test.ts` - the narrowing and the checks.
- `UPDATE: src/resources/emojis.ts` - `policies: mono('⚖️')`.
- `UPDATE: src/shell/register-shell.tsx` - mount ⚖️ after 📊 and call `registerPolicies`.
- `UPDATE: src/i18n` - the new strings, in every locale the catalog has.

## Steps

1. Copy the teams section's shape, and gate it on `servesPolicies` with `trackServed`.
2. List each row by id, with its kind, effect and scope, grouped by host in multi mode.
3. Show the host's refusal in the list when it refuses the subscribe.
4. Open a row in a page tab keyed by host and id.
5. Show the page's limits from `policyLimits`, with the words and meter from task 01.
6. List each member's figure under an `each` limit.
7. Read the figures again on reload and after a save.
8. Build the kind, effect, measure, period and pool pickers from the enums in `offers.providers.policy.manifest`.
9. Narrow the measures and the match types by the manifest's `allOf` entry for the chosen kind.
10. Edit each match type as one value a line, and drop a type the kind does not take.
11. Edit the limits as rows of amount, measure, period and pool, with add and remove.
12. Edit scope, pool and the two dates as text, and cap as a checkbox.
13. Save with `putPolicy`, and use `createOnly` for a new policy.
14. Delete with `removePolicy` after a confirm.
15. Show a refused write in the host's own words under the form.
16. Make the page read-only when the provider does not allow `write`.
17. Add a New command to the section's header, shown only where the host allows `write`.

## Validation

- `form.test.ts`: a `computer` kind offers only `hours` and `sessions` and the `agent` and `computer` match types.
- `form.test.ts`: a negative amount and an empty match line are caught before the save.
- A policy made in ahpw shows in a second client, and an edit there shows in ahpw without a reload.
- A refused write shows the host's message.
- Without `write`, the page has no form and no New command.
- Mono and multi mode, at two window sizes.
- `pnpm test` and `pnpm typecheck` pass.

## Resume

- Built the section, its commands, the sidebar mount, the list, the page and the form in `src/resources/policies/`.
- The manifest draws the pickers and narrows the measures and match types by kind.
- A save calls `putPolicy` and a delete calls `removePolicy` after a confirm.
- Without a write, the page shows its fields as a list and offers no actions.
- `form.test.ts` covers the narrowing and the checks before a save. `policies.test.ts` covers the channel and write gates.
- `pnpm test`, `pnpm typecheck` and `pnpm build` pass.
- Not run here: the checks that need a live host or a second client. Those are a policy seen in two clients, a refused write, the read-only page, and mono and multi at two sizes.
- Deviation: ahpd's manifest gives a `computer` row only the `computer` match type, so `form.test.ts` checks that and a hypothetical wider manifest. The Validation line names `agent` and `computer`.
- The icon is `mono('⚖')`, because `emojis.test.ts` refuses the colour form the task names.
