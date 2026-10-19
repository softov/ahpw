---
title: The sections view lives in scena, and the app names the sections
status: accepted
date: 2026-10-19
refs:
  - "[code://src/resources/host/Settings.tsx](../../src/resources/host/Settings.tsx) - the host settings page, the first user of the view"
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/forms/SchemaForm.tsx#L218 - `renderField`, the controls a view reuses
---

## Context

The sections view is a tree of groups and sections beside the settings of the chosen one, with a search over title, key and description.
Nothing about it is ahpd's: what is specific is only which key goes in which section.
The root config schema cannot carry that, because ahpd keeps only the protocol's property fields (`conforming` in ahpd's `packages/server/src/rootconfig.ts`).
Softov approved the proposal on 2026-10-19 ("write the plan on ahpw then implement") after it was put as: "`sectionsView` lives in scena, opt-in, with grouping passed in".

## Decision

scena exports `sectionsView(groups: SchemaFormGroup[]): SchemaFormView`.
A group is `{ id, title, sections }`, a section `{ id, title, description?, keys }`.
A key of the schema that no section names is listed in an *Other* group the view adds itself, so a key a host adds later is never hidden.
In a narrow box the tree gives way to a select of the same sections, by a container query, not by script.

## Consequences

opendoop's web-next, whose settings panel draws its own section list, can use the same view later.
ahpw holds the map from key to section, and builds it again from each schema, because plugin keys come and go.

## Options

- The view in ahpw: lost, because nothing in it is ahpw's and the next scena app would write it again.
- Sections named in the schema with an `x-` field: lost, because ahpd drops fields the protocol does not declare.
