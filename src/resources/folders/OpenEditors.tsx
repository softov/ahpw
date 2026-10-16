import type { ReactElement } from 'react';
import { useI18n, useLabel, useLayout, useMounts, useScena } from '@softov/scena/react';
import { Tree, type TreeNode } from '@softov/scena/ui';
import type { Label, ResolvedMount } from '@softov/scena/types';

/** A tab's title, kept current: a session renamed elsewhere is renamed here. */
function TabTitle({ mount }: { mount: ResolvedMount }): ReactElement {
  const scena = useScena();
  const title = useLabel((mount.props?.title ?? scena.components.get(mount.component.component)?.props?.title) as Label | undefined);
  return <span title={title}>{title || mount.key}</span>;
}

/**
 * The explorer's first pane: the pages open in the main area. A click shows
 * one, its x closes it the way the tab's own x does, asking first when it
 * holds unsaved work.
 */
export default function OpenEditors(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const mounts = useMounts('main');
  const active = useLayout().surfaces.main?.activeContainerKey ?? null;
  const nodes = mounts.map((mount): TreeNode<ResolvedMount> => {
    const icon = mount.props?.icon ?? scena.components.get(mount.component.component)?.props?.icon;
    return {
      key: mount.key,
      label: <TabTitle mount={mount} />,
      ...(icon === undefined ? {} : { icon }),
      data: mount,
      trailing: (
        <button
          type="button"
          className="web-open-editors__close"
          title={t('folders/openEditors/close')}
          aria-label={t('folders/openEditors/close')}
          onClick={(event) => {
            event.stopPropagation();
            scena.surfaces.requestClose(mount.key);
          }}
        >
          {'✕'}
        </button>
      ),
    };
  });
  return (
    <Tree<ResolvedMount>
      nodes={nodes}
      selectedKey={active}
      onSelect={(node) => scena.surfaces.focus(node.key)}
      emptyState={<p className="web-note web-explorer__empty">{t('folders/openEditors/empty')}</p>}
    />
  );
}
