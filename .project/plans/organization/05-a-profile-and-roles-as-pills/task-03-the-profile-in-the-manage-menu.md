---
title: The Manage menu lists the person's profile on each host, just before Sign out
status: done
depends: [task-02-the-profile-page-and-its-info-tab.md]
layer: "ahpw shell"
refs:
  - "[code://src/shell/manage.ts#L63-L79](../../../../src/shell/manage.ts#L63-L79) - Sign out in the `account` category"
  - "[code://src/bridges/hosts.ts#L90-L108](../../../../src/bridges/hosts.ts#L90-L108) - `onEachHost`"
  - "[code://src/bridges/hosts.ts#L191-L208](../../../../src/bridges/hosts.ts#L191-L208) - one command per host, registered again as the list changes"
---

## Objective

For each host whose principal is `user:<id>`, the Manage menu shows `👤 <id>` just before Sign out.
With more than one host, the entry reads `👤 <id> · <host name>`.
The entry opens that host's profile.

## Files

- `UPDATE: src/shell/manage.ts:63-79` - add the per-host entries before Sign out; fix the indent of line 70.
- `CREATE: src/shell/manage.test.ts` - the entry shows for a user principal and not for a root one.

## Steps

1. In `registerManage`, call `onEachHost(scena, (host) => ...)` before the Sign out block.
2. For each host, register `ahp.manage.profile.<host>` with `category: 'account'` and `slots: [MANAGE_SLOT]`.
3. Set `icon: EMOJIcon.users` on it.
4. Set `when` to true only while `selfId` returns an id for the host's offers.
5. Read the offers from `scena.store.get<Offers>(ahpPaths(host).offers)`.
6. Set `title` to the id, and add `· hostNameOf(store, host)` when `everyHost(store).length > 1`.
7. In `run`, close the menu and execute `ahp.openProfile` with `{ host }`.
8. Check that the entries sort before Sign out in the menu; if not, set an `order`.
9. Indent Sign out's `icon: EMOJIcon.signOut` line to match its siblings.

## Validation

- `src/shell/manage.test.ts`: an entry for `user:ana`, none for `root:host`, none with no principal.
- `npx tsc -b` and `npx vitest run` pass.
- By hand, light and dark: the gear shows `👤 <id>` under the line, then Sign out, and opens the profile.
- By hand, in an embedder with two hosts: two entries, each with its host name.

## Resume

Done on 2026-10-21.
scena lists a slot in registration order and has no `order` field, so step 8 needed more than a check.
The profile entries and Sign out are one group, `accountGroup`, registered again when `HOST_LIST` changes.
A host added later then still lands above Sign out.
An embedder keeps the profile entry and has no Sign out.
`src/shell/manage.test.ts` runs on a real scena registry: the order, a root principal, nobody, and an embedder.
Checked in Chromium on ahpd 0.13 at port 9199, light and dark, on one host.
Two hosts need an embedder, so they were not checked by hand.
