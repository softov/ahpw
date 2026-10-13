# Changelog

All notable changes to `@ahpd/web` (ahpw) are listed here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.1] - 2026-10-13

### Added

- **A start page in an empty main.**
  With nothing open, the main area shows the mark and New session instead of an empty group, through scena 0.5.5's `surfaces.setEmpty`.
- **A running session's row shows its change counts**, above what it is doing, as ahpapp does.

### Fixed

- **Session change counts follow the host.**
  The AHP SDK's session cache drops `changes` from a summary change, so the counts stayed as first listed, and a relist was undone by the next host event.
  ahpw keeps what the cache drops and lays it over its rows.
- The Changes pane no longer shows "Empty" under its own note.

### Changed

- **Each host keeps its own pages when embedded.**
  An embedder serves every host from one origin, so the open tabs, the layout and the added folders are kept per host address.
  The embedding contract gains `hostUrl`, the page's host address, known before ahpw runs.
  The theme and the other personal choices stay shared; in a browser nothing changes.

### Removed

- The README no longer lists administration screens, which are off while ahpw speaks AHP only.

## [0.3.0] - 2026-10-12

### Added

- **Runs inside [ahp-desk](https://github.com/softov/ahp-desk).**
  ahpw owns its embedding contract, exported as `@ahpd/web/embed`.
  An embedder gives it the host, the token, the host list and the window controls through `globalThis.ahpwEmbedder`.
  In a browser and as the ahpd plugin, nothing changes.
- **Host switcher**, when embedded: every host with its status, then Manage hosts and Add host.
- **Close guards.**
  An unsent new session and an edited file ask before they close.
  This covers the tab's ×, the close commands, and Esc on a spatial card.
- **New session box.**
  The agent and the folder sit on top.
  The +, the model and the settings sit at the bottom of the composer.
  - `@` walks the host's folders and cites a file by its full path.
  - A drop from the explorer attaches the file. With Shift, it writes `@path` instead.
  - The folder box fits its path and opens a folder menu.
    The menu shows the parent with the folder selected among its siblings, the host's folder, and the folders the host's sessions use.
- **Add folder** walks to the folder, as VS Code does.
- **Code editor, media viewers, explorer menus and agent customizations.**
  Explorer files show an icon for their kind.
- The agent's `/` commands are offered in a new session.
  Skill names and descriptions can be copied.
- **`AHPW_SCENA`** runs ahpw on the source of a scena checkout, to try a scena change before it is released.

### Changed

- **scena 0.5.4.**
  Select menus are themed, pages can guard their close, and Esc in a picker keeps the typed text.
  The CSS that ahpw carried for these is removed.
- **The images in a markdown file** are read from the file's folder through the host.
  They no longer ask the page's own server.
- **The ahpd plugin answers `ahpw.json`,** so the page loads with no 404 in the console.
- Running sessions show a four-dot loader.
- Settings with no choices are hidden.
- The explorer's scrollbar shows only on hover.
- The tab strip has no scrollbar. The mouse wheel scrolls it.

### Fixed

- A Windows folder is read from its drive letter (`C:/work`), not as a URI scheme.
- Copy works without the clipboard API.
  The two copy icons are told apart without words.
- A composer chip stays readable on hover.

## [0.2.0] - 2026-10-09

### Added

- **Explorer of the host's folders.**
  A file dropped from it goes into the composer.
  A folder opens in the explorer, and a link opens at its line.
- **Changes view.**
  Changes show as a list or a tree, grouped by review, with file actions.
  The header has a scope toggle, totals, icon actions and a view menu.
  The scope is picked from a menu, and the view opens on the server's first scope.
- Commit and pull request ask before they run, and their links open.
- **Session details:** ids, a folder link, the session's terminals, and a new terminal.
  A new terminal is named for its folder.
- A notification when a session needs you or finishes.

### Changed

- **scena 0.5.1.**
  The hover workarounds are removed, and menu items have a tooltip.
- **Composer:** the folder and the agent above the box, round Send and Stop buttons, and no empty fixed pills.
- Tabs take their icon from the component and keep only the title.
- The main tabs come back after a reload.
- The sidebar stays on the section you chose.
- Links underline on hover, and commit and PR rows are coloured.

## [0.1.0] - 2026-10-09

The first release: a web UI for an [Agent Host Protocol](https://microsoft.github.io/agent-host-protocol/) server.

### Added

- **Two ways to run.**
  As an ahpd plugin, served at `/plugins/ahpd-web/`.
  Or on its own with `ahpw serve`, which serves the page and carries its socket to the server.
  The CLI reads `AHPD_URL`, `AHPD_HOST` and `AHPD_TOKEN`.
- **Sessions over AHP:** grouping, badges, an unread count, a question card, and runs of tool calls and thinking folded into one line.
- **Composer** as one bordered box, with + to add files, uploads and sessions.
  File paths, chips and the host's `/` commands are in the composer.
- **Automations, host settings and host information.**
- **Agents explorer.**
- **Files, diffs, changes, a command palette, shortcuts and a right sidebar.**
- **Bottom panel:** a log tab, host terminals as tabs, disconnect, and layout toggles.
- **File viewers and notifications.**
- AHP 0.10.0 is offered, for VS Code 1.141 hosts.
- The status bar names the host by its `serverInfo`.
- The logo, the AW icon, and monochrome emojis kept in one place.
- Page components load lazily, one chunk per page.
- CI, an npm release with provenance, and screenshots.

[Unreleased]: https://github.com/softov/ahpw/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/softov/ahpw/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/softov/ahpw/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/softov/ahpw/compare/afca330...v0.2.0
[0.1.0]: https://github.com/softov/ahpw/tree/afca330
