---
title: A user's page is sections, Roles, Teams, Projects, Primary and Sign-in, each with an icon and a line, in place of one Memberships list
status: superseded
superseded-by: decisions/a-users-page-lists-memberships-by-team-as-ahpapp-does.md
date: 2026-10-19
refs:
  - "[code://src/resources/users/UserPage.tsx](../../src/resources/users/UserPage.tsx) - the user page"
  - file:///github/ahpd/docs/sdk/AUTHENTICATION.md - an issuer per person and `rolesFrom`
---

## Context

A user's page listed roles, then every membership as one chip list, then primary, issuer and roles-from as plain fields.
Softov asked on 2026-10-19 for "a icon on usename" and "icon and line separation for roles, teams and projects instead Memberships with icon".
A membership names a team (`backend`), every project of a team (`backend:*`) or one project through a team (`backend:ahpapp`).
Asked where `backend:*` goes, Softov answered "Projects, as 'backend · every project'".
Asked which icon projects take, Softov answered "🗂 card index".
Asked whether Issuer and Roles from get a section too, Softov answered "Yes, a Sign-in section".

## Decision

The name has the users icon and its address, `user://<id>`, as a role's has.
Below it, sections with an icon heading and a line above each: 🛡 Roles, 👥 Teams, the plain team memberships, 🗂 Projects, the `team:project` ones as "ahpapp (backend)" and the `team:*` ones as "every project (backend)", Primary, and 🔑 Sign-in with the issuer, roles from and the token note.
The memberships are written as before; only how they are shown and added changes.

## Consequences

Nothing a host stores changes.

## Options

- `team:*` as a toggle on a team in Teams: lost, Softov chose Projects.
- 📁 or 📋 for projects: lost, Softov chose 🗂.
- Issuer and Roles from left as plain fields: lost, Softov chose a Sign-in section.
