---
title: UI settings are kept by the browser, or by an embedder's profile when it gives one, with the browser keeping a copy
status: accepted
date: 2026-10-19
refs:
  - "[code://src/shell/embed/index.ts](../../src/shell/embed/index.ts) - the `Embedder` contract ahpw owns, which gains `profile`"
---

## Context

Softov asked on 2026-10-19 for "a UI config, where user will be able to configure some ui behaviour."
Asked "Where should the UI config be kept?", Softov answered "This browser. Gated so ahp-desk can save as json locally, as a profile."
Asked "With ahp-desk's profile present, what is the source of truth?", Softov answered "Profile, browser keeps a copy".
Asked whether to build ahp-desk's side too, Softov answered "ahpw only, ahp-desk later".

## Decision

Each UI setting is kept where it is kept today, in the browser.
The `Embedder` contract gains an optional `profile` with `read()` and `write(values)`; when it is there, ahpw reads it at start, applies what it holds, and writes every UI setting to it, whole, each time one changes.
The browser keeps its copy either way, so the first paint has the theme before the profile answers.

## Consequences

An embedder that gives no profile changes nothing.
ahp-desk saves the profile as a JSON file in its own plan; the contract is the handover.

## Options

- Per user on the host: lost, Softov chose the browser; ahpd keeps no UI preferences.
- The profile only, nothing in the browser while embedded: lost, the first paint would use defaults until the profile answers.
