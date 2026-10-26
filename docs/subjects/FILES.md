# Files

A file on the host opens as a tab in the main area, in a viewer that suits it: text in an editor, Markdown drawn as a page, an image, a video or a sound. A change a session made opens as a diff.

## Where it is

Files open in the main area. Open one from the [explorer](FOLDERS.md), from [Changes](CHANGES.md), or from a link or a tool call in a [session](SESSIONS.md).

Each file tab shows the file's path with a **Copy path** button.

## Viewers

| Viewer | Opens |
| --- | --- |
| **Text** | Any file, in the editor |
| **Markdown** | `.md` and `.markdown` files, drawn as a page |
| **Image** | Image files |
| **Video** | Video files |
| **Audio** | Sound files |

A file opens in the viewer that suits it best. A file tab's menu lists the file's other viewers as **Open as** followed by the viewer's name. A Markdown tab has a button to switch: **Show as text** on the drawn page, **Show as Markdown** on the text.

## The editor

The text viewer is an editor with line numbers, folding, bracket matching, search and colours for the file's language. A link that names lines opens the file scrolled to them.

<Shot id="files-editor" alt="A file open in the editor, with its path and the Edited mark" />

| Key | |
| --- | --- |
| Ctrl+S | Saves the file to the host |

While the file has changes not saved, the header shows **Edited**. Closing the tab with changes not saved asks first.

The save is refused when the file changed on the host since you opened it. Copy your edit, then reopen the file. When the host does not let you write the file, it shows **Read-only**.

A file over 5 MB shows its start only, read-only. A file that is not text says so.

## Markdown

The Markdown viewer draws the file as a page, with its images. A link or a code span that names a file or a folder on the host opens it, a path relative to the file included. A web link opens in a new browser tab.

## Images, video and sound

| Viewer | |
| --- | --- |
| **Image** | **Zoom out**, **Zoom in**, and the percent button to **Fit**. The mouse wheel zooms, a drag moves the image, and a double-click fits it |
| **Video** | The browser's own player |
| **Audio** | **Play** and **Pause**, a bar to move through the sound, the time, and a button that changes the **Speed** |

Images, videos and sounds over 64 MB are not shown.

## Diffs

A change opens as a diff: the lines removed and added, with the line numbers before and after. The title says when the file is a new file or was deleted.

<Shot id="files-diff" alt="A diff tab with its lines added and removed" />

| Action | |
| --- | --- |
| **Viewed** | Marks the change as reviewed, when the host takes review marks |
| Host operations | The host's operations on the file, by the name the host gives them |
| **Open file** | Opens the file itself |
