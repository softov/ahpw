import type { BindingPath } from '@softov/scena/types';

/** Whether any host this page connects to lists connectors to this reader; the 🔌 entry shows while one does. */
export const CONNECTORS_SERVED = '$/ahp/connectors/served' as BindingPath;

/** The connector open in `main`, as `{ host, id }`. */
export const ACTIVE_CONNECTOR = '$/ahp/connectors/active' as BindingPath;

/** How the list groups its rows; null while it is the usual one, by adapter. */
export const CONNECTORS_GROUP = '$/ahp/connectors/group' as BindingPath;

export const GROUP_KEY = 'ahpd-web.connectors-group';

/** A connector's tab key: one tab each. */
export const connectorTab = (host: string, id: string): string => `connectors:${host}:${id}`;

/** The new-connector form's tab key: one for each host. */
export const newConnectorTab = (host: string): string => `connectors:new:${host}`;

/** A connector page's tabs. */
export type ConnectorTabKey = 'overview' | 'models' | 'settings';

/** The tab a connector's page opens on: the one chosen last, kept while the page lives. */
let chosenTab: ConnectorTabKey = 'overview';
export const connectorTabKey = (): ConnectorTabKey => chosenTab;
export function keepConnectorTabKey(key: string): void {
  if (key === 'overview' || key === 'models' || key === 'settings') chosenTab = key;
}
