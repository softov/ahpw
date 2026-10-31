---
title: A plugin page draws its view
created: 2026-10-31
refs:
  - file:///github/ahpd/.project/plans/plugin/20261031-1200-a-plugin-shows-its-state/plan.md - the ahpd plan that puts `views.<surface>` on a row of `x-ahpd-plugins`
  - "[code://src/resources/plugins/Overview.tsx](../../src/resources/plugins/Overview.tsx) - the plugin page's Overview, where its alerts are drawn"
  - "[code://src/resources/plugins/PluginPage.tsx](../../src/resources/plugins/PluginPage.tsx) - the page and its tabs"
  - npm://@softov/scena@^0.5.16 - `a2uiV010Converter` in `core/converters/a2ui-v0.10.ts`, which reads an A2UI v0.10 surface
---

ahpd plans to let a plugin send a view, a small A2UI v0.10 surface, and to put it on the plugin's row as `views.main`.
The first view is the Dev Tunnel plugin's state: the tunnel URL, the id, the port, the relay and the client count.
The plugin page can draw `views.main` through scena's A2UI converter, at the top of Overview, and draw it again when the row changes.
A Button sends its event name as a request, with its context as the params.
When the host refuses the request, the page shows why.
The page draws any view the host sends, with no plugin named in ahpw.
