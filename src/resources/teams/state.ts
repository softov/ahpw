import type { BindingPath } from '@softov/scena/types';

/** Whether any host this page connects to lists its teams; the activity bar entry shows while one does. */
export const TEAMS_SERVED = '$/ahp/teams/served' as BindingPath;

/** The team or project open in `main`, as `{ host, domain, id }`. */
export const ACTIVE_TEAM = '$/ahp/teams/active' as BindingPath;

/** A team's or project's tab key: one tab each, and one for a new one. */
export const teamTab = (kind: 'teams' | 'projects', host: string, id: string | undefined): string => (id === undefined ? `${kind}:new` : `${kind}:${host}:${id}`);
