---
title: A secret field is drawn as set
created: 2026-10-29
refs:
  - "[code://src/resources/connectors/form.ts#L205-L208](../../src/resources/connectors/form.ts#L205-L208) - the form finds secrets by `writeOnly`"
  - file:///github/ahpd/.project/plans/plugin/20261029-2033-a-secret-field-says-secret/plan.md - the ahpd plan that marks vault fields `secret`
---

ahpd marks a field that the vault keeps `secret: true`, and a read answers `{ "$secret": "<name>" }` for it.
The connector and agent forms find secrets by `writeOnly` today, so a first-party key shows as plain text once ahpd ships the plan.
The forms can read `secret` first and `writeOnly` second, mask the input, and show a field that holds a reference as set.
