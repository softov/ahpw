---
title: Users, teams and usage
domain: organization
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugins/01-computers-and-bots/plan.md
refs:
  - "[code://src/bridges/offers.ts](../../../../src/bridges/offers.ts) - `offersOf` and `allows(provider, operation)`: what a host serves and whether it takes writes"
  - "[code://src/bridges/served.ts](../../../../src/bridges/served.ts) - `trackServed` and `useServingHosts`, gated on a channel"
  - "[code://src/bridges/channel.ts](../../../../src/bridges/channel.ts) - `useChannel` and `useChannelOnEach`"
  - "[code://src/resources/computers/index.ts](../../../../src/resources/computers/index.ts) - the resource pattern: components, commands, the sidebar mount, `registerChoice`"
  - "[code://src/resources/computers/machines.ts](../../../../src/resources/computers/machines.ts) - a records channel reducer, and the method-or-resource fallback"
  - "[code://src/resources/bots/Edit.tsx](../../../../src/resources/bots/Edit.tsx) - a hand-written form page"
  - "[code://src/shell/register-shell.tsx](../../../../src/shell/register-shell.tsx) - the activity bar mounts and the register calls"
  - file:///github/ahpd/packages/sdk/src/people.ts - the four people schemes, `peopleChannels`, the put and remove commands, and the write rules
  - file:///github/ahpd/packages/sdk/src/types/users.ts - `UserRecord`, `Named`, `Role`, `Grant`
  - file:///github/ahpd/packages/sdk/src/recordschannel.ts - the records channel: snapshot `{records}`, added, changed and removed
  - file:///github/ahpd/packages/sdk/src/usage.ts - `usageProvider`, `usageMethods`, `UsagePeriods`
  - file:///github/ahpd/packages/sdk/src/types/usage.ts - `UsageBase`, `ModelUse`, `ComputerTime`, `UsageTotal`, `Cost`
  - file:///github/ahpapp/src/organization.ts - schemes, channels and commands, with the resource fallback
  - file:///github/ahpapp/src/useHostDirectory.ts - the four lists, read or followed
  - file:///github/ahpapp/src/components/UserRecord.tsx - the user form, read-only without `write`
  - file:///github/ahpapp/src/components/NamedRecord.tsx - a team's or project's title and members
  - file:///github/ahpapp/src/components/RoleRecord.tsx - the role form
  - file:///github/ahpapp/src/usage.ts - the usage commands, with the `usage://` fallback
  - file:///github/ahpapp/app/(tabs)/usage.tsx - the pools, periods and grouping
  - file:///github/ahpapp/src/components/UsagePool.tsx - one pool, its periods and records
---

## Goal

A host's people and usage show in ahpw, each as its own section in the activity bar.
Users and roles share one section, teams and projects share another, and usage has its own.
Every record is made, edited and deleted from ahpw where the host takes writes, and read-only where it does not.
Usage is read-only: each pool's totals by day, week, month or range, and its records, each opening its session.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Runtime path

```
initialize answer _meta -> ahpPaths(host).offers -> does the host serve x-ahpd-users / teams / projects / roles, x-ahpd/usage/*?
x-ahpd-<domain>:// -> hostBridge.follow -> channelPath -> Explorer rows, record page
form -> x-ahpd/<domain>/put {id, record, createOnly?} | resourceWrite <scheme>://<id> -> channel update -> list
x-ahpd/usage/pools | totals | range | records | groups (else usage://...) -> usage list and pool page
```

### Gaps

- ahpw has no section, list, page or form for any of the four people schemes, nor for usage.
- `trackServed` gates on a channel, and usage has none: its section needs a gate on the `x-ahpd/usage/pools` method or the `usage` provider.
- ahpd's plans hold no quota a client could show; limits are stored and read by nobody.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Users, teams, projects and roles are all in ahpw. | Softov, 2026-10-16: "projects ok" | p1, p2 |
| Every record is made, edited and deleted from ahpw, as ahpapp does. | Softov, 2026-10-16: "editing full" | p1, p2 |
| Usage is its own section. | Softov, 2026-10-16: "usage ouwn section" | p3 |
| Users and roles share one section; teams and projects share another. | Softov, 2026-10-16: "roles and users one. teams and projects another" | p1, p2 |
| A role's grants are edited as a plain list, one grant per line. | Softov, 2026-10-16: "a plain list of grants" | p1 |
| A record is read-only where the host's provider does not allow `write`; a refused write shows the host's error. | file:///github/ahpapp/src/components/UserRecord.tsx | p1, p2 |
| A write calls `x-ahpd/<domain>/put` or `/remove` when the host offers it, else `resourceWrite` or `resourceDelete` on the scheme. | file:///github/ahpapp/src/organization.ts | p1, p2 |
| Lists follow the `x-ahpd-<domain>://` channels; a host without them shows no section. | [`code://src/bridges/served.ts`](../../../../src/bridges/served.ts) | p1, p2 |
| Usage calls `x-ahpd/usage/*` when offered, else reads `usage://`. | file:///github/ahpapp/src/usage.ts | p3 |
| The user form never shows or asks for a token; its foot says how to make one with `ahpd user token`. | file:///github/ahpapp/src/components/UserRecord.tsx | p1 |
| The activity bar gets 👤 for users, 👥 for teams and 📊 for usage, after bots. | `(defaulted: none of the three is used yet)` | p1, p2, p3 |
| The shared people code lives in `src/bridges/people.ts`, used by both sections. | `(defaulted: bridges hold the host data layer)` | p1 |
| Usage shows no limits or quotas. | file:///github/ahpd/packages/sdk/src/types/policies.ts - limits are "read by nobody" | p3 |

## Proposed architecture

- **Data flow** - Each host's people channels are followed with `hostBridge(host).follow` and land at `channelPath`; usage is asked for with `hostBridge(host).request` when a list or page shows.
- **Event flow** - Make, save and delete are commands; a write goes through `src/bridges/people.ts`, and the channel brings the change back.
- **State flow** - The lists' choices live in the store and storage, per browser, as the computers list's do.
- **Layer responsibilities** - `src/bridges/people.ts`: records, reducer, writes; `src/resources/users`: users and roles; `src/resources/teams`: teams and projects; `src/resources/usage`: pools and records.
- **Source-of-truth files** - `src/bridges/people.ts` (new in p1).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [p1 - Users and roles](01-users-teams-and-usage-p1-users-and-roles/plan.md) | built | - |
| [p2 - Teams and projects](01-users-teams-and-usage-p2-teams-and-projects/plan.md) | built | p1 |
| [p3 - Usage](01-users-teams-and-usage-p3-usage/plan.md) | built | - |

## Risks and tradeoffs

- A team or project still named by a membership cannot be removed - the host's refusal is shown, and the page lists the members to take off first.
- A user's roles and memberships must name what the host holds - the form picks them from the followed lists, so only a stale list can send a wrong one, and the host's error says which.
- A person without `user:read` sees only their own record on the users channel - the list shows what the host sends, with no error.

## Resume state

- **Done so far:** p1, p2 and p3, 2026-10-16.
- **Next action:** none; what waits is in [deferred.md](deferred.md).
- **Open questions:** none; a person's own sign-in waits in [deferred.md](deferred.md).
- **Watch out for:** take only types from `@ahpd/sdk`, since its code imports Node built-ins; the user list answer adds `grants` and `trusted`, which a write must not send back.

## Final verification checklist

- [ ] With a host serving people and usage, the three sections list, open, and make, edit and delete records, mono and multi.
- [ ] A host serving none shows no section, and no error.
- [ ] A host that does not take writes shows every record read-only.
- [ ] Usage shows a pool's day, week, month and a range, and a record opens its session.
- [ ] `pnpm test`, `pnpm typecheck` and `pnpm build` pass.
- [ ] `plans/index.md` updated.
