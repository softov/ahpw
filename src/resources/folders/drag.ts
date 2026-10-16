/** The `dataTransfer` type that carries a host file, so a drop can tell it from a file on this computer. */
export const HOST_FILE_TYPE = 'application/x-ahpw-host-file';

/** What a dragged host file carries. */
export interface DraggedHostFile {
  /** The `file://` URI on the host. */
  uri: string;
  directory: boolean;
}

/** Puts a host file on a drag. */
export function setHostFile(data: DataTransfer, file: DraggedHostFile): void {
  data.setData(HOST_FILE_TYPE, JSON.stringify(file));
  data.setData('text/plain', file.uri);
  data.effectAllowed = 'copy';
}

/** Whether a drag carries a host file. Readable while dragging, when the data itself is not. */
export const carriesHostFile = (data: DataTransfer): boolean => Array.from(data.types).includes(HOST_FILE_TYPE);

/** The host file a drop carries, or null for anything else. */
export function droppedHostFile(data: DataTransfer): DraggedHostFile | null {
  try {
    const held = JSON.parse(data.getData(HOST_FILE_TYPE)) as Partial<DraggedHostFile>;
    return typeof held.uri === 'string' && typeof held.directory === 'boolean' ? { uri: held.uri, directory: held.directory } : null;
  } catch {
    return null;
  }
}
