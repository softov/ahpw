import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, type ModusClass } from '@softov/scena';
import { hideOverlaidSidebar } from '../sessions/index.js';
import AutomationExplorer from './Explorer.js';
import AutomationPage from './Page.js';
import { ACTIVE_AUTOMATION } from './state.js';
import { titleOf } from './words.js';
import { AUTOMATIONS, channelPath } from '../connection/data.js';
import type { AutomationState } from '@microsoft/agent-host-protocol';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the automations list shows in. */
export const AUTOMATIONS_SECTION = 'ahp:automations';

/** The automations list and an automation's page. */
export function registerAutomations(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'AutomationExplorer',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: AutomationExplorer as unknown }) },
    }),
    scena.components.register({
      component: 'AutomationPage',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: AutomationPage as unknown }) },
    }),
    scena.commands.register({
      id: 'ahp.openAutomation',
      title: 'Open automation',
      run: (ctx, args) => {
        const resource = (args as { resource?: string } | undefined)?.resource;
        if (resource === undefined) return;
        ctx.store.set(ACTIVE_AUTOMATION, resource);
        const entry = ctx.store.get<AutomationState>(channelPath(AUTOMATIONS))?.entries.find((one) => one.resource === resource);
        ctx.surfaces.open({
          surface: 'main',
          key: `automation:${resource}`,
          resource: { component: 'AutomationPage', resource },
          props: { title: entry === undefined ? 'Automation' : titleOf(entry) },
        });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'automations:nav',
      resource: { component: 'ActivityBarItem', icon: '\u{23F1}\u{FE0F}', label: 'Automations', section: AUTOMATIONS_SECTION },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'automations:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${AUTOMATIONS_SECTION}"`,
      resource: { component: 'AutomationExplorer' },
    }),
  );
}
