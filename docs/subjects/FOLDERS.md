# Folders

The explorer shows the host's folders as a tree. You open files from it, drag them into a chat, and create, upload, rename, copy or delete files and folders on the host.

## Where it is

The **Explorer** icon on the activity bar opens it in the left sidebar. **Show the explorer** in the palette does the same. The explorer has two panes: **Open editors** on top, then **Folders**.

<Shot id="folders-tree" alt="The explorer with Open editors over the folder tree" />

## Open editors

**Open editors** lists the tabs open in the main area. Click one to show it. Its × closes the tab, and asks first when the tab has changes not saved. With no tab open it says "Nothing is open."

## The tree

The tree starts from these folders, in this order:

1. The host's default folder, marked **default**.
2. Each folder a session works in, newest session first.
3. The folders you added in this browser.

With every host shown, each host has a branch of its own, named for it.

| Action | |
| --- | --- |
| Open a folder | Click it to open or close it |
| Open a file | Click it to open it in the main area. See [Files](FILES.md) |
| Drag a file | Drop it on a chat's box to add it to the message. See [Sessions](SESSIONS.md) |
| **Refresh** | The header button reads every open folder again |

The browser keeps which folders are open. A link to a folder, such as the folder in a session's details, opens the tree down to it.

## Row menu

Right-click a row for its menu. Each item shows only on the rows it applies to.

| Action | |
| --- | --- |
| **Open** | Opens the file in its first viewer |
| **Open with** | One item per viewer, such as **Open with Markdown**, when the file has more than one |
| **New file** | Asks for a name and creates an empty file in the folder |
| **New folder** | Asks for a name and creates a folder in the folder |
| **Upload** | Uploads files from this computer into the folder |
| **Copy path** | Copies the path of the file or folder |
| **Download** | Saves the file to this computer |
| **Rename** | Asks for a new name |
| **Copy** | Asks for a name and copies the file or folder beside it |
| **Remove folder** | Takes a folder you added out of the tree; nothing is deleted on the host |
| **Delete** | Deletes the file or folder on the host, after you confirm. A folder goes with everything in it |

The folders at the top of the tree cannot be renamed, copied or deleted from the menu.

A name cannot be empty, hold a slash, or be a dot.

Right-click the space under the rows for **Reload** and **Add folder**.

## Add a folder

**Add folder** asks for a folder path on the host, starting from its default folder.

<Shot id="folders-add" alt="The Add folder dialog listing the folders under the typed path" />

| Key | |
| --- | --- |
| Up, Down | Move through the folders listed under the path |
| Tab | Goes into the folder picked, or the first one listed |
| Enter | Goes into the folder picked, or adds the path when none is picked |
| Escape | Closes the dialog |

`~` stands for the host's default folder. **Add** adds the path. The folder then shows in the tree, and the browser keeps it.
