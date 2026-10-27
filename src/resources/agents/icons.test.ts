import { describe, expect, it } from 'vitest';
import type { AgentRow, EngineRow } from '../../bridges/agents.js';
import { agentIcons } from './icons.js';

const record = (fields: Partial<AgentRow> = {}): AgentRow => ({ id: 'codex', engine: 'acp', owner: 'host', name: 'Codex', config: {}, state: 'ready', ...fields });
const engines = [{ id: 'acp', record: { name: 'acp', title: 'ACP', icons: [{ src: 'data:acp' }] } as EngineRow }];

describe('agentIcons', () => {
  it('draws the row\'s icons, light and dark, before the record\'s own icon', () => {
    const icons = [{ src: 'data:light' }, { src: 'data:dark', theme: 'dark' as const }];
    expect(agentIcons(record({ icons, icon: { src: 'data:own' } }), engines)).toEqual(icons);
  });

  it('draws the record\'s own icon when the row has no icons', () => {
    expect(agentIcons(record({ icons: [], icon: { src: 'data:own' } }), engines)).toEqual([{ src: 'data:own' }]);
  });

  it('draws the engine\'s icons when the record has none', () => {
    expect(agentIcons(record(), engines)).toEqual([{ src: 'data:acp' }]);
  });
});
