import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import { ExplorerList, type Row } from '../../shell/explorer/ExplorerList.js';
import { ACTIVE_ITEM, runPath, type Run } from '../manifest/data.js';
import { createOf, itemActionsOf, keyOf, removalAction, rowLine, rowsOf, rowTitle, type ItemAction } from '../manifest/roles.js';
import type { ManifestCommand, ProgramManifest } from '../manifest/types.js';
import { EMOJIcon } from '../emojis.js';

/** Runs an item action from where it was chosen, and says why it failed, if it did. */
export async function runItemAction(scena: ReturnType<typeof useScena>, action: ItemAction): Promise<string | null> {
  const worked = await scena.commands.execute('ahpd.run', { id: action.command.id, values: action.values });
  const ran = scena.store.get<Run>(runPath(action.command.id));
  return worked !== true && ran?.state === 'failed' ? `${action.command.summary}: ${ran.message}` : null;
}

/**
 * A group that lists a kind of thing: its items, searchable, each opening its
 * own page, with what can be done to it on a right-click. The group's
 * commands stay one menu away.
 */
export default function ItemExplorer({ manifest, title, list, commands }: {
  manifest: ProgramManifest;
  title: string;
  list: ManifestCommand;
  commands: readonly ManifestCommand[];
}): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const run = useStore<Run>(runPath(list.id));
  const active = useStore<string>(ACTIVE_ITEM);
  const [failure, setFailure] = useState<string | null>(null);
  const kind = list.resource?.kind ?? '';
  const key = keyOf(manifest, kind);
  const create = createOf(manifest, kind);

  const reload = (): void => void scena.commands.execute('ahpd.run', { id: list.id, values: {} });

  // A new listing, from here or the header's Reload, clears the last item action's failure.
  useEffect(() => {
    if (run?.state === 'running') setFailure(null);
  }, [run?.state]);

  // Listed the first time the group is shown.
  useEffect(() => {
    if (run === undefined) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.id]);

  const open = (command: ManifestCommand, values?: Record<string, unknown>): void => {
    void scena.commands.execute('ahpd.open', { id: command.id, ...(values === undefined ? {} : { values }) });
  };

  const rows = useMemo<Row[]>(() => {
    const items = run?.state === 'done' ? rowsOf(run.data) ?? [] : [];
    return items.map((item) => {
      const name = rowTitle(item, key);
      const line = rowLine(item, key);
      const menu: PickerAction[] = itemActionsOf(manifest, kind, item).map((action) => {
        const go = (): void => {
          if (!action.direct) return open(action.command, action.values);
          void runItemAction(scena, action).then(setFailure);
        };
        if (action.command.effect !== 'remove' || !action.direct) {
          return { title: action.command.summary, onSelect: (host) => { host.closeMenu(); go(); } };
        }
        // A removal asks in a submenu, naming the item.
        return {
          title: action.command.summary,
          color: 'red',
          onSelect: (host) => host.pushList({
            items: [{ title: removalAction(action.command, action.values), color: 'red', onSelect: (inner) => { inner.closeMenu(); go(); } }],
          }),
        };
      });
      return {
        key: `${kind}:${name}`,
        dot: 'quiet',
        dotLabel: kind,
        title: name,
        lines: line === '' ? [] : [line],
        menu,
      } satisfies Row;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, manifest, kind, key, t]);

  const openItem = (rowKey: string): void => {
    const items = run?.state === 'done' ? rowsOf(run.data) ?? [] : [];
    const item = items.find((one) => `${kind}:${rowTitle(one, key)}` === rowKey);
    if (item !== undefined) void scena.commands.execute('ahpd.openItem', { list: list.id, kind, title: rowTitle(item, key) });
  };

  const notice = failure !== null ? <Alert tone="danger" message={failure} />
    : run === undefined || (run.state === 'running' && rows.length === 0) ? <Spinner label={t('commands/readingList')} />
    : run.state === 'failed' ? <Alert tone="danger" message={run.message} />
    : run.state === 'done' && rowsOf(run.data) === undefined ? <p className="web-note web-explorer__empty">{t('commands/items/badShape')}</p>
    : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('commands/items/empty')}</p>
    : null;

  return (
    <ExplorerList
      label={title}
      rows={rows}
      selected={active ?? null}
      onOpen={openItem}
      notice={notice}
      filterLabel={t('commands/items/search', { title: title.toLowerCase() })}
    />
  );
}
