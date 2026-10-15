import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ACTIVE_AUTOMATION } from './state.js';
import { titleOf } from './words.js';
import { AUTOMATIONS, channelPath } from '../../bridges/data.js';
import type { AutomationState } from '@microsoft/agent-host-protocol';
import { EMOJIcon } from '../emojis.js';
import { bound, english } from '../../i18n/locales.js';

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
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
    }),
    scena.components.register({
      component: 'AutomationPage',
      category: 'page',
      props: { icon: EMOJIcon.automations },
      renderer: { kind: 'react', load: () => import('./Page.js') },
    }),
    scena.components.register({
      component: 'AutomationEditPage',
      category: 'page',
      props: { icon: EMOJIcon.automations },
      renderer: { kind: 'react', load: () => import('./Edit.js') },
    }),
    scena.commands.register({
      id: 'ahp.newAutomation',
      title: () => translate('automations/commands/new'),
      keywords: [english('automations/commands/new')],
      category: 'Automations',
      slots: [PALETTE_SLOT],
      run: (ctx) => {
        ctx.surfaces.open({ surface: 'main', key: 'automation:new', resource: { component: 'AutomationEditPage' }, props: { title: bound('automations/commands/new') } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({
      id: 'ahp.showAutomations',
      title: () => translate('automations/commands/show'),
      keywords: [english('automations/commands/show')],
      category: 'Automations',
      slots: [PALETTE_SLOT],
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: AUTOMATIONS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.editAutomation',
      title: () => translate('automations/commands/edit'),
      run: (ctx, args) => {
        const resource = (args as { resource?: string } | undefined)?.resource;
        if (resource === undefined) return;
        const entry = ctx.store.get<AutomationState>(channelPath(AUTOMATIONS))?.entries.find((one) => one.resource === resource);
        ctx.surfaces.open({
          surface: 'main',
          key: `automation:edit:${resource}`,
          resource: { component: 'AutomationEditPage', resource },
          props: { title: entry === undefined ? bound('automations/commands/edit') : translate('automations/editTitle', { title: titleOf(entry) }) },
        });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({
      id: 'ahp.openAutomation',
      title: () => translate('automations/commands/open'),
      run: (ctx, args) => {
        const resource = (args as { resource?: string } | undefined)?.resource;
        if (resource === undefined) return;
        ctx.store.set(ACTIVE_AUTOMATION, resource);
        const entry = ctx.store.get<AutomationState>(channelPath(AUTOMATIONS))?.entries.find((one) => one.resource === resource);
        ctx.surfaces.open({
          surface: 'main',
          key: `automation:${resource}`,
          resource: { component: 'AutomationPage', resource },
          props: { title: entry === undefined ? bound('automations/automation') : titleOf(entry) },
        });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'automations:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${AUTOMATIONS_SECTION}"`,
      resource: { component: 'AutomationExplorer' },
    }),
  );
}
