---
title: Bood 0.2.0
status: done
depends: []
layer: "package.json"
refs:
  - npm://@cofold/bood@0.2.0 - released 2026-10-18; 0.1.2 was staged and never approved
---

## Objective

ahpw installs `@cofold/bood@^0.2.0` from npm, with no local link.

## Files

- `UPDATE: package.json` - `"@cofold/bood": "^0.2.0"`.
- `UPDATE: pnpm-workspace.yaml` - `minimumReleaseAgeExclude` names `@cofold/bood@0.2.0`.
- `UPDATE: pnpm-lock.yaml` - by `pnpm install`.

## Steps

1. Exclude both 0.1.1 and 0.2.0 for one `pnpm install`, then drop 0.1.1, as the lockfile still pins it.
2. Clear `node_modules/.vite` so a running vite bundles the new version.

## Validation

- `pnpm typecheck`, `pnpm test` and `pnpm build` pass; `node_modules/@cofold/bood` is the store's 0.2.0.

## Resume

- Done 2026-10-18: 0.2.0 released and installed; typecheck, 434 tests and the build pass.
