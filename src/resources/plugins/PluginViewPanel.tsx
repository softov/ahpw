import { useEffect, useMemo, type ReactElement } from 'react';
import { MountContext, useScena, ViewMount } from '@softov/scena/react';
import type { PluginView } from '../../bridges/plugins.js';
import { callViewMethod } from './actions.js';
import { viewMethods, viewNode } from './view.js';

/**
 * A plugin's view, drawn with scena's components. A Button's click reaches
 * here as a `scena:action:event` of this view's own mount key, and is sent to
 * the host as the method it names, with its context as the params.
 */
export function PluginViewPanel({ host, id, view }: { host: string; id: string; view: PluginView }): ReactElement | null {
  const scena = useScena();
  const key = `plugin-view:${host}:${id}`;
  const node = useMemo(() => viewNode(view, key), [view, key]);
  const methods = useMemo(() => viewMethods(view), [view]);
  useEffect(() => {
    const sub = scena.events.on('scena:action:event', (event) => {
      if (event.mountKey !== key || !methods.has(event.name)) return;
      void callViewMethod(host, id, event.name, event.context ?? {});
    });
    return () => sub.dispose();
  }, [scena, key, methods, host, id]);
  if (node === null) return null;
  return (
    <MountContext.Provider value={key}>
      <div className="web-plugin__view">
        <ViewMount node={node} />
      </div>
    </MountContext.Provider>
  );
}
