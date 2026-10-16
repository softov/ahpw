import type { BindingPath } from '@softov/scena/types';

/** The automation open in `main`, as `{ host, resource }`. */
export const ACTIVE_AUTOMATION = '$/ahp/activeAutomation' as BindingPath;

/** The list's grouping, order and status filter; a header button is pressed while its choice is not the usual one. */
export const AUTOMATIONS_GROUP = '$/ahp/automations/group' as BindingPath;
export const AUTOMATIONS_SORT = '$/ahp/automations/sort' as BindingPath;
export const AUTOMATIONS_FILTER = '$/ahp/automations/filter' as BindingPath;
