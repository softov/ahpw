# Sessions

A session is one agent working in one folder on the host. You start it with a message, follow its answer as it works, and send it more.

## Where it is

The **Sessions** icon at the top of the activity bar opens the session list in the left sidebar. A session opens as a tab in the main area, and its details show in the right sidebar on the **Session** tab.

<Shot id="sessions-list" alt="The session list in the left sidebar" />

## The list

Each row shows a dot for the state, the title, when it last changed, the agent and the folder, and how many lines and files it changed. A running session shows what it is doing on a line of its own. An unread session has a bold title.

| Dot | |
| --- | --- |
| Needs you | It waits on an answer from you |
| Running | It is working |
| Failed | Its last turn ended with an error |
| Idle | It is done for now |
| Unread | It finished since you last opened it |
| Archived | It is archived |

Pinned sessions sit at the top under **Pinned**, the rest under **Other sessions**.

The buttons on the list header:

| Button | |
| --- | --- |
| **New session** | Opens a new session tab |
| **Reload** | Reads the list again |
| **Show sessions** | **All**, **Unread**, **Read** or **Running** |
| **Show archived** | Shows archived sessions too; **Hide archived** hides them again |
| **Group sessions** | Groups by **Folder**, **Status**, **Agent**, **Day** or **Week**, or **No groups**, with a second grouping under **Then by** |
| **Sort sessions** | Sorts by **Last changed**, **Created** or **Name**, newest or oldest first, with **Waiting on you first** |

The browser keeps the grouping and the sort. Type in **Filter sessions** to narrow the list. With every host shown, rows also name their host, and you can group by **Host**.

Right-click a row for its menu:

| Action | |
| --- | --- |
| **Open** | Opens the session |
| **Pin** | Keeps it at the top; **Unpin** undoes it |
| **Rename** | Asks for a new title |
| **Mark as read** | Or **Mark as unread** |
| **Archive** | Hides it from the list; **Unarchive** brings it back |
| **Copy link** | Copies a link to the session |
| **Delete** | Deletes the session and its history, after you confirm |

## A new session

**New session** opens a tab with a box that reads "What should it do?". Open it from the list header, the start page, the palette, `/new` in a chat, or Ctrl+N or Alt+N.

<Shot id="sessions-new" alt="A new session tab with the folder and agent pills and the message box" />

Above the box, two pills pick where and who:

| Pill | |
| --- | --- |
| Folder | Pick a recent folder, or **Open folder…** to browse the host's folders |
| **Agent** | Pick the agent; `/agent` in the box does the same |

Under the box, pills show the host's settings for the agent, and the model. **Hide options** hides the pills; **Show options** shows them again.

Press Enter or **Start** to start the session with the message. Shift+Enter breaks the line. With an empty box the button reads **Create** and makes the session without a message. If the folder is new to the host, ahpw asks you to trust it first. Leaving the tab with a message not sent asks first.

## A session

The session page shows the title, a badge for the state, and the turns one under another. Opening a session marks it read. The page follows the newest turn unless you scroll up. **Load older turns** reads earlier ones.

Each turn shows your message, any files you added, the answer, and a line of facts: **Copy the reply**, the time, how long it took, tokens in and out, the model, and the tool calls. A turn that was stopped or ended with an error says so.

The header has tools for the session:

| Tool | |
| --- | --- |
| Changes | How many files changed, and the lines added and removed; opens [Changes](CHANGES.md) in the right sidebar |
| Terminals | How many terminals it has; opens one, or the session details |
| Subagents | A menu of the subagents it started |
| Chats | Switches between the session's chats, when it has more than one |
| **Display** | Picks the view (formatted, raw or JSON), which steps to show, and **Hide calls** |

Tool calls that wait on you show **Approve** and **Deny**, or **Accept result** and **Reject**. A question from the agent shows its choices, with **Back**, **Next**, **Answer** and **Decline**.

## The composer

Type in the box at the bottom and press Enter to send. Shift+Enter breaks the line.

While the session is running:

| Key | |
| --- | --- |
| Enter | **Queue**: sends the message after this turn |
| Alt+Enter | **Steer**: sends it into the turn that is running |
| Escape | Stops the turn |

Queued messages show above the box, each with **Remove**.

<Shot id="sessions-composer" alt="The composer with a queued message, while the session runs" />

In the box:

| Type | |
| --- | --- |
| `/` | Lists commands: `/model`, `/attach`, `/stop`, `/new`, one per setting you can change, and the host's own commands |
| `@` | Lists the host's files to refer to |

The **+** button is **Add context**:

| Item | |
| --- | --- |
| **Files and folders** | A file on the host's machine |
| **Upload** | A file from this computer, up to 5 MB each |
| **Image from clipboard** | Needs a page on https or localhost |
| **Sessions** | Another session's chat |
| **Commands** | The `/` list |

The menu also lists the files this session changed. You can drop a file from the explorer or from your computer onto the box, or paste one. Hold Shift while you drop a host file to also write its `@` path.

The box keeps your draft on the host. Under it, the model pill, the setting pills and the context readout show what the next turn uses.

## Details

The **Session** tab in the right sidebar shows the open session: its agent, model, folder, terminals, project, when it started and changed, turns, tokens, tool calls, changes, and the automation run it came from. Click the folder to show it in the explorer. **New terminal** there starts a terminal in the session's folder.

## Notifications

ahpw tells you when a session needs you, failed or finished, unless you are watching it. Each notice has **Open**. A session that needs you keeps its notice until you answer. See [Interface](../use/INTERFACE.md) for notices in the background.
