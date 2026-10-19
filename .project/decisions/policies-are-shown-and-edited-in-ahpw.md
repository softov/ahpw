---
title: Policies are shown and edited in ahpw, from a list in the sidebar to a page per row in the main area
status: accepted
date: 2026-10-19
refs:
  - file:///github/ahpd/docs/sdk/POLICY.md - the row, the `policy:` scheme, the `x-ahpd-policies` channel and its commands
  - "[code://src/resources/usage/index.ts](../../src/resources/usage/index.ts) - the activity item, explorer and page this follows"
  - "[code://src/resources/users/RolePage.tsx](../../src/resources/users/RolePage.tsx) - a record page that edits, and is read-only where the host takes no writes"
---

## Context

ahpd keeps budget and access policies as rows a client may read and write: the `x-ahpd-policies` channel, `x-ahpd/policies/put` and `/remove`, and `policy://<id>/limits` for what each limit has used.
Softov asked on 2026-10-19 for policies "as usage does. a activity item, explorer and panel for the policy."
Asked "Should ahpw only show policies, as usage does, or also create, edit and delete them?", Softov answered "Show and edit".
Asked "How should the explorer list the rows?", Softov answered "Group menu, by kind first".
Asked whether the panel is "the row's page opening as a tab in the main area, as a usage pool does", Softov answered "Main area tab".

## Decision

An activity bar item, shown while a host serves the `x-ahpd-policies` channel, opens a policies explorer in the left sidebar.
The explorer lists the rows grouped by kind, with a Group menu that also offers scope and none, a New button and a reload.
A row opens its page as a tab in the main area: the row as a form drawn from the scheme's manifest, its limits with what each has used and when it resets, Save and Delete.
Where the host takes no writes the page is read-only, as the users pages are.

## Consequences

The form follows the host: a value the host adds to the manifest is offered without a change here.
A refused write shows the host's own sentence, which names the field.

## Options

- Read-only, as usage: lost, Softov chose to edit.
- Fixed groups by kind or by scope: lost, Softov chose a menu that offers both.
- The page in the bottom panel: lost, Softov chose the main area.
