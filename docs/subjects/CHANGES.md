# Changes

Changes lists the files the open session changed, with the lines added and removed in each. The host can offer operations on them, such as a commit or a pull request.

## Where it is

Changes is a tab in the right sidebar. The changes button in a session's header opens it. It shows the changes of the session open in the main area; with no session open it says "Open a session to see what it changed."

<Shot id="changes-list" alt="The Changes tab in the right sidebar, listing changed files" />

## The files

Each row shows the file's name, its folder, the lines added and removed, and a letter:

| Letter | |
| --- | --- |
| A | Added |
| M | Modified |
| D | Deleted |
| U | Untracked |

The bar above the rows shows how many files changed and the total lines. When the session has more than one set of changes, its name there is a menu to pick another.

| Action | |
| --- | --- |
| Open the change | Click a row to open its diff in the main area. See [Files](FILES.md) |
| **Show as a list** | One row per file, its folder beside it |
| **Show as a tree** | Files under their folders |
| **Filter files** | Narrows the rows by path |

The browser keeps the list or tree choice.

Hover a row for its buttons, or right-click it for its menu:

| Action | |
| --- | --- |
| **Open change** | Opens the diff |
| **Open file** | Opens the file itself; not on a deleted file |
| **Open as** | Opens the file in another viewer, such as Markdown |
| **Mark as reviewed** | When the host takes review marks; **Mark as not reviewed** undoes it |

The host's own operations on one file follow, by the name the host gives them.

## The header

| Button | |
| --- | --- |
| Host operations | The host's operations on all the changes, by the name the host gives them |
| **Reload** | Reads the changes again |
| **View options** | The host's operations again, list or tree, the grouping, the sort, **Expand all** and **Collapse all** |

An operation the host marks as needing a confirmation asks first. What the host answers shows above the files; a link it answers with opens in a new browser tab, and a file it names opens in its viewer.

The grouping is **By review** when the host takes review marks, **Staged and unstaged** when some files are staged, or **Not grouped**.

The files are sorted by path unless you pick **Sort by name** or **Sort by status**. In a tree, folders are always in name order. The browser keeps the sort.

## Commit

When the host offers a commit, it asks for a **Commit message** first. It commits the staged files, or every changed file when nothing is staged, and says which before you confirm.

## Pull request

When the host offers a pull request, **Create a pull request** asks the host for a title and a description, then shows them for you to edit. Tick **Open as a draft** to open it as a draft. The host commits what is uncommitted, pushes the branch and opens the request only when you press the button.

<Shot id="changes-pull-request" alt="The Create a pull request form with its title and description" />
