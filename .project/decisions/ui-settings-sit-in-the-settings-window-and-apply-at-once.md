---
title: UI settings sit in the settings window as their own group, and apply as they change
status: superseded
superseded-by: decisions/ui-settings-have-their-own-tab-in-the-settings-window.md
date: 2026-10-19
refs:
  - "[code://src/resources/host/Settings.tsx](../../src/resources/host/Settings.tsx) - the settings page"
  - "[code://src/resources/host/sections.ts](../../src/resources/host/sections.ts) - the groups of the sections view"
---

## Context

Asked "Where should the UI config open?", Softov answered "Same settings window": a UI group in the sections tree beside Host, Daemon, Plugins and VS Code.
Asked "When does a UI setting take effect?", Softov answered "At once, as you change it".
Asked "What should it hold first?", Softov answered "Existing choices gathered": theme, language, layout, how a question is asked, where the settings open.

## Decision

The settings form holds the host's keys and the UI keys, `ui.<name>`, together; the sections view lists the UI keys under their own group.
A UI key applies and is kept the moment it changes, as its menu does; only the host's keys wait for Save, and Save, Reset and the dirty state count the host's keys alone.
The UI group shows even where a host publishes no settings.

## Consequences

A choice made from a menu shows in the form, and one made in the form shows in the menu, since both read and write the same place.
The JSON view shows the UI keys beside the host's.

## Options

- A window of its own from the Manage menu: lost, Softov chose the same window.
- UI keys wait for Save with the host's: lost, Softov chose at once.
