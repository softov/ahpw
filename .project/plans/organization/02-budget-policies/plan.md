---
title: Budget policies - an activity item, an explorer and a page per row
domain: organization
status: built
priority: medium
created: 2026-10-19
revalidated: 2026-10-19
requires:
  - plans/organization/01-users-teams-and-usage/plan.md
decisions:
  - decisions/policies-are-shown-and-edited-in-ahpw.md
  - decisions/ahpw-keeps-the-manifest-policies-build-with-the-usage-limits.md
refs:
  - file:///github/ahpd/docs/sdk/POLICY.md - the row, the scheme, the channel, the commands, the limits read
  - file:///github/ahpd/packages/sdk/src/policy.ts - `policyChannels`, the manifest, `policy://<id>/limits`
  - file:///github/ahpd/packages/sdk/src/charge.ts - `LimitFigure`, one limit with what it used and when it resets
  - npm://@ahpd/sdk@^0.12.0 - `Policy`, `PolicyKind`, `PolicyLimit`, `PolicyScope`; it does not export `LimitFigure` or `PolicyLimits` yet
  - "[code://src/bridges/people.ts](../../../../src/bridges/people.ts) - the reducer, `serves`, `writes`, put and remove over a records domain, the pattern the bridge copies"
  - "[code://src/resources/usage/index.ts](../../../../src/resources/usage/index.ts) - activity item, explorer with a Group menu, page in main"
  - "[code://src/resources/users/index.ts](../../../../src/resources/users/index.ts) - New, open and delete commands with a confirm"
  - "[code://src/resources/users/RolePage.tsx](../../../../src/resources/users/RolePage.tsx) - a record page that edits and is read-only where the host takes no writes"
  - "[code://src/shell/register-shell.tsx](../../../../src/shell/register-shell.tsx) - the activity bar, where the usage item sits"
---

## Goal

A person who may read a host's policies sees them in ahpw: an activity bar item opens a list in the sidebar, grouped by kind, scope or not at all, and each row opens a page in the main area.
The page shows the row as a form drawn from the host's own manifest, its limits with what each has used and when it resets, and saves or deletes the row where the host takes writes.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.
ahpd checked at `origin/main` `0e76f540`; the installed 0.12.0 serves the channel and the scheme, and only main serves the `limits` leaf.

### Searches performed

- `git grep "x-ahpd-policies\|policies/put\|policy://" origin/main -- packages/*/src` in ahpd - one records domain, `policies`, beside the `policy:` provider with a `limits` leaf.
- `grep LimitFigure node_modules/@ahpd/sdk/dist` in ahpw - not exported by 0.12.0; ahpd's main exports it from `charge.ts`.
- `grep "grant\|canWrite" src` in ahpw - no page gates on grants; a write the host refuses says why, and `writesPeople` reads the provider's operations.

### Runtime path

```
root state offers -> trackServed(x-ahpd-policies) -> activity item
  -> PoliciesExplorer: useChannel(x-ahpd-policies://) -> rows by kind | scope | none
  -> ahp.openPolicy -> PolicyPage: the row, offers.providers.policy.manifest -> SchemaForm
     readText(policy://<id>/limits) -> figures
  -> Save: x-ahpd/policies/put { id, record, createOnly? } | Delete: x-ahpd/policies/remove { id }
```

### Gaps

- `Not found: a policy bridge in ahpw - searched "polic" in src.`
- The limits read has no type in the installed `@ahpd/sdk`.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [Policies are shown and edited in ahpw, from a list in the sidebar to a page per row in the main area](../../../decisions/policies-are-shown-and-edited-in-ahpw.md) | Softov, 2026-10-19 |

| What | Source | Task |
| --- | --- | --- |
| The form is `SchemaForm` over `offers.providers.policy.manifest`, with the fields and JSON views. | (defaulted: the manifest is what the host offers a client for a row) | 03 |
| The limits read is typed at the boundary in `bridges/policies.ts` until `@ahpd/sdk` exports `PolicyLimits`, then swapped for it. | (defaulted: the installed SDK does not export it) | 01 |
| The activity item shows while a host serves `x-ahpd-policies`, as users does with its channel. | `trackServed` in the users resource | 02 |
| A new row's id is the form's first field, fixed after; the body never carries it, since the URI names the row. | the users pages, and `put` in `policy.ts`, where the URI's id wins | 03 |
| An edit sends what changed, and `null` for a field taken out, since the host merges a body over the row it holds. | `put` in ahpd's `policy.ts`; the same rule as the settings | 03 |

## Proposed architecture

- **Data flow** - the channel's `{ records }` is the list; a page reads its row from it, the manifest from the offers, and its limits by reading `policy://<id>/limits`.
- **State flow** - the Group choice is a store path kept per browser, as usage's is; a page holds its draft until Save.
- **Layer responsibilities** - `bridges/policies.ts`: channel, reducer, serves, writes, put, remove, limits. `resources/policies/`: registration, explorer, page, words.
- **Source-of-truth files** - `src/bridges/policies.ts` and `src/resources/policies/index.ts` (both new).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The policy bridge](task-01-the-policy-bridge.md) | done | - |
| [02 - The activity item and the explorer](task-02-the-activity-item-and-the-explorer.md) | done | 01 |
| [03 - A policy's page](task-03-a-policys-page.md) | done | 01 |
| [04 - A person's limits in Usage](task-04-a-persons-limits-in-usage.md) | done | 01 |

## Risks and tradeoffs

- The installed ahpd may serve the channel and no `limits` leaf; the page then says the limits cannot be read, and the row still shows and saves.
- The manifest's `allOf` narrows a row's measures and match types by kind; `SchemaForm` reads `properties` only, so a value the kind does not take is refused by the host with its own sentence.

## Resume state

- **Done so far:** every task; see [implemented.md](implemented.md).
- **Next action:** none; what waits is in [deferred.md](deferred.md).
- **Open questions:** none.
- **Watch out for:** ahpw's typecheck needs the scena release from plan hosts/05 first.

## Final verification checklist

- [x] `pnpm test` passes.
- [x] By hand against an ahpd with a policies store: the item, the list in each grouping, a new row, an edit, a delete, the limits.
- [x] `plans/index.md` updated.
