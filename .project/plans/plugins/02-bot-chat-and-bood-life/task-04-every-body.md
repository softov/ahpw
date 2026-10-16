---
title: Every body
status: done
depends: []
layer: "src/resources/bots"
refs:
  - "[code://src/resources/bots/look.ts](../../../../src/resources/bots/look.ts) - `BOT_BODIES`, a copy of ahpd's 15, and `boodBody`, which falls back to the robot"
  - "[code://src/resources/bots/Edit.tsx](../../../../src/resources/bots/Edit.tsx) - the body pick"
  - git://f2fccac7 - ahpd: a bot's body is a tag, and any word is kept, on write and on load
---

## Objective

The bot editor offers bood's released bodies less the logo, and a body name bood does not know is drawn as the fallback.

## Files

- `UPDATE: src/resources/bots/look.ts` - `BOT_BODIES` becomes `BOOD_RELEASED` less `logo` (and the owl, if so answered); `boodBody` falls back to the answered body.
- `UPDATE: src/resources/bots/look.test.ts` - an unknown name draws as the fallback.

## Steps

1. Wait for the ahpd release that takes any short body name and keeps a stored bot whatever its body.
2. Change `look.ts` as listed; the editor and `freshLook` read the list from there.

## Validation

- By hand against the released ahpd: a bot made with `flame` saves, lists and draws; one whose body is `zebra` draws as the fallback.

## Resume

- Done 2026-10-16: `BOT_BODIES` is `BOOD_RELEASED` (32 bodies, no logo and no owl), already in bood 0.1.1, so this did not need 0.1.2.
- The editor has a body name field under the picks; a word bood does not know shows a note and draws as a square.
- Checked on a scratch host running ahpd's bot plugin with f2fccac7 applied: `flame` saved, listed and drew; `zebra` saved as `body: zebra`, drew as a square, and still loaded after a restart.
- Along the way: a bot page no longer shows an empty Instructions heading when the host reads blank instructions back as `""`.
