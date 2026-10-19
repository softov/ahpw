---
title: The sections view draws groups and sections beside the chosen one's fields, with a search
status: done
depends: [task-01-schemaform-draws-a-list-of-views.md]
layer: "scena forms"
refs:
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/forms/SchemaForm.css - the form's own styles the view's sit beside
---

## Objective

`sectionsView(groups)` returns a view that draws a tree of groups and sections, the chosen one's fields through `renderField`, and a search over every field's title, key and description.

## Files

- `UPDATE: packages/scena/src/ui/forms/views.tsx` - `SchemaFormSection`, `SchemaFormGroup`, `sectionsView`.
- `CREATE: packages/scena/src/ui/forms/SectionsView.css` - the tree, the content, the narrow layout.
- `UPDATE: packages/scena/src/ui/forms/index.ts` - export them.
- `UPDATE: packages/scena/test/ui/SchemaForm.test.tsx` - the view's cases.

## Steps

1. A section names `keys`; only keys the schema has are drawn, and a section with none is left out.
2. Keys no section names go to a group `other` titled `t('form/other', 'Other')` with one section.
3. The tree: a group row folds and opens, and choosing it shows all its sections, each under its title; a section row shows its own. A dot marks a section whose keys differ from the baseline.
4. The search box sits above the content; with text, the content lists every matching field under its section, across groups; field title, key and description are matched, case-folded.
5. In a box under 560px wide, a container query hides the tree and shows a `<select>` of the same groups and sections.

## Validation

- Cases: a key in no section is under Other; choosing a section draws only its keys; a search finds a field by its key; the edited dot follows an edit.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` in the scena checkout.

## Resume

Done 2026-10-19 in the scena checkout.
`SectionsView.tsx` and `SectionsView.css`; five cases cover the first section, Other, a chosen group, search by key, and the edited dot.
Found in the browser: a section id can hold a slash (a plugin named `@scope/name`), so the narrow select splits its value at the first slash only.
