---
title: The signed-in person's profile, and a user's roles as pills
domain: organization
status: active
priority: medium
created: 2026-10-20
revalidated: 2026-10-20
requires:
  - plans/organization/04-user-page-sections/plan.md
refs:
  - "[code://src/resources/users/UserPage.tsx#L51-L57](../../../../src/resources/users/UserPage.tsx#L51-L57) - `roleIds` and `toggleRole`, the checkbox roles that become pills"
  - "[code://src/resources/users/UserPage.tsx#L104-L113](../../../../src/resources/users/UserPage.tsx#L104-L113) - the Roles section"
  - "[code://src/resources/teams/NamedPage.tsx#L150-L154](../../../../src/resources/teams/NamedPage.tsx#L150-L154) - the hand-made `web-chip` span with its ✕, which the new chip replaces"
  - "[code://src/resources/users/RoleGrants.tsx](../../../../src/resources/users/RoleGrants.tsx) - `ContextMenu` from a button, which the add-a-role menu follows"
  - "[code://src/resources/users/PickTwo.tsx](../../../../src/resources/users/PickTwo.tsx) - the menu header as a group label, and the menu placed under its box"
  - "[code://src/resources/users/RolePage.tsx#L75-L78](../../../../src/resources/users/RolePage.tsx#L75-L78) - the title with its address, which the profile header follows"
  - "[code://src/resources/host/Settings.tsx#L150-L164](../../../../src/resources/host/Settings.tsx#L150-L164) - scena's `Tabs` with a kept tab, which the profile follows"
  - "[code://src/shell/manage.ts#L63-L79](../../../../src/shell/manage.ts#L63-L79) - Sign out in the `account` category, which the profile entries join"
  - "[code://src/bridges/hosts.ts#L90-L108](../../../../src/bridges/hosts.ts#L90-L108) - `onEachHost`, which registers one command per host"
  - "[code://src/bridges/offers.ts#L24-L25](../../../../src/bridges/offers.ts#L24-L25) - `principal`, `user:<id>` or `root:<host>`"
  - "[code://src/bridges/people.ts#L29](../../../../src/bridges/people.ts#L29) - `ListedUser`, which carries the resolved `grants`"
  - "[code://src/bridges/usage.ts#L98-L101](../../../../src/bridges/usage.ts#L98-L101) - `usagePeriods`, a pool's day, week and month"
  - "[code://src/bridges/policies.ts#L88-L107](../../../../src/bridges/policies.ts#L88-L107) - `ownLimits`, the limits that hold the person"
  - "[code://src/resources/usage/Limits.tsx](../../../../src/resources/usage/Limits.tsx) - `LimitLine`, a limit's words and meter"
  - npm://@ahpd/sdk@^0.13.0 - `TokenRecord`, `MintedToken`, `Grant`, and the `x-ahpd/tokens/*` commands in `dist/tokens.js`
  - file:///github/ahpd/packages/sdk/src/host/admission.ts - `ownRecord`: reading `user://<own id>` needs no `user:get`
  - file:///github/ahpd/packages/sdk/src/tokens.ts - mint, list and revoke; a minted token may not manage tokens
---

## Goal

A signed-in person opens their own profile from the Manage menu.
The profile is an editor tab with a header and two tabs, Info and Keys.
Info shows who the person is on that host, what they used and the limits that hold them.
Keys lists the person's own tokens, mints one with a label, an expiry and a subset of their grants, and revokes one.
A minted secret shows once.
On a user's page, roles become pills with a ✕ to remove one and a + menu to add one.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `grep -rn "chip-drop" src` - only NamedPage draws a chip with a ✕, as a hand-made `web-chip` span.
- `grep -rn "owner" src` - ahpw reads an owner only on bots and usage pools.
- `git grep "owner?:" origin/main -- packages/sdk/src/types` in ahpd - owners are on automations, computers, containers, pools, vault, triggers and agents, with no single read.
- `git grep "ownRecord" origin/main` in ahpd - a person reads their own `user://<id>` without `user:get`.

### Runtime path

```
Manage gear -> 👤 <id> [· <host>] (one per host whose principal is user:<id>) -> ahp.openProfile { host }
  -> main tab profile:<host> -> ProfilePage
     Info: readText(user://<id>) -> ListedUser (roles, memberships, primary, issuer, grants)
           usagePeriods(user:<id>) -> day, week, month · ownLimits -> LimitLine
     Keys: x-ahpd/tokens/list -> rows · revoke -> confirm -> x-ahpd/tokens/revoke
           mint form (label, expiry, grants ⊆ ListedUser.grants) -> x-ahpd/tokens/mint -> secret once
UserPage Roles: RemovableChip per role (✕ -> draft) + "+ Add a role" -> ContextMenu -> draft -> Save -> putPerson
```

### Gaps

- scena's `Chip` takes no children and has no remove control, so a chip with a ✕ is hand-made today.
- ahpw has no read of a person's own record; the users channel needs `user:list`.
- ahpw has no token bridge.
- The Manage menu has no per-host entry.
- `src/shell/manage.ts:70` has Sign out's `icon` line indented one level short.
- A `root:<host>` connection has no record, so it has no profile until ahpd answers `x-ahpd/me`.
- `Not found: x-ahpd/me - searched origin/main d96c3473 of ahpd for the method name.`

## Answers

| What | Source | Task |
| --- | --- | --- |
| Commit the pool-title work before this plan starts. | Softov, 2026-10-20: "Commit it first"; committed as `ebcdcb5` | - |
| The profile is a panel with a header and tabs: Info first, Keys on another tab. | Softov, 2026-10-20: "tabpanel, info on first, keys on another tab" | 02, 05 |
| Info holds the person's usage and limits as a section. | Softov, 2026-10-20: "Info (with usage) · Owned · Keys" | 02 |
| What the person owns is left out until ahpd has one request for it. | ahpd's builder, 2026-10-20: "leave that part of the profile out until it exists" | deferred |
| `rolesFrom` stays one claim name, a string. | ahpd's builder, 2026-10-20: "keep it one claim, a string, as in 0.13" | - |
| The mint offers a subset of the `grants` on the person's own `user://<id>`. | ahpd's builder, 2026-10-20: "Offer a subset of those when minting" | 05 |
| Roles a sign-in adds through `rolesFrom` are not in those grants, and Keys says so. | ahpd's builder, 2026-10-20: "Roles added by rolesFrom at sign-in are not in that list" | 05 |
| The profile opens in an editor tab, kept across reloads. | Softov, 2026-10-20: "An editor tab" | 02 |
| The Manage entry reads 👤 and the person's id, in Sign out's `account` group. | Softov, 2026-10-20: "👤 + their id" | 03 |
| One Manage entry per host whose principal is `user:<id>`; with more than one host it adds `· <host name>`. | Softov, 2026-10-20: "One entry per signed-in host" | 03 |
| Expiry choices: Never, 7, 30, 90 and 365 days, and On a date. | Softov, 2026-10-20: "Those plus a date" | 05 |
| Role pills change the page's draft and wait for Save, as the checkboxes did. | Softov, 2026-10-20: "Draft, then Save" | 01 |
| The chip with a ✕ is an ahpw component first, and moves to scena once it is validated. | Softov, 2026-10-20: "Make a reusable component on ahpw, after validated we see about creating on scena." | 01, deferred |
| NamedPage's member chips move onto the same component. | (defaulted: one chip with a ✕, not two) | 01 |
| Adding a role is one menu from *+ Add a role*, headed *Roles*, listing the roles not held. | (defaulted: a role has no second choice, so PickTwo's second step has nothing to ask) | 01 |
| Info is read-only. | (defaulted: editing oneself is the user page's job) | 02 |
| The tab key is `profile:<host>`. | (defaulted: one profile per host, as `personTab` keys one page per record) | 02 |
| A minted secret shows in a box with *Copy* until the person closes it; nothing keeps it. | (defaulted: the host answers the secret once) | 05 |
| Revoke asks first, in the danger tone. | (defaulted: a revoke cannot be undone) | 04 |
| A key's expiry shows its date and time in the viewer's zone. | (defaulted: a date alone read a day early west of UTC) | 04 |
| A refusal shows the host's sentence without the client's `RPC error <code>:`. | (defaulted: the code means nothing to a person) | 04 |
| *New key* is a button that opens the form, and a new key starts on 90 days. | (defaulted: the list leads; a key that never expires is a choice, not the default) | 05 |
| A pill with no ✕ does not react to hover. | (defaulted: nothing happens on it) | 05 |
| A user's Keys section sits after the page's Save and Delete. | (defaulted: a key is made at once, as the team page's members are) | 06 |
| The user page's edit controls follow the reader's grants once `me` answers them. | (defaulted: a reader without `user:write` sees controls the host refuses) | 07 |
| The host itself, `root:<host>`, has a profile too, read from `x-ahpd/me`, which ahpd will add. | Softov, 2026-10-21: "root need a profile like user. ahpd me will return its info" | 07 |
| Until `x-ahpd/me` exists, a person's profile reads `user://<id>`; Info moves onto `me` when it ships. | Softov, 2026-10-21: "Keep user:// now, switch later" | 07 |
| Root's Keys picks a person, then lists, mints and revokes that person's tokens. | Softov, 2026-10-21: "Mint for a person it picks" | 07 |
| A user's page has a Keys section for a writer, managing that person's tokens with `user`. | Softov, 2026-10-21: "Yes, a Keys section" | 06 |
| The token bridge and `TokenList` take an optional `user`, so one list serves all three places. | (defaulted: the same commands take `user`) | 04 |
| Sign out's misindented `icon` line is fixed with the Manage change. | (defaulted: a lint fix in a file the task touches) | 03 |

## Proposed architecture

- **Data flow** - The profile reads the person's own record with `readOwnUser`, their pool with `usagePeriods`, their limits with `ownLimits`, and their tokens through `src/bridges/tokens.ts`.
- **Event flow** - Keys reads the list again after a mint or a revoke; the host has no token channel.
- **State flow** - The chosen profile tab is kept in memory, as `settingsTab` keeps the settings tab.
- **Layer responsibilities** - `src/bridges/` holds the reads and the token calls.
  `src/resources/profile/` holds the page, its tabs and its command.
  `src/shell/manage.ts` holds the per-host entries, and `src/shell/view/RemovableChip.tsx` the chip with a ✕.
- **Source-of-truth files** - [`code://src/bridges/people.ts`](../../../../src/bridges/people.ts) for `ListedUser`; `@ahpd/sdk` for `TokenRecord` and `MintedToken`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Roles as removable pills](task-01-roles-as-removable-pills.md) | done | - |
| [02 - The profile page and its Info tab](task-02-the-profile-page-and-its-info-tab.md) | done | - |
| [03 - The profile in the Manage menu](task-03-the-profile-in-the-manage-menu.md) | done | 02 |
| [04 - A token bridge, and Keys lists and revokes](task-04-keys-lists-and-revokes.md) | done | 02 |
| [05 - Keys mints a token](task-05-keys-mints-a-token.md) | done | 04 |
| [06 - A user's page manages their keys](task-06-a-users-page-manages-their-keys.md) | done | 05 |
| [07 - The host's own profile, on x-ahpd/me](task-07-the-hosts-own-profile-on-me.md) | blocked | 05 |

## Risks and tradeoffs

- A person signed in with a minted token cannot manage tokens - Keys shows the host's refusal as a note, not as an error.
- A host that keeps no tokens refuses with `-32009` - Keys shows the host's words and no mint form.
- A grant a sign-in role adds is missing from the subset - Keys says that a token minted with every grant still follows the person's roles.

## Resume state

- **Done so far:** task 01, on 2026-10-20; tasks 02 to 06, on 2026-10-21.
- **Next action:** task 07, once ahpd ships `x-ahpd/me`.
- **Open questions:** none.
- **Blocked:** task 07 waits for ahpd's `x-ahpd/me`; the shape ahpw asked for is in the task.
- **Watch out for:** fetch ahpd and fast-forward `main` before a check; this plan was read at `3a51ae2f`.

## Final verification checklist

- [ ] `npx tsc -b` passes.
- [ ] `npx vitest run` passes.
- [ ] `npm run build` passes.
- [ ] By hand, on an isolated ahpd 0.13 at port 9199, in Chromium, light and dark: role pills add, remove, discard and save.
- [ ] By hand: member chips on a team page still remove a membership.
- [ ] By hand: the Manage menu shows the entry before Sign out, and it opens the profile.
- [ ] By hand: Info shows the record, usage and limits for an admin and for a plain user.
- [ ] By hand: Keys mints with a subset and an expiry, shows the secret once, lists it, and revokes it.
- [ ] By hand: the minted secret signs in and is refused a grant outside its subset.
- [ ] `plans/index.md` updated.
