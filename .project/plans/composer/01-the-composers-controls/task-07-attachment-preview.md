---
title: A click on an attachment the message carries shows it, in the composer and the transcript
status: done
depends: [task-01-add-context-at-the-plus.md]
layer: "ahpw src/sessions, src/app.css"
refs:
  - "[code://src/sessions/Attached.tsx#L12-L48](../../../../src/sessions/Attached.tsx#L12-L48) - `Attached`, the composer's attachment chips, and `AttachmentPreview`"
  - "[code://src/sessions/Page.tsx#L70-L89](../../../../src/sessions/Page.tsx#L70-L89) - `SentAttachments`, the transcript's chips; a host file opens with `ahp.openFile`"
  - "[code://src/sessions/attachments.ts#L21-L23](../../../../src/sessions/attachments.ts#L21-L23) - `embeddedAttachment`: `data` in base64 and `contentType`"
  - "[code://src/agents/Customizations.tsx#L96-L111](../../../../src/agents/Customizations.tsx#L96-L111) - scena's `Modal` as ahpw already uses it"
  - file:///github/ahpapp/src/components/AttachmentPreview.tsx - the preview this follows: an image as itself, text as text, anything else by type and size
---

## Objective

A click on the name of an attachment the message carries opens a preview over the page.
An image shows as itself, text as text, and anything else by its type and size, as ahpapp does.
It works on the composer's chips and on the transcript's.
A host file, a folder or a chat has no bytes in the message, so it keeps what it does today.

## Files

- `UPDATE: src/sessions/attachments.ts` - `hasPreview`, `previewOf`, `byteWords` and `AttachmentPreviewOf`.
- `UPDATE: src/sessions/attachments.test.ts` - each form of the preview, and the size words.
- `UPDATE: src/sessions/Attached.tsx` - `AttachmentPreview`, and the chip's name as a button.
- `UPDATE: src/sessions/Page.tsx` - `SentAttachments` opens the preview for an attachment the message carries.
- `UPDATE: src/app.css` - `.web-attachment__open` and `.web-attachment-preview*`.

## Steps

1. `hasPreview(attachment)` is true for an `embeddedResource` with string `data`; it is cheap, for every render.
2. `previewOf(attachment)` returns `null` without a preview, else `{ label, meta, image?, text? }`.
3. `meta` is the content type and the decoded size through `byteWords`, as `image/png · 14.1 KB`.
4. An `image/*` type gives `image` as a `data:` URL.
   A text, JSON, XML, script or YAML type gives `text`, decoded as UTF-8 and cut at 200,000 characters.
5. `previewOf` runs on the click only, so a 5 MB image is not decoded on each keystroke.
6. `AttachmentPreview({ preview, onClose })` renders scena's `Modal` with the label as title, the meta, then the image or the text.
7. In `Attached`, the chip's icon and name become a `.web-attachment__open` button when `hasPreview`; the remove button stays beside it.
8. In `SentAttachments`, a chip with a preview opens it; a host file still opens with `ahp.openFile`.
9. In `app.css`, the image fits the modal, at most 70% of the window high.
   The text scrolls in a monospace block.

## Validation

- `src/sessions/attachments.test.ts`: a PNG gives its `data:` URL and `image/png · 4 B`.
- The same file: Markdown and JSON give their text, decoded as UTF-8.
- The same file: a zip gives its type and size alone; a host file has no preview.
- `pnpm typecheck` and `pnpm test` pass.
- In the browser: upload an image in the composer, click its name, and see it in the modal.
  Close it with the X, Escape and a click outside.
- In the browser: send a message with an image, and open it from the transcript.
- Check both themes.

## Resume
