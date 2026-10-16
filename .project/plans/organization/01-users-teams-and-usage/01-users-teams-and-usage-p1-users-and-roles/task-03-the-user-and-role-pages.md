---
title: The user and role pages
status: done
depends: [task-02-the-users-section.md]
layer: "src/resources/users"
refs:
  - "[code://src/resources/bots/Edit.tsx](../../../../../src/resources/bots/Edit.tsx) - a form page with `web-form` fields, save and dirty state"
  - file:///github/ahpapp/src/components/UserRecord.tsx - the user form's fields, read-only rule and token foot
  - file:///github/ahpapp/src/components/RoleRecord.tsx - the role form
---

## Objective

A user's page edits its id (on create only), roles, memberships, primary, issuer and roles-from.
A role's page edits its id (on create only) and its grants as a plain list, one grant per line.
Both are read-only where `writesPeople` is false.

## Files

- `CREATE: src/resources/users/UserPage.tsx` - the user form.
- `CREATE: src/resources/users/RolePage.tsx` - the role form.
- `CREATE: src/resources/users/form.ts` - `parseGrants(text: string): { grants: Grant[]; problem: string | null }`, one grant per line, each `subject:operation`.
- `CREATE: src/resources/users/form.test.ts`.
- `UPDATE: src/i18n/{en,es,pt}.json` - the field labels, hints and the token foot.

## Steps

1. Roles are picked from the host's roles; memberships from its teams and projects, written `team`, `team:*` or `team:project`; primary from the memberships.
2. Save calls `putPerson` with `userBody`, `createOnly` on a new record; the channel brings the change back.
3. The user page's foot says the token is made with `ahpd user token <id>`; nothing shows or asks for a token.
4. Saving a change to the signed-in person's own roles that drops `admin` asks first; the signed-in person is `ahpd.principal` from the `initialize` answer.
5. The role page shows a grant line's problem under the field, and does not save while one has a problem.

## Validation

- `form.test.ts`: `parseGrants` takes `session:write` and `*:*`, skips blank lines, and names a line without a `:`.
- By hand: a user and a role are made, edited and deleted; a host without `write` shows the fields off and no Save.

## Resume

- Done 2026-10-16. Built-in roles show beside the written ones, marked, with a note; saving one writes a role of its name; they have no Delete.
- Checked against the scratch host: bea edited (a role and a membership added) and the users file holds it; a role made with a bad line refused until fixed, then made; dan made; cid, dan and a role deleted.
- `.web-page.web-form > .web-form__field` no longer stretches, so a short form has no gap between its fields.
- Not checked: a host that does not allow `write`.
