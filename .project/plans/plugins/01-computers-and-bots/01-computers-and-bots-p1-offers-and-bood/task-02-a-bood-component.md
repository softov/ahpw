---
title: A bood component draws a bot
status: blocked
depends: []
layer: "src/resources/bots"
refs:
  - file:///github/cofold/packages/bood/src/dom.ts - `mountBood`, `BoodView`
  - file:///github/cofold/packages/bood/src/types.ts - `BoodBody`, `BoodMood`
  - file:///github/ahpapp/src/bots.ts - `COLOR_NAMES`, `colorOf`, `colorName`, `FACE`
---

## Objective

`<Bood body color mood width />` draws a bot with `mountBood`, and follows prop changes with `setScene`.
A bot record's `body` and `color` map to bood's body and hex colour.

## Files

- `UPDATE: package.json` - `"@cofold/bood": "^0.1.0"` once published; until then a local `link:` that is not committed.
- `CREATE: src/resources/bots/look.ts` - `BOT_BODIES`, `BOT_COLORS` (copied, since `@ahpd/bot` imports Node), `COLOR_HEX`, `colorOf(name)`, `colorName(hex)`, `boodBody(body)` (`semicircle` is `jelly`), `isSlug`, `slugOf(name, taken)`.
- `CREATE: src/resources/bots/Bood.tsx` - `Bood({ body, color, mood?, width, still? })`: `mountBood` in `useLayoutEffect`, `setScene` on change, `destroy` on unmount; `scene(...)` with ahpapp's face (`eyes: 'dots'`, no brows, no mouth, filled).
- `CREATE: src/resources/bots/look.test.ts`.

## Steps

1. Add the dependency.
2. Write `look.ts` and its test.
3. Write `Bood.tsx`; the scheme follows the theme.

## Validation

- `look.test.ts`: every `BOT_BODIES` entry maps to a bood body; colour names round-trip; `slugOf` keeps the slug rule and adds `-2`.
- `pnpm test`, `pnpm typecheck` and `pnpm build` pass.
- By hand: the bots page shows a drawn bot (checked in p3).

## Resume

- Done 2026-10-16: `look.ts`, `look.test.ts`, `Bood.tsx` (breath and blink unless `still`), the `.web-bood` rule.
- Blocked on the publish: `package.json` has `"@cofold/bood": "link:../cofold/packages/bood"`, which must not be committed.
- Once 0.1.0 is on npm: `pnpm add @cofold/bood@^0.1.0`, then this task is done.
