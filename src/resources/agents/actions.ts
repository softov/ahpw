import { translate } from '@softov/scena';
import { removeAgent, type AgentRow } from '../../bridges/agents.js';
import { confirm, failed } from '../../shell/notify/index.js';

/** Removes an agent's record once a person has said yes; answers whether it went. */
export async function deleteAgent(host: string, row: AgentRow): Promise<boolean> {
  const name = row.name || row.id;
  if (!(await confirm({
    title: translate('agents/actions/removeTitle', { name }),
    body: translate('agents/actions/removeBody'),
    confirmLabel: translate('agents/actions/remove'),
    tone: 'danger',
  }))) return false;
  try {
    await removeAgent(host, row.id);
    return true;
  } catch (error) {
    failed(translate('agents/actions/removeFailed', { name }), error);
    return false;
  }
}
