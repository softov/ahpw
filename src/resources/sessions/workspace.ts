import { createContext, useContext } from 'react';

/** The folder of the session a transcript belongs to, which relative file links resolve against. */
export const WorkspaceContext = createContext<string | null>(null);

/** The host of the session a transcript belongs to; null outside a session page. */
export const SessionHostContext = createContext<string | null>(null);

/** The host of the session page this component is drawn in. */
export function useSessionHost(): string {
  const host = useContext(SessionHostContext);
  if (host === null) throw new Error('A transcript part is drawn outside a session page.');
  return host;
}
