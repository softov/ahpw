# Automations

An automation sends a message to an agent, on a schedule or when you start it by hand. Each run is a session you can open. The host runs automations; ahpw lists them, edits them and starts them.

## Where it is

Automations has the ⏰ icon at the top of the activity bar. It is always there. The sidebar lists the automations; an automation opens as a page in the main area.

From the [Command palette](../use/PALETTE.md): **New automation** and **Show automations**.

<Shot id="automations-list" alt="The automations list in the sidebar, grouped by next run" />

## The list

Each row shows a status dot (**Running**, **Last run failed**, **On** or **Off**), the title and the next run time. Below that come the schedule in words (or **Run by hand**) and the agent, then how many runs it had and when the last one finished, or **Never run**. With several hosts, the row also names the host.

Type in **Filter automations** to narrow the list.

The buttons on the section header:

| Button | |
|---|---|
| **New automation** (+) | Opens an empty form. Shown when the host lets clients create automations. |
| **Reload** | Reads the list again. |
| **Show by status** | **All**, **Running**, **On**, **Off** or **Failed**. |
| **Group automations** | **No groups**, **Status** or **Next run**, and **Host** with several hosts. |
| **Sort automations** | **Name**, **Next run** or **Last run**. |

Grouped by next run, the groups are **Now**, **Overdue**, **Today**, **Tomorrow**, a weekday, **Later** and **Not scheduled**. Your group, sort and filter choices are kept in this browser.

The ▶ button on a row is **Run now**. Right-click a row for its menu:

| Action | |
|---|---|
| **Open** | Opens its page. |
| **Run now** | Starts a run now. |
| **Turn off** / **Turn on** | Stops or resumes its schedule. |
| **Edit** | Opens the form. |
| **Copy link** | Copies a link to it. |
| **Delete** | Deletes it after you confirm. Its run history goes with it. |

An action shows only when the host allows it.

## The page

The page head has **Run now**, **Turn off** or **Turn on**, **Edit** and **Delete**, each shown when the host allows it.

The facts list the agent (**The host default** when none is set), the model (**The agent default**), the folder, the schedule in words with its cron expression and time zone, what happens to missed runs (**Skipped** or **Run once when back**), when it turns off, the next run, the run count, and when it was created and changed. Below them is the **Message**, drawn as Markdown.

<Shot id="automations-page" alt="An automation page with its facts and runs" />

### Runs

The **Runs** table has a row per run: **Status**, **How**, **Started**, **Took** and **Tokens**. A run is **Waiting**, **Running**, **Done**, **Failed** or **Stopped**. **How** says whether it ran **By hand**, **Scheduled** or as a **Catch-up**, with the time it was due.

**Open session** opens the run's session in [Sessions](SESSIONS.md). **Stop** ends a live run, when the host supports stopping runs. **Load older runs** reads the next page when the host has more.

## Make or edit one

**New automation** and **Edit** open the same form.

| Field | |
|---|---|
| **Host** | Which host keeps it. New automations only, with several hosts. |
| **Title** | Its name. Required. |
| **Message** | What the agent is told each time it runs. Required. |
| **Agent** | Which agent runs it. **The host default** leaves the choice to the host. |
| **Model** | **The agent default**, or a model of that agent. |
| **Folder** | A folder on the daemon's machine. |
| **Schedule** | **By hand only**, **Every 10 minutes**, **Every hour**, **Every 6 hours**, **Every day at 09:00**, **Weekdays at 09:00**, **Every Monday at 05:00** or **Custom**. |
| **Cron expression** | Five fields: minute hour day month weekday. The hint says it in words, and names the host's shortest interval. |
| **Time zone** | Shown when there is a schedule. |
| **Missed runs** | **Skip them** or **Run once when back**. Shown when there is a schedule. |
| **Turn off after runs** | A whole number of runs. Empty keeps it on. |
| **Turn off after** | A date. Empty keeps it on. |
| **On** | Whether the schedule is live. |

**Examples**, on a new automation, opens ready-made automations grouped **For code** and **Everyday**. Picking one fills the title, message and schedule. If you already typed something, ahpw asks first: **Replace** or **Keep mine**.

**Create** or **Save** sends it; **Cancel** closes the form. If the host does not allow it, the form says "This host does not let clients create automations."
