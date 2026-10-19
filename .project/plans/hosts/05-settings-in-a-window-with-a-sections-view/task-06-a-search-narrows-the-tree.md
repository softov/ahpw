---
title: A search narrows the sections tree to what it finds, with counts, and a node scopes the results
status: done
depends: [task-02-the-sections-view.md]
layer: "scena forms"
refs:
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/forms/SectionsView.tsx - the sections view
---

## Objective

While the sections view searches, its tree shows only the groups and sections with a match, each with how many, every group open, and the search box says how many settings it found.
Choosing a node then narrows the results to it without leaving the search; choosing it again shows every match.
Softov asked for this on 2026-10-19, after VS Code's settings: "on vscode I can search like for a key and the grouping changes."

## Files

- `UPDATE: packages/scena/src/ui/forms/SectionsView.tsx` - the tree built from the matches; `scope` state; the found count; the narrow select lists the same counts and *All results*.
- `UPDATE: packages/scena/src/ui/forms/SectionsView.css` - the search box holds the input and the count; `.oo-sections__count`.
- `UPDATE: packages/scena/test/ui/SchemaForm.test.tsx` - the narrowing case.
- `UPDATE: src/i18n/en.json`, `es.json`, `pt.json` - `form/foundOne`, `form/foundMany`, `form/allResults`.

## Steps

1. Count each section's drawn matches; leave out sections and groups with none.
2. A node chosen while searching sets `scope`; a new search clears it.
3. The content's heading names the scope; a block drops the title the heading already says.

## Validation

- The case: a search lists only matching nodes with counts and the found count; a section scopes the results and keeps the search; choosing it again shows every match.
- By hand in Chromium against an isolated ahpd: a search for `session`, a scoped section and a scoped group.

## Resume

Done 2026-10-19.
