import type { BindingPath } from '@softov/scena/types';
import { POLICIES } from '../../bridges/policies.js';

/** Whether any host this page connects to lists its policies; the activity bar entry shows while one does. */
export const POLICIES_SERVED = '$/ahp/policies/served' as BindingPath;

/** Whether any host this page connects to takes policy writes; the New command shows while one does. */
export const POLICIES_WRITABLE = '$/ahp/policies/writable' as BindingPath;

/** The policy open in `main`, as `{ host, id }`. */
export const ACTIVE_POLICY = '$/ahp/policies/active' as BindingPath;

/** Bumped by reload, so the open page reads its figures again. */
export const POLICIES_ASKED = '$/ahp/policies/asked' as BindingPath;

/** A policy's tab key: one tab each, and one new one for each host. */
export const policyTab = (host: string, id: string | undefined): string => `${POLICIES.scheme}:${host}:${id ?? 'new'}`;
