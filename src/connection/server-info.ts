/**
 * The host software's name and version, from the `serverInfo` its `initialize`
 * answer carries. The SDK's host runtime reads that answer and keeps only the
 * protocol version, so the transport reads it on the way in.
 */

import type { AhpTransport } from '@microsoft/agent-host-protocol/client';

/** The software behind the host, as `serverInfo` names it. */
export interface ServerInfo {
  name: string;
  version: string | null;
}

/** The `serverInfo` a frame's result carries, or null for any other frame. */
export function serverInfoOf(message: unknown): ServerInfo | null {
  const body = record(typeof message === 'string' ? parsed(message) : message);
  const info = record(record(body?.result)?.serverInfo);
  if (info === null || typeof info.name !== 'string' || info.name === '') return null;
  return { name: info.name, version: typeof info.version === 'string' && info.version !== '' ? info.version : null };
}

/** How the status bar names the host: its software and version. */
export const serverLabel = (info: ServerInfo): string => (info.version === null ? info.name : `${info.name} ${info.version}`);

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parsed(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** The same transport, telling `onInfo` the `serverInfo` of each answer that carries one. */
export function readingServerInfo(inner: AhpTransport, onInfo: (info: ServerInfo) => void): AhpTransport {
  return {
    send: (message) => inner.send(message),
    close: () => inner.close(),
    async recv() {
      const frame = await inner.recv();
      const info = frame?.kind === 'text' ? serverInfoOf(frame.text) : frame?.kind === 'parsed' ? serverInfoOf(frame.message) : null;
      if (info !== null) onInfo(info);
      return frame;
    },
  };
}
