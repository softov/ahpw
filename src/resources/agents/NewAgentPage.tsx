import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Text } from '@softov/scena/ui';
import { EMOJIcon } from '../emojis.js';
import { AgentForm } from './AgentForm.js';

/** The page a new agent is made on: one form, its kind picked first. */
export default function NewAgentPage({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  return (
    <div className="web-page web-form">
      <Text variant="h2" text={`${EMOJIcon.agents} ${t('agents/form/newTitle')}`} />
      <AgentForm host={host} />
    </div>
  );
}
