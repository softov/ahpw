import { useState, type ClipboardEvent, type DragEvent } from 'react';
import type { MessageAttachment } from '@microsoft/agent-host-protocol';
import { folderLabel } from '../connection/words.js';
import { carriesHostFile, droppedHostFile } from '../folders/drag.js';
import { resourceAttachment, withToken } from './attachments.js';

/** What a drop over a composer box would do: attach, or with Shift also write the path in as `@path`. */
export type Dropping = 'attach' | 'mention' | null;

/**
 * A composer box as a drop target: a host file from the explorer attaches, and with
 * Shift is also written in as `@path`; this computer's files attach as content.
 * A paste of files, as a screenshot or a copied file, attaches them the same way.
 */
export function useComposerDrop({ attach, insert, upload }: {
  attach: (attachment: MessageAttachment) => void;
  insert: (words: string) => void;
  upload: (files: FileList) => void;
}): {
  dropping: Dropping;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onPaste: (event: ClipboardEvent) => void;
} {
  const [dropping, setDropping] = useState<Dropping>(null);
  return {
    dropping,
    onDragOver: (event) => {
      const host = carriesHostFile(event.dataTransfer);
      if (!host && !Array.from(event.dataTransfer.types).includes('Files')) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setDropping(host && event.shiftKey ? 'mention' : 'attach');
    },
    onDragLeave: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropping(null);
    },
    onDrop: (event) => {
      setDropping(null);
      const host = droppedHostFile(event.dataTransfer);
      if (host !== null) {
        event.preventDefault();
        const attachment = resourceAttachment(host.uri, host.directory);
        if (!event.shiftKey) {
          attach(attachment);
          return;
        }
        // As ahpapp: the path goes in as `@path` (a folder with its slash) and the file is attached
        // with that token, so the host gets the file and the text says where it was named.
        const token = `@${folderLabel(host.uri)}${host.directory ? '/' : ''}`;
        insert(`${token} `);
        attach(withToken(attachment, token));
        return;
      }
      if (event.dataTransfer.files.length === 0) return;
      event.preventDefault();
      upload(event.dataTransfer.files);
    },
    onPaste: (event) => {
      const files = pastedFiles(event.clipboardData);
      if (files === null) return;
      event.preventDefault();
      upload(files);
    },
  };
}

/**
 * The files a paste carries, or nothing when it is text. A copy from a document
 * often carries a picture of the selection beside its text: that pastes as text.
 */
export function pastedFiles(data: Pick<DataTransfer, 'types' | 'files'>): FileList | null {
  if (data.files.length === 0 || Array.from(data.types).includes('text/plain')) return null;
  return data.files;
}
