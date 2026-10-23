---
title: A plugin's page and row show its version and whether it loaded
status: done
depends: [task-03-a-plugins-page-and-overview.md]
layer: "ahpw plugins"
refs:
  - file:///github/ahpd/packages/server/src/pluginschannel.ts - `rowOf`, which has no version and no load result today
  - file:///github/ahpd/packages/server/src/plugins.ts - `describePlugin`, which reads package.json but not its version, and `LoadedPlugins.problems`, which are only logged
---

## Objective

A plugin's row and page show its package version, and whether it loaded, with the load problem when it did not.
The Options tab reads the options schema from the row.

## Blocked on

ahpd's `x-ahpd-plugins://` row has none of these at main `18bac1c2`.
ahpw asked ahpd's builder on 2026-10-22 for `version`, a live load status with its problem, and `optionsSchema` on a row.
Read the shape ahpd ships, and correct these steps before starting.

## Files

- `UPDATE: src/bridges/plugins.ts` - the new row fields.
- `UPDATE: src/resources/plugins/rows.ts` - the version on a row, and a failed load as `failed`.
- `UPDATE: src/resources/plugins/Overview.tsx` - the version and the load status.
- `UPDATE: src/resources/plugins/Options.tsx` - the schema from the row, not the root config.

## Steps

1. Read the row ahpd shipped, and correct these steps to its shape.
2. Add the new fields to `PluginRow`.
3. Show the version on the row and in the facts.
4. Show a failed load as an error, with its problem, over the configured state.
5. Read the options schema from the row.
6. Remove the note that ahpd reads the state from the configuration.

## Validation

- `npx tsc -b` and `npx vitest run` pass.
- By hand: a plugin whose `apply` throws shows as failed, with its problem.

## Resume

Done on 2026-10-22, against ahpd main at 13b19150.
The row carries `version`, `loaded`, `loadProblem` and `optionsSchema`; a failed load shows `failed` over the configured state.
A `loadProblem` that repeats `problem` is said once.
Options read the schema and the held values from the row.
They save each changed key through `x-ahpd/plugins/options`, which refuses a bad value in the host's words.
A refused value stays in the form.
After a command, ahpw reads the root again for `ahpd.restartNeeded`, and its own restart marker is gone.
The protocol client drops the `x-ahpd/restartNeeded` push, since it does not know the notification.
By hand: Bot shows 0.13.0 and running; lastChats -5 refused; 20 saved; enabling push showed the restart note.

