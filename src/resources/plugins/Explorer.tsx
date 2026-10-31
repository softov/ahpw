import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Spinner } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import { ahpPaths, ROOT } from '../../bridges/data.js';
import { rootReducer, type RootState } from '@microsoft/agent-host-protocol';
import { useChannelOnEach } from '../../bridges/channel.js';
import { refKey, refOf, useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import type { PeopleState } from '../../bridges/people.js';
import { PLUGINS, pluginsReducer, restartNeeded, specEnabled, type PluginRow } from '../../bridges/plugins.js';
import { useServingHosts } from '../../bridges/served.js';
import { mayRestart } from '../../bridges/restart.js';
import { RESTART_HOST } from '../host/restart.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList } from '../../shell/explorer/ExplorerList.js';
import { mayReload, mayToggle, reloadOne, saidOf, toggleMethod, togglePlugin } from './actions.js';
import { entryKeyOf, KNOWN_CATEGORIES, NO_CATEGORY, pluginRows, type PluginEntry, type PluginGrouping } from './rows.js';
import { ACTIVE_PLUGIN, PLUGINS_GROUP } from './state.js';

/** A menu entry's tooltip, when the host says what its command does. */
const tooltip = (said: string | undefined): { tooltip?: string } => (said === undefined ? {} : { tooltip: said });

/** A category in the reader's words: ahpd's own are translated, any other is shown as the plugin wrote it. */
export function categoryWord(t: (key: string) => string, category: string): string {
  if (category === NO_CATEGORY) return t('plugins/categories/other');
  return (KNOWN_CATEGORIES as readonly string[]).includes(category) ? t(`plugins/categories/${category}`) : category;
}

/** The sidebar: the plugins each shown host has configured, by state or by category. */
export default function PluginsExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const shown = useShownHosts();
  const hosts = useServingHosts(shown, PLUGINS.scheme);
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const { states, errors } = useChannelOnEach<PeopleState<PluginRow>>(hosts, PLUGINS.channel, pluginsReducer);
  const offers = useEach<Offers>(hosts.map((host) => ahpPaths(host).offers));
  const roots = useChannelOnEach<RootState>(hosts, ROOT, rootReducer);
  const active = useStore<{ host: string; id: string }>(ACTIVE_PLUGIN);
  const grouping = useStore<PluginGrouping | null>(PLUGINS_GROUP) ?? 'state';
  const open = (key: string): void => {
    const { host, id } = refOf(entryKeyOf(key));
    void scena.commands.execute('ahp.openPlugin', { host, id });
  };

  const rows = useMemo(() => {
    const entries: PluginEntry[] = hosts.flatMap((host, at) => (states[at]?.records ?? []).map(({ id, record }) => ({ host, hostName: hostName(host), id, row: record })));
    const menu = ({ host, id, row }: PluginEntry): PickerAction[] => {
      const held = offers[hosts.indexOf(host)] ?? NO_OFFERS;
      return [
        { title: t('plugins/actions/open'), onSelect: (picker) => { picker.closeMenu(); open(refKey(host, id)); } },
        ...(mayToggle(held, row) ? [{
          title: t(specEnabled(row.spec) ? 'plugins/actions/disable' : 'plugins/actions/enable'),
          group: 'more',
          onSelect: (picker: { closeMenu: () => void }) => { picker.closeMenu(); void togglePlugin(host, id, row); },
          ...tooltip(saidOf(held, toggleMethod(row))),
        }] : []),
        ...(mayReload(held) ? [{
          title: t('plugins/actions/reimport'),
          group: 'more',
          onSelect: (picker: { closeMenu: () => void }) => { picker.closeMenu(); void reloadOne(host, id); },
          ...tooltip(saidOf(held, PLUGINS.reload)),
        }] : []),
      ];
    };
    return pluginRows(entries, grouping, {
      multi,
      state: (state) => t(`plugins/states/${state}`),
      loadFailed: t('plugins/page/loadFailed'),
      failing: t('plugins/page/failing'),
      category: (category) => categoryWord(t, category),
      menu,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hosts, states, offers, hostName, grouping, t]);

  // One host's notice in mono; in multi a host that is down says so in its own place.
  const error = multi ? null : errors[0] ?? null;
  const state = multi ? states.find((one) => one !== undefined) : states[0];
  // The hosts that hold a change only a restart applies, and offer that restart.
  const restartable = hosts.filter((host, at) => restartNeeded(roots.states[at]) && mayRestart(offers[at] ?? NO_OFFERS));
  const restart = restartable.length === 0 ? null : (
    <Button size="sm" label={t('host/restart/button')} onClick={() => { for (const host of restartable) void scena.commands.execute(RESTART_HOST, { host }); }} />
  );
  const notice = hosts.length === 0
    ? <p className="web-note web-explorer__empty">{t('plugins/explorer/notServed')}</p>
    : error !== null
      ? <Alert tone="danger" title={t('plugins/notices/none')} message={error} />
      : state === undefined
        ? <Spinner label={t('plugins/notices/reading')} />
        : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('plugins/explorer/empty')}</p>
          : roots.states.some(restartNeeded) ? <p className="web-note web-explorer__empty web-plugins__restart">{t('plugins/restartShort')} {restart}</p> : null;
  const selected = active === undefined ? null : rows.find((row) => entryKeyOf(row.key) === refKey(active.host, active.id))?.key ?? null;

  return (
    <ExplorerList
      label={t('plugins/explorer/title')}
      rows={rows}
      selected={selected}
      onOpen={open}
      notice={notice}
      filterLabel={t('plugins/explorer/filter')}
      hostLines={multi}
    />
  );
}
