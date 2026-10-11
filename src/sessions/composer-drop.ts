import { useState, type DragEvent } from 'react';
import type { MessageAttachment } from '@microsoft/agent-host-protocol';
import { folderLabel } from '../connection/words.js';
import { carriesHostFile, droppedHostFile } from '../folders/drag.js';
import { resourceAttachment, withToken } from './attachments.js';

/** What a drop over a composer box would do: attach, or with Shift also write the path in as `@path`. */
export type Dropping = 'attach' | 'mention' | null;

/**
 * A composer box as a drop target: a host file from the explorer attaches, and with
 * Shift is also written in as `@path`; this computer's files attach as content.
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
  };
}
