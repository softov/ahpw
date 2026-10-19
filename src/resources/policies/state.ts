import type { BindingPath } from '@softov/scena/types';

/** Whether any host this page connects to lists its policies; the activity bar entry shows while one does. */
export const POLICIES_SERVED = '$/ahp/policies/served' as BindingPath;

/** The policy open in `main`, as `{ host, id }`. */
export const ACTIVE_POLICY = '$/ahp/policies/active' as BindingPath;

/** How the list groups its rows; null while it is the usual one, by kind. */
export const POLICIES_GROUP = '$/ahp/policies/group' as BindingPath;

export const GROUP_KEY = 'ahpd-web.policies-group';

/** A policy's tab key: one tab each, and one for a new one. */
export const policyTab = (host: string, id: string | undefined): string => (id === undefined ? 'policies:new' : `policies:${host}:${id}`);
