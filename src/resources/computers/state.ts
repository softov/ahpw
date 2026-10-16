import type { BindingPath } from '@softov/scena/types';

/** The computer open in `main`, as `{ host, id }`. */
export const ACTIVE_COMPUTER = '$/ahp/activeComputer' as BindingPath;

/** Whether any host this page connects to serves computers; their activity bar entry shows while it does. */
export const COMPUTERS_SERVED = '$/ahp/computers/served' as BindingPath;

/** The list's grouping and state filter; a header button is pressed while its choice is not the usual one. */
export const COMPUTERS_GROUP = '$/ahp/computers/group' as BindingPath;
export const COMPUTERS_FILTER = '$/ahp/computers/filter' as BindingPath;
