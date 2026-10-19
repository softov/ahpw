---
title: UI settings have their own tab in the settings window, beside the host's, and apply as they change
status: accepted
date: 2026-10-19
supersedes: decisions/ui-settings-sit-in-the-settings-window-and-apply-at-once.md
refs:
  - "[code://src/resources/host/Settings.tsx](../../src/resources/host/Settings.tsx) - the Host and Interface tabs"
  - https://github.com/softov/scena/blob/main/packages/scena/src/ui/navigation/Tabs.tsx - scena's `Tabs`, which gains `onChange`
---

## Context

The UI settings were first built as a group in the host's sections tree, one form with the host's keys.
Seeing it, Softov asked on 2026-10-19: "you mixed both config on the same panel? where is the tab?", the way VS Code's settings put User and Workspace on tabs.
Asked earlier "When does a UI setting take effect?", Softov answered "At once, as you change it", which still holds.

## Decision

The settings window has two tabs: Host, the host's settings, which wait for Save, and Interface, the browser's own, each with its own form and its own fields, JSON and sections views.
A UI setting applies and is kept the moment it changes; the Interface tab has no Save and says so.
The tab last chosen is the one the settings open on.

## Consequences

The host's JSON holds only the host's keys, and a host that publishes no settings still has an Interface tab.

## Options

- One form, the UI keys a group in the host's tree: lost, Softov asked for a tab.
