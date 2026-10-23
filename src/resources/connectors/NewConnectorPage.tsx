import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Text } from '@softov/scena/ui';
import { EMOJIcon } from '../emojis.js';
import { ConnectorForm } from './ConnectorForm.js';

/** The page a new connector is made on: one form, its adapter picked first. */
export default function NewConnectorPage({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  return (
    <div className="web-page web-form">
      <Text variant="h2" text={`${EMOJIcon.connectors} ${t('connectors/form/newTitle')}`} />
      <ConnectorForm host={host} />
    </div>
  );
}
