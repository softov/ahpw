---
title: Pill labels shorten as the box narrows, in both composers
status: done
depends: []
layer: "ahpw src/sessions, src/app.css"
refs:
  - "[code://src/sessions/pills.tsx#L7-L22](../../../../src/sessions/pills.tsx#L7-L22) - `Pill`, which takes one `label`"
  - "[code://src/sessions/Composer.tsx#L356-L369](../../../../src/sessions/Composer.tsx#L356-L369) - the model and setting pills of the session composer"
  - "[code://src/sessions/New.tsx#L56-L83](../../../../src/sessions/New.tsx#L56-L83) - `SettingPill` in the new session box"
  - "[code://src/sessions/New.tsx#L382-L395](../../../../src/sessions/New.tsx#L382-L395) - the model and setting pills of the new session box"
  - "[code://src/sessions/composer-commands.ts#L100-L107](../../../../src/sessions/composer-commands.ts#L100-L107) - `optionLabel`, a setting's value as a person reads it"
  - "[code://src/emojis.ts#L84-L86](../../../../src/emojis.ts#L84-L86) - `EMOJIcon`, where the new glyphs go"
  - "[code://src/emojis.test.ts](../../../../src/emojis.test.ts) - every glyph asks for no colour emoji"
  - "[code://src/app.css#L459-L462](../../../../src/app.css#L459-L462) - `.web-composer__box`, which becomes the size container"
  - "[code://src/app.css#L547-L582](../../../../src/app.css#L547-L582) - `.web-chip`"
---

## Objective

A footer pill reads "Approvals: Ask Before Edits" in a wide box.
It reads "Ask Before Edits" in a narrower box, and shows its icon alone in a narrow one.
The box's own width decides, in both composers, and the full label stays the pill's tooltip and accessible name.
The steps follow the proposed answers to open questions 8 and 9 of the plan.

## Files

- `CREATE: src/sessions/pill-labels.ts` - `PillLabels`, `settingLabels`, `modelLabels` and `settingIcon`.
- `CREATE: src/sessions/pill-labels.test.ts` - the three labels of a setting and of the model, and the icon map.
- `UPDATE: src/emojis.ts:84-86` - `approvals` and `model` glyphs, beside the disclosure carets.
- `UPDATE: src/sessions/pills.tsx:7-22` - `Pill` takes `short` and `icon` and renders the three labels.
- `UPDATE: src/sessions/Composer.tsx:356-369` - the model and setting pills pass their three labels.
- `UPDATE: src/sessions/New.tsx:56-83` - `SettingPill` passes its three labels to `Pill`.
- `UPDATE: src/sessions/New.tsx:382-385` - the model pill passes its three labels.
- `UPDATE: src/app.css:459-462` - `container: composer / inline-size` on `.web-composer__box`.
- `UPDATE: src/app.css:547-582` - `.web-chip__long`, `.web-chip__short`, `.web-chip__icon`, and the two container queries.

## Steps

1. Add `approvals: mono('⛨')` and `model: '✦'` to `EMOJIcon`, under a comment "composer pills".
2. In `pill-labels.ts`, export `interface PillLabels { long: string; short: string; icon: string }`.
3. Export `settingIcon(key: string): string` with `permissionMode` to `EMOJIcon.approvals` and `effortLevel` to `EMOJIcon.thinking`.
4. Make `settingIcon` return `EMOJIcon.settings` for any other key.
5. Export `settingLabels(option: Option): PillLabels`: `long` is the title, a colon and the value; `short` is the value.
6. Use `optionLabel(option)` for the value and `schema.title || key` for the title, as the pills do today.
7. Export `modelLabels(name: string): PillLabels`: "Model: " and the name, the name, and `EMOJIcon.model`.
8. Give `Pill` the optional props `short?: string` and `icon?: string`.
9. Render `label` in `.web-chip__long`, `short` in `.web-chip__short` and `icon` in `.web-chip__icon`.
10. Set the button's `title` to `title ?? label` and its `aria-label` to `label`.
11. Keep the caret after the three spans, so an open-able pill still shows it at every width.
12. In `Composer`, pass `settingLabels(option)` and `modelLabels(modelName ?? 'default')` to the footer pills.
13. In `New.tsx`, pass the same labels from `SettingPill` and the model pill; leave `TextPill` as it is.
14. Leave the Agent pill and the folder pill unchanged; they sit outside the box.
15. In `app.css`, add `container: composer / inline-size` to `.web-composer__box`.
16. Hide `.web-chip__short` and `.web-chip__icon` by default.
17. Under `@container composer (width < 40rem)`, hide `.web-chip__long` where a short label exists, and show `.web-chip__short`.
18. Under `@container composer (width < 28rem)`, hide the short label where an icon exists, and show `.web-chip__icon`.
19. Keep a pill with no short label or icon on its long label at every width.

## Validation

- `src/sessions/pill-labels.test.ts`: Approvals with `default` reads "Approvals: Ask Before Edits", "Ask Before Edits" and the approvals glyph.
- The same file: an unknown key gets `EMOJIcon.settings`; a boolean reads "on" or "off" as its short label.
- The same file: `modelLabels('Opus')` reads "Model: Opus", "Opus" and the model glyph.
- `src/emojis.test.ts` still passes with the two new glyphs.
- `pnpm typecheck` and `pnpm test` pass.
- In the browser: drag the window from wide to narrow; each footer pill goes long, short, icon, and back.
- In the browser: open a sidebar beside a session; its composer shortens by its own width, not the window's.
- In the browser: hover an icon-only pill; its tooltip is the full label. Check both themes.

## Resume
