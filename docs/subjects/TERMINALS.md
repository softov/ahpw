# Terminals and log

A terminal is a shell running on the host. ahpw shows each one as a tab in the bottom panel, beside the log of what the page did.

## Where it is

Both live in the bottom panel. **Toggle panel** (Ctrl+J) shows it, and **Show log** opens it on the log. See [Window](../use/WINDOW.md).

<Shot id="terminals-panel" alt="The bottom panel with the Log tab and a terminal tab" />

## Terminals

Every terminal the host lists gets a tab after the **Log** tab, opened in the background. Closing a tab only hides it: the terminal keeps running on the host. Open it again from the [command palette](../use/PALETTE.md), from a session's header or from its details.

The palette lists every terminal by its title, with who holds it on the second line: **Yours**, **In use by a session** or **In use by another client**, and its exit when it has exited.

| Action | |
| --- | --- |
| **New terminal** | Starts a terminal in the host's default folder, named after the folder. From a session's details it starts in the session's folder. With every host shown, it asks which host first |
| **Disconnect terminal** | Stops showing the terminal here; it keeps running on the host |
| **Connect terminal** | Shows a disconnected terminal again |
| **Kill terminal** | Ends its process on the host, after you confirm |

These are buttons on a terminal tab, and items in the tab's menu.

You can type in a terminal only while you hold it. When a session or another client holds it, the tab says so and offers **Take over**. A terminal that exited says so, with its exit code when there is one.

## Log

The **Log** tab is always first in the panel. It lists what the page did, one line per event, with the time, the level and where it came from.

<Shot id="terminals-log" alt="The Log tab with its scope chips, level and filter" />

| Control | |
| --- | --- |
| **All** | Shows every scope but **Traffic** |
| **Connection**, **Session**, **Terminal**, **Traffic** | Shows only the scopes picked. **Traffic** is every message on the wire, at every level |
| Level | Click to change the least severe level shown, such as **info and up** |
| **Filter** | Narrows the lines by words; `!word` leaves out the lines with that word |
| **Copy the lines shown** | Copies every line that shows |
| **Clear log** | Empties the log. A button on the tab, and in the palette while the log shows |

Click a line to open it in place, and again to close it. An open line has **Copy the line**.

A terminal, session, file or web address in a line is a link. Ctrl+click it, or Cmd+click on a Mac, to open it.
