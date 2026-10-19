---
title: Policies and their limits
domain: organization
status: dropped
priority: medium
created: 2026-10-18
revalidated: 2026-10-18
requires:
  - plans/organization/01-users-teams-and-usage/plan.md
refs:
  - "[code://src/bridges/people.ts](../../../../src/bridges/people.ts) - a records channel, its reducer, and the put and remove commands with the resource fallback"
  - "[code://src/bridges/usage.ts](../../../../src/bridges/usage.ts) - the usage reads, the `usage://` fallback, and `totalWords`"
  - "[code://src/bridges/offers.ts](../../../../src/bridges/offers.ts) - `offers.providers.<scheme>.manifest` and `allows(provider, 'write')`"
  - "[code://src/bridges/served.ts](../../../../src/bridges/served.ts) - `trackServed`, gated on a channel or a test"
  - "[code://src/resources/teams/index.ts](../../../../src/resources/teams/index.ts) - the section pattern: components, commands, the sidebar mount"
  - "[code://src/resources/users/UserPage.tsx](../../../../src/resources/users/UserPage.tsx) - a record page that edits, and is read-only without `write`"
  - "[code://src/resources/users/form.ts](../../../../src/resources/users/form.ts) - one value a line, checked before the host sees it"
  - "[code://src/resources/usage/Explorer.tsx](../../../../src/resources/usage/Explorer.tsx) - the usage list, which gets the limits"
  - "[code://src/shell/register-shell.tsx](../../../../src/shell/register-shell.tsx) - the activity bar mounts and the register calls"
  - file:///github/ahpd/docs/sdk/POLICY.md - the row, the scheme, the channel, the commands, and the two limit reads
  - file:///github/ahpd/docs/sdk/USAGE.md - `usage://limits`
  - file:///github/ahpd/packages/sdk/src/policy.ts - the `policy:` manifest, the channel, and `policy://<id>/limits`
  - file:///github/ahpd/packages/sdk/src/charge.ts - `LimitFigure` and `LimitMember`, which `@ahpd/sdk` 0.12.0 does not have
  - npm://@ahpd/sdk@^0.12.0 - `Policy`, `PolicyLimit`, `Measure`, `Period` and `LimitPool`
---

Dropped 2026-10-19: ahpw keeps organization/02-budget-policies, with this plan's Usage limits; see [the decision](../../../decisions/ahpw-keeps-the-manifest-policies-build-with-the-usage-limits.md).

## Goal

A person sees each limit that applies to them in 📊: its amount, what the period used, and when it resets.
An operator gets a policies section that lists the host's policies.
A policy opens in a page with its limits and what each used, with every member's figure on an `each` limit.
Policies are made, edited and deleted from that page where the host takes writes, and read-only where it does not.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -i "limit|budget|polic" src` - only a model's context limits in `src/resources/agents/words.ts`; nothing reads a policy.
- `rg "LimitFigure|PolicyLimits" node_modules/@ahpd/sdk/dist` - none; 0.12.0 was released before ahpd's policy/02.

### Runtime path

```
usage://limits -> src/bridges/policies.ts -> the Limits rows at the top of 📊
x-ahpd-policies:// -> hostBridge.follow -> the policies list -> the policy page
policy://<id>/limits -> the policy page's figures
form -> x-ahpd/policies/put {id, record, createOnly?} | resourceWrite policy://<id> -> channel update -> list and page
```

### Gaps

- ahpw reads no policy and no limit.
- `@ahpd/sdk` 0.12.0 has no type for a limit read.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpw shows a person's own limits, an operator's view of every policy, and edits policies | Softov, 2026-10-18, chose "View and edit" for "What should the ahpw budget plan cover?" | 01, 02, 03 |
| A person's limits are rows at the top of the 📊 list, not a section of their own | (defaulted: they are usage figures, and 📊 is where a person reads usage) | 02 |
| Policies are a section of their own, with ⚖️ in the activity bar after 📊 | (defaulted: a policy is a record like a team, and each record kind has a section) | 03 |
| The form's pickers come from the `policy` provider's manifest: the enums, and the `allOf` that narrows a kind's measures and match types | file:///github/ahpd/docs/sdk/POLICY.md - "A client draws its pickers from there" | 03 |
| A match type is edited as one value a line, as a role's grants are | [`code://src/resources/users/form.ts`](../../../../src/resources/users/form.ts) | 03 |
| A write calls `x-ahpd/policies/put` or `/remove` when the host offers it, else `resourceWrite` or `resourceDelete` on `policy://<id>` | [`code://src/bridges/people.ts`](../../../../src/bridges/people.ts) | 01 |
| The limit types are declared in ahpw from ahpd's `charge.ts` until an `@ahpd/sdk` release has them | (defaulted: a release is Softov's call, and the wire shape is in POLICY.md) | 01 |
| The limits are read when 📊 or the page shows, and again on reload and after a save | (defaulted: usage has no channel, so `USAGE_ASKED` is the refresh, as for the pools) | 02, 03 |
| A host that answers `usage://limits` with `-32008` shows no Limits rows, and no error | file:///github/ahpd/docs/sdk/POLICY.md - "off, it is `-32008`" | 02 |
| A kind change drops the limit rows whose measure the new kind does not take | Softov, 2026-10-18, chose "Drop them" for "when a policy's kind changes, what happens to limits whose measure the new kind does not take?" | 03 |
| A trailing newline in a match box is not an empty line; only a blank line between two values is | Softov, 2026-10-18, review of organization/02 | 03 |

## Proposed architecture

- **Data flow** - `usage://limits` and `policy://<id>/limits` are reads. The policies are a records channel. A write goes through the put and remove commands.
- **Event flow** - A save or a delete reaches the channel, which updates the list and the page. A save also reads the page's figures again.
- **State flow** - The host holds every row and figure. ahpw keeps the channel's snapshot, the last read of each limits answer, and the form's draft.
- **Layer responsibilities** - `src/bridges/policies.ts`: the channel, the reads and the writes · `src/resources/usage`: the Limits rows · `src/resources/policies`: the section, the page and the form.
- **Source-of-truth files** - [`code://src/bridges/policies.ts`](../../../../src/bridges/policies.ts), which task 01 creates.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the policies bridge](task-01-the-policies-bridge.md) | implemented | - |
| [02 - a person's limits in usage](task-02-a-persons-limits-in-usage.md) | implemented | 01 |
| [03 - the policies section and page](task-03-the-policies-section-and-page.md) | implemented | 01 |
| [04 - the domain says what exists](task-04-the-domain-says-what-exists.md) | implemented | 02, 03 |

## Risks and tradeoffs

- A figure goes stale while it shows, because a limit has no channel. Reload reads it again.
- A limit in a measure that is not counted yet reads `counted: false` and has no figure. The row says so, and draws no meter.
- A reader without `policy:read` is refused the policies channel. The section shows the host's refusal, as the people sections do.

## Resume state

- **Done so far:** tasks 01 to 04 are implemented: the bridge, the Limits rows in 📊, the ⚖ section and page, and this domain page.
- **Next action:** run the checks that need a live host or a second client, listed in [deferred.md](deferred.md). Set the tasks to done and the plan to built once they pass.
- **Open questions:**
  - Task 03's Validation says a `computer` kind offers the `agent` and `computer` match types. The manifest gives it only `computer`, so the form and the test follow the manifest.
  - A policy's `pool` cannot be cleared from the form, because ahpd documents no write that takes one away.
  - The header's New command shows in multi mode when any shown host takes writes, not only the host the new row lands on.
- **Watch out for:** `used` can pass `amount`, because a turn is charged when it ends. The meter stops at full and the words say the real figure.

## Final verification checklist

- [ ] 📊 shows the limits that apply to a person, with the amount, what was used and when it resets.
- [ ] A host with `policies.ownLimits` off shows no Limits rows and no error.
- [ ] The policies section lists the rows, and a change made in another client shows without a reload.
- [ ] A policy page shows its figures, with every member on an `each` limit.
- [ ] A policy is made, edited and deleted, and the form offers only what the manifest allows for its kind.
- [ ] Without `write`, the page is read-only.
- [ ] Mono and multi mode.
- [ ] `pnpm test` and `pnpm typecheck` pass.
