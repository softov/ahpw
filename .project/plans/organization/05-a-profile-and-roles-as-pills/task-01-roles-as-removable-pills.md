---
title: A user's roles are pills with a ✕, and a + menu adds one
status: done
depends: []
layer: "ahpw users"
refs:
  - "[code://src/resources/users/UserPage.tsx#L51-L57](../../../../src/resources/users/UserPage.tsx#L51-L57) - `roleIds` and `toggleRole`"
  - "[code://src/resources/users/UserPage.tsx#L104-L113](../../../../src/resources/users/UserPage.tsx#L104-L113) - the checkbox Roles section"
  - "[code://src/resources/teams/NamedPage.tsx#L150-L154](../../../../src/resources/teams/NamedPage.tsx#L150-L154) - the member chip with a ✕"
  - "[code://src/resources/users/PickTwo.tsx#L37-L70](../../../../src/resources/users/PickTwo.tsx#L37-L70) - a menu under its button box, headed by a group label"
  - "[code://src/style/app.css#L3441-L3466](../../../../src/style/app.css#L3441-L3466) - `.web-people__chip-drop`, the ✕ inside a chip"
---

## Objective

A user's page lists the roles they hold as pills, each with a ✕ that removes it from the draft.
A *+ Add a role* button opens a menu of the roles they do not hold.
Team and project member chips use the same pill.

## Files

- `CREATE: src/shell/view/RemovableChip.tsx` - `RemovableChip({ label, title, on, removeLabel, onRemove })`, a `web-chip` span with a ✕ button when `onRemove` is set.
- `CREATE: src/shell/view/RemovableChip.test.ts` - the ✕ shows only with `onRemove`, and carries `removeLabel`, rendered with `renderToStaticMarkup`.
- `CREATE: src/resources/users/RolePills.tsx` - `RolePills({ held, offered, writes, onChange })`, the pills and the *+ Add a role* menu.
- `UPDATE: src/resources/users/UserPage.tsx:51-57` - `roleIds` becomes the offered list; `toggleRole` goes.
- `UPDATE: src/resources/users/UserPage.tsx:104-113` - the checkboxes become `<RolePills>`.
- `UPDATE: src/resources/teams/NamedPage.tsx:150-154` - the member span becomes `<RemovableChip>`.
- `UPDATE: src/style/app.css:3441-3466` - `.web-people__chip-drop` becomes `.web-chip__remove`; add `.web-role-pills`.
- `UPDATE: src/i18n/en.json` - `users/user/addRole`, `users/user/dropRole`, `users/user/noRolesHeld`.
- `UPDATE: src/i18n/es.json` - the same three keys.
- `UPDATE: src/i18n/pt.json` - the same three keys.

## Steps

1. Write `RemovableChip` with props `label: string`, `title?: string`, `on?: boolean`, `removeLabel: string`, `onRemove?: () => void`.
2. Render `<span className="web-chip" data-on={on ? 'true' : undefined} title={title ?? label}>`, then the label.
3. Render a `<button type="button" className="web-chip__remove">` with `×` when the caller passes `onRemove`.
4. Give the button `aria-label={removeLabel}` and `title={removeLabel}`.
5. Rename `.web-people__chip-drop` to `.web-chip__remove` in `src/style/app.css`, with its `data-on` rules.
6. Replace the member span in `NamedPage.tsx:150-154` with `<RemovableChip>`, keeping `writeMemberships` as `onRemove`.
7. Write `RolePills` with `held: readonly string[]`, `offered: readonly string[]`, `writes: boolean`, `onChange: (roles: string[]) => void`.
8. Render one `RemovableChip` per held role, with `onRemove` only when `writes` is true.
9. Show `users/user/noRolesHeld` as a `web-note` when `held` is empty.
10. Render `<Button size="sm" label={"+ " + t('users/user/addRole')}>` when `writes` and a role is not held.
11. Open a `ContextMenu` under the pills' box, as `PickTwo.open` does, with `group: t('users/explorer/roles')`.
12. On a pick, call `onChange([...held, role])` and close the menu.
13. In `UserPage.tsx`, pass `held={shown.roles}` and `offered={roleIds.filter((one) => !shown.roles.includes(one))}`.
14. Pass `onChange={(roles) => set({ roles })}`, so the change waits for Save.
15. Keep the admin confirm in `save` as it is.
16. Add the three keys to `en.json`, `es.json` and `pt.json` under `users/user`.

## Validation

- `src/shell/view/RemovableChip.test.ts`: no ✕ without `onRemove`; `removeLabel` names the ✕; a held chip is on.
- `npx tsc -b` and `npx vitest run` pass.
- By hand, light and dark: remove a role, add one, Discard, then Save and reload.
- By hand: take admin off yourself; the confirm asks first.
- By hand: on a team page, a member chip's ✕ removes the membership, and a primary chip keeps its look.
- By hand: a read-only user page shows pills with no ✕ and no +.

## Resume

Done on 2026-10-20.
ahpw tests only `*.test.ts` in node, so the chip test renders with `renderToStaticMarkup` and has no click case.
*+ Add a role* stays `sm`, as every other add button; an `xs` one lined up with the pills but read too small.
Checked in Chromium on ahpd 0.13 at port 9199, light and dark: add, remove, Save and reload, and the self-admin confirm.
Team member chips look as before, with the ✕ red on hover.
