# Interface

The interface settings choose the theme, the language, the main area's layout, where settings open and how questions are asked. The browser keeps them; the host keeps its own settings apart.

## Manage menu

The **Manage** gear at the bottom of the activity bar opens a menu.

| Item | |
| --- | --- |
| **Language** | Opens the language list in the [command palette](PALETTE.md) |
| **Layout** | Opens the layout menu. See [Window](WINDOW.md) |
| **Theme** | Opens the theme list |
| **Host** | Opens the host information. See [Host](../subjects/HOST.md) |
| **Settings** | Opens the settings |

Under a line, the menu shows your id on each host you signed in to as a person, with the host's name when there are several. Click it to open your [profile](../subjects/PROFILE.md). **Sign out** comes last; an app that embeds ahpw leaves it out.

<Shot id="interface-manage" alt="The Manage menu open from the activity bar" />

## Theme

The light or dark button in the title bar switches between the two looks. **Change theme…** in the palette, or **Theme** in the Manage menu, lists the themes.

## Settings

The settings have two tabs, **Host** and **Interface**. **Interface settings** in the palette opens the second. Interface settings apply as you change them.

<Shot id="interface-settings" alt="The Interface tab of the settings" />

| Setting | |
| --- | --- |
| **Theme** | The colours of the page |
| **Light or dark** | **System**, **Light** or **Dark**. System follows the operating system |
| **Language** | The language of the page; the host keeps its own. It starts from the browser's languages |
| **Main area** | How the main area shows its tabs: **Tabs** (the default), **Tab groups**, **Split**, **Spatial**, **Stack** or **Single** |
| **Settings open in** | **Floating window** (the default), **Editor tab**, **Right sidebar** or **Bottom panel** |
| **Confirmations** | **In the app** (the default) or **In a browser dialog** |

A choice made from a menu or the palette is the same setting as the one in this form.

A settings tab has an **Open in** button that moves the settings to another place, and **Settings open in** follows it.

When ahpw runs inside an app that embeds it with a profile, the interface settings are kept in that profile.

## Notifications

Notifications show at the bottom right, the newest nearest the corner.

| What | |
| --- | --- |
| Up to four | The rest fold into a line that counts them |
| Repeats | A notice raised again shows how many times |
| **Dismiss** | The × closes it |
| **Show details** | Shows the details, when it has some; **Hide details** folds them |
| Hover or focus | Holds the notice open |

Most notices close on their own after a while. A notice that waits on you, such as a session that needs you, stays until you act on it or dismiss it. **Dismiss all notifications** in the palette closes every one.

### In the background

The page can also send browser notifications while its tab is in the background. Run **Notify me when this tab is in the background** from the palette and allow it in the browser.

It notifies only when a session needs you, when an action finishes and when the connection is lost, and only while the tab is hidden or the window has been out of focus for a minute. Click a notification to bring the window back.

If the browser blocked them, it does not ask again: turn them on in the site settings beside the address bar.

### With the tab closed

The host can also send a notification when no ahpw tab is open. Run **Notify me when this tab is closed** from the palette and allow it in the browser. It needs a host that offers push, and a page served over HTTPS or from `localhost`. Click the notification to open the session in ahpw.

By default it notifies about every session of yours. To hear only about the sessions started in this browser, run **Notify me only about sessions started on this device**. To go back, run **Notify me about all my sessions**. To turn it off, run **Stop notifications when this tab is closed**.

When ahpw runs inside ahp-desk, the desk shows the notifications itself, and these commands are not in the palette.

### Confirmations

When ahpw asks you to confirm, such as before a delete, it asks in the app or in a browser dialog. **Confirmations** picks which. **Ask for confirmation in the app** and **Ask for confirmation in the browser** in the palette switch between the two.
