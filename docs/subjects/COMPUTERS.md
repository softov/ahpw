# Computers

A computer is a machine an agent can work on: a container the host runs, or a box it reaches over SSH. This page lists them, shows what each is doing, and starts, stops and makes them. It comes from ahpd's computer plugin.

## Where it is

Computers has the 💻 icon in the activity bar. It shows while a host serves computers. The sidebar lists the computers; a computer opens as a page in the main area.

From the [Command palette](../use/PALETTE.md): **Show computers** and **New computer**.

<Shot id="computers-list" alt="The computers list in the sidebar" />

## The list

Each row shows the computer's name, its image or destination, and its state: **running**, **stopped** or **problem**. A problem is a machine that ran out of memory or stopped with an error code. Type in **Filter computers** to narrow the list.

The buttons on the section header:

| Button | |
|---|---|
| **New computer** (+) | Opens the form. |
| **Reload** | Reads the list again. |
| **Show by state** | **All**, **Running**, **Stopped** or **Problems**. |
| **Group computers** | **No groups** or **State**, and **Host** with several hosts. |

The ▶ or ⏹ button on a row is **Start** or **Stop**. It shows for machines the host runs itself, such as containers, and not for SSH boxes, which are only listed.

Right-click a row for its menu:

| Action | |
|---|---|
| **Open** | Opens its page. |
| **Start** / **Stop** | Starts or stops it. |
| **Restart** | Restarts it, while it runs. |
| **Copy name** | Copies its name. |
| **Remove** | Deletes it after you confirm. The machine and what it holds are deleted; mounted host folders stay. |

An action shows only when the host lets you do it.

## The page

The head shows the state and has **Start** or **Stop**, **Restart** and **Remove**. A machine stopped for running out of memory says so.

The facts list the **Image** or **Destination**, **Command**, **Working directory**, **Network**, **CPUs**, **Memory limit**, **Exit code**, when it **Started** and was **Created**, and the container or process behind it.

| Section | |
|---|---|
| **Use** | CPU and memory bars, with processes, network and disk. Read every 5 seconds while it runs. |
| **Mounts** | Each host folder and where it shows inside, marked read only when it is. |
| **Runtime details** | What the host's runtime reports, as raw JSON. Folded at first. |

<Shot id="computers-page" alt="A running computer's page with its use bars" />

## Make one

**New computer** opens a form. **Name** is how the machine is known, and it cannot change later; it may not hold `/`, `\` or `?`, and may not be `.` or `..`. With more than one host, **Host** picks which one makes it. The other fields come from the host's computer plugin. **Create** makes it; **Cancel** closes the form.

If the host does not let you make computers, the form says so.
