---
title: The profile opens as a tab with a header, and its Info tab shows the person
status: todo
depends: []
layer: "ahpw profile"
refs:
  - "[code://src/resources/users/RolePage.tsx#L75-L78](../../../../src/resources/users/RolePage.tsx#L75-L78) - the title and address the header follows"
  - "[code://src/resources/users/UserPage.tsx#L83-L89](../../../../src/resources/users/UserPage.tsx#L83-L89) - `section`, an icon heading over its fields"
  - "[code://src/resources/host/Settings.tsx#L150-L164](../../../../src/resources/host/Settings.tsx#L150-L164) - `Tabs` with a kept tab"
  - "[code://src/resources/users/index.ts#L82-L83](../../../../src/resources/users/index.ts#L82-L83) - a page component registered with its icon"
  - "[code://src/shell/register-shell.tsx#L308-L310](../../../../src/shell/register-shell.tsx#L308-L310) - where resources register"
  - "[code://src/bridges/people.ts#L29](../../../../src/bridges/people.ts#L29) - `ListedUser`"
  - "[code://src/bridges/usage.ts#L98-L101](../../../../src/bridges/usage.ts#L98-L101) - `usagePeriods`"
  - "[code://src/bridges/policies.ts#L88-L107](../../../../src/bridges/policies.ts#L88-L107) - `ownLimits`"
  - "[code://src/resources/usage/Limits.tsx](../../../../src/resources/usage/Limits.tsx) - `LimitLine`"
---

## Objective

`ahp.openProfile { host }` opens the person's profile on that host in a main tab, kept across reloads.
The header shows 👤, the id and the `user://` address, over two tabs, Info and Keys.
Info shows roles, teams and projects, primary, issuer, the day's, week's and month's usage, and the limits.

## Files

- `UPDATE: src/bridges/people.ts` - add `readOwnUser(host, offers)`, which reads `user://<id>` for the principal.
- `UPDATE: src/bridges/people.test.ts` - `readOwnUser` cases.
- `CREATE: src/resources/profile/index.ts` - `registerProfile(scena)`: the `ProfilePage` component and `ahp.openProfile`.
- `CREATE: src/resources/profile/state.ts` - `profileTab(host)`, `profileTabKey()` and `keepProfileTabKey(key)`.
- `CREATE: src/resources/profile/ProfilePage.tsx` - the header and the `Tabs`.
- `CREATE: src/resources/profile/Info.tsx` - the Info tab.
- `CREATE: src/resources/profile/Keys.tsx` - the Keys tab, a placeholder note until task 04.
- `UPDATE: src/shell/register-shell.tsx:308-310` - call `registerProfile(scena)` beside `registerUsers`.
- `UPDATE: src/style/app.css` - `.web-profile` and `.web-profile__figures`.
- `UPDATE: src/i18n/en.json` - a `profile` block: the command, the tabs, the section titles and the notices.
- `UPDATE: src/i18n/es.json` - the same `profile` block.
- `UPDATE: src/i18n/pt.json` - the same `profile` block.

## Steps

1. Add `selfId(offers: Offers): string | undefined`, the id when `principal` starts with `user:`.
2. Add `readOwnUser(host, offers): Promise<ListedUser>` that reads `personUri(offers, 'users', id)` as text.
3. Throw from `readOwnUser` when the principal is not a user or the answer is not an object.
4. Test `selfId` and `readOwnUser` in `src/bridges/people.test.ts`.
5. Write `profileTab(host)` as `profile:${host}`.
6. Keep the chosen tab key in `localStorage` as `ahp.profile.tab`, as `settingsTab` does, inside try and catch.
7. Register `ProfilePage` as a `page` with `props: { icon: EMOJIcon.users }`.
8. Register `ahp.openProfile`, which opens `ProfilePage` in `main` with key `profileTab(host)` and props `{ host }`.
9. Render the header as `web-role__title`: `👤 <id>` and the `user://` address in `web-role__uri`.
10. Render `<Tabs>` with `info` and `keys`, `defaultValue={profileTabKey()}` and `onChange={keepProfileTabKey}`.
11. In `Info`, call `readOwnUser`, and show a `Spinner` while it reads and a `PageAlert` when it fails.
12. Show Roles as read-only `RemovableChip`s, with no `onRemove`.
13. Show Teams and projects as `team · scope` lines, with `scopeTitle`, and mark the primary one.
14. Show Sign-in with the issuer, or the host's default word when there is none.
15. Show Usage from `usagePeriods(host, offers, 'user:' + id)`, as day, week and month with `totalWords`.
16. Show Limits from `ownLimits`, one `LimitLine` each, or `profile/info/noLimits` when there are none.
17. Give each block the `section` look of `UserPage.tsx:83-89`, with its icon.
18. Add the `profile` keys to the three locale files.

## Validation

- `src/bridges/people.test.ts`: `selfId` for `user:ana`, `root:x` and none; `readOwnUser` parses and refuses a non-object.
- `npx tsc -b` and `npx vitest run` pass.
- By hand: run `ahp.openProfile` from the palette as an admin and as a plain user.
- By hand: a plain user sees their record, their usage and their limits, with no refusal.
- By hand: switch to Keys, reload, and see the profile come back on Keys.
- By hand, light and dark: the header, the tabs and the sections line up with the user page.

## Resume

