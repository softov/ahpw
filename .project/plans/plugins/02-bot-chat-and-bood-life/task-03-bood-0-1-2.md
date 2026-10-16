---
title: Bood 0.1.2
status: blocked
depends: []
layer: "package.json"
refs:
  - npm://@cofold/bood@0.1.2 - staged 2026-10-16, waiting for Softov's approval on npm
---

## Objective

ahpw installs `@cofold/bood@^0.1.2` from npm, with no local link.

## Files

- `UPDATE: package.json` - `"@cofold/bood": "^0.1.2"`.
- `UPDATE: pnpm-workspace.yaml` - `minimumReleaseAgeExclude` names `@cofold/bood@0.1.2`.
- `UPDATE: pnpm-lock.yaml` - by `pnpm install`.

## Steps

1. Exclude both 0.1.1 and 0.1.2 for one `pnpm install`, then drop 0.1.1, as the lockfile still pins it.
2. Clear `node_modules/.vite` so a running vite bundles the new version.

## Validation

- `pnpm typecheck`, `pnpm test` and `pnpm build` pass; `node_modules/@cofold/bood` is the store's 0.1.2.

## Resume

- Blocked 2026-10-16: 0.1.2 is staged on npm and waits for Softov's approval.
