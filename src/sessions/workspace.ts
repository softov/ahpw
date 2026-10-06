import { createContext } from 'react';

/** The folder of the session a transcript belongs to, which relative file links resolve against. */
export const WorkspaceContext = createContext<string | null>(null);
