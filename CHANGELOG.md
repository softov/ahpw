# Changelog

All notable changes to `@ahpd/web` (ahpw) are listed here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.5.0] - 2026-10-18

### Added

- **A window with every host.**
  An embedder that says `mode: 'multi'` gets one window over all its hosts: a connection per host, a host switcher, a host filter on the lists, and each panel naming its host.
  A host that is down says so in its rows and pages, and a new session asks which host it runs on.
- **The embed contract grows for it.**
  `mode`, `token(id)` for any host, `manageHosts({ edit })` to open a host's form, and `onFocusHost` to show a host the embedder asks for.
  An embedder that gives none of them is a one-host window, as before.
- **Users and roles, teams and projects**, listed, made, edited and deleted through ahpd's people channels and commands, read-only where the host takes no writes; a team's or project's page staffs it.
- **Usage**, pooled by day, week, month or a range, or summed by user, team or project, with a check for each key, so it sums by several at once.
  A pool's page shows its periods and records, each opening its session.
- **Computers**: a list, a page and a create form from the host's manifest.
- **Bots**, drawn with @cofold/bood 0.2.0: a list, a page and a form; bots float at the window's edges and can be dragged.
  A bot has a chat page with the session's header, a popover to talk from the dock, and a menu on right click or a long press.
  A bot's body is any of bood's bodies, a new bot takes its body's name, and a name bood does not know is drawn as a square.
  A bot follows the pointer, glances, tilts and moves on its own, and keeps looking where the pointer left the window.
- **A Raw view of a chat**, from the header's ⋯ menu: each step as one row, numbered and coloured by who it is, opened in place as formatted facts, raw JSON with copy, or a JSON tree.
  A turn's heading opens the same way, and filters keep the tool calls or the subagents.
- **Hide calls**, from the same menu: the chat leaves out its runs of tool calls and thinking, except one waiting on an approval.
- **The session header**: changed files, terminals, the subagents a chat's calls hand work to, the session's own chats, and a way back from a subagent's chat.
- **Trusted folders.**
  ahpw asks once per folder and host, tells the host the trusted folders on every connect, and answers its trust request, so an ACP agent such as Codex starts from ahpw.
  The host page lists them, with Forget.
- Sessions group by two keys, day and week among them, sort with an urgency flag, can be pinned, and show by read or running.
- Automations group, sort and filter by status.
- The new session picks folder and host in one pill; Ctrl+N and Alt+N open it.

### Changed

- A host's plugin offers are read from its initialize answer.
- A running session counts as changed.
- On a narrow screen, showing one sidebar puts the other away.
- The favicon is built from `src`, so its name follows its content and a tab picks up a new logo.

### Fixed

- A file gone or refused says so in words, not as the host's RPC error.
- A question answered elsewhere, as in a bot's chat, leaves the page.
- The form page keeps its padding when the left sidebar is hidden.

## [0.4.0] - 2026-10-15

### Added

- **ahpw speaks English, Latin American Spanish and Brazilian Portuguese.**
  Every page, menu and notice is translated through scena's i18n, and dates and counts follow the chosen language.
  The language is picked from the palette, and a command is still found by its English name.
- **A Manage menu on the activity bar.**
  The gear opens Language, Layout and Theme as lists in the palette, then Settings, and Sign out below a line.
- **Customize Layout**, from the palette or the title bar: which parts show, the main area's layout, and the layout modes, each with its shortcut.
- **The explorer stacks Open Editors over Folders.**
  Open Editors lists the open pages; a click shows one and its x closes it.
  It is as tall as its rows, up to half the sidebar, and a divider between the panes resizes them.
- **The composer's + opens Add context** as a menu at the button: the clipboard's image, the session's changed files, an upload, or a mention.
- A screenshot or a copied file pasted with Ctrl+V attaches; a click on an attachment previews it, in the composer and the transcript.
- A new session picks its agent, model and settings from the box's own list, as an open session does; /agent, /model and each setting's / name work there too.
- Settings and command forms write JSON in the code editor, with lint, and hold Save or Run while it does not parse.
- The right sidebar's menu brings back Session or Changes after its tab is closed.
- The explorer keeps its open folders across views and reloads.
- The new ahpw logo, and the favicon made from it.

### Changed

- **The page is served under `/plugins/web/`.**
  The plugin's id is `web`, because ahpd 0.12.0 takes only a slug as a plugin id. A link to `/plugins/ahpd-web/` stops answering.
- **A narrow window works as layers.**
  The left sidebar covers the page from the title bar to the activity bar, the right sidebar covers the left, and a tap beside them closes one at a time.
  An activity item pressed again closes its sidebar, at every width, and the layout is the same after a reload as after a resize.
- Sidebar sections take scena's header: a title and the section's buttons, each a command, such as New, Reload, Show archived and Group.
- Group opens its choices as a menu under the button.
- The title bar holds light or dark, the layout menu, and the three layout toggles; the theme picker and Sign out moved to Manage.
- The right sidebar shows Session and Changes as tabs.
- The palette is web-next's, with sub-lists; a list opened on its own shows only that list.
- Composer pills go short, then icon only, as the box narrows; the footer puts session settings left and the model and context size right.
- A file's page reads in a centred 980px column.
- Activity bar buttons have no fill in any theme; the open one shows by its accent edge, on the bottom in a narrow window.
- Built on scena 0.5.7 and against @ahpd/sdk 0.12.

### Fixed

- **A reload no longer leaves the explorer and the open files unreadable.**
  A read made before the connection is up now waits for it, instead of failing for good.
- A command run from the palette closes it.
- The favicon is served by the dev server.
- A notice on a file's page sits in the page's margins.
- An opened thought no longer repeats its words.

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

[Unreleased]: https://github.com/softov/ahpw/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/softov/ahpw/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/softov/ahpw/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/softov/ahpw/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/softov/ahpw/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/softov/ahpw/compare/afca330...v0.2.0
[0.1.0]: https://github.com/softov/ahpw/tree/afca330
