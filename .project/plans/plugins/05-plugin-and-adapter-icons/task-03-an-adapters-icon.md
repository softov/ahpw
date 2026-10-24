---
title: An adapter's icon on its connectors
status: done
depends: [task-01-pick-and-draw-an-icon.md]
layer: "ahpw connectors"
refs:
  - "[code://src/bridges/connectors.ts#L53-L63](../../../../src/bridges/connectors.ts#L53-L63) - `AdapterRow`"
  - "[code://src/resources/connectors/rows.ts](../../../../src/resources/connectors/rows.ts) - the explorer rows and the adapter groups"
  - "[code://src/resources/connectors/ConnectorPage.tsx#L39](../../../../src/resources/connectors/ConnectorPage.tsx#L39) - the head"
  - "[code://src/resources/connectors/Overview.tsx](../../../../src/resources/connectors/Overview.tsx) - the adapter line"
  - "[code://src/resources/connectors/ConnectorForm.tsx](../../../../src/resources/connectors/ConnectorForm.tsx) - the adapter's settings heading"
---

## Objective

A connector shows its adapter's icon on its row, in place of 🔌 on its page, on the Overview's adapter line and on the form's heading.
By adapter, each group heading shows that adapter's icon.

## Files

- `UPDATE: src/bridges/connectors.ts:53-63` - `icons` on `AdapterRow`.
- `UPDATE: src/resources/connectors/rows.ts` - `icons` on each row and on each adapter group.
- `UPDATE: src/resources/connectors/rows.test.ts` - a row and an adapter group carry the adapter's icons.
- `UPDATE: src/resources/connectors/ConnectorPage.tsx` - `HostIcon` in the head, with 🔌 as its fallback.
- `UPDATE: src/resources/connectors/Overview.tsx` - the icon before the adapter's title.
- `UPDATE: src/resources/connectors/ConnectorForm.tsx` - the icon before the settings heading.
- `UPDATE: src/style/app.css` - the icon beside a line of text.

## Steps

1. Add `icons?: Icon[]` to `AdapterRow`.
2. Set `icons` on each row, and on each group when the list is by adapter.
3. Draw the head's icon with `HostIcon`, and fall back to 🔌.
4. Draw the icon before the adapter's title on the Overview and on the form's heading.

## Validation

- `src/resources/connectors/rows.test.ts` passes.
- `npx tsc -b` and `npx vitest run` pass.
- By hand: an Activepieces piece's connector shows the piece's logo.

## Resume

