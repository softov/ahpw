import { translate } from '@softov/scena';
import type { ComponentDefinition, PickerAction, Scena } from '@softov/scena/types';

/** The resource kind every file viewer opens. */
export const FILE_KIND = 'ahp-file';

/** The viewer every file has: the text, with line numbers. */
export const TEXT_VIEWER = 'FilePage';

/** The viewer that draws Markdown. */
export const MARKDOWN_VIEWER = 'MarkdownPage';

/** A file tab's key: the host, the viewer and the file. */
export const fileTabKey = (component: string, host: string, uri: string): string => `file:${host}:${component}:${uri}`;

/** The host, the viewer and the file of a file tab's key; undefined for any other tab. */
export function fileTabOf(key: string | undefined): { host: string; component: string; uri: string } | undefined {
  const match = key === undefined ? null : /^file:([^:]+):([^:]+):(.+)$/.exec(key);
  return match === null ? undefined : { host: match[1]!, component: match[2]!, uri: match[3]! };
}

/** A file's extension, lower case, without the dot; '' when it has none. */
export function extOf(uri: string): string {
  const name = uri.replace(/[?#].*$/, '').split('/').pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase();
}

/** The viewers that can show this file, the default first. */
export function viewersOf(scena: Scena, uri: string): ComponentDefinition[] {
  const context = { '$/resource/ext': extOf(uri) };
  return scena.components.findOpeners(FILE_KIND).filter((viewer) => {
    const selector = viewer.opens?.selector;
    return selector === undefined || scena.when.evaluate(selector, context);
  });
}

/** A viewer's name, as the "Open as" row says it: its title, a message's when it names one. */
export function viewerTitle(viewer: ComponentDefinition): string {
  const title = viewer.opens?.title;
  if (typeof title === 'string') return title;
  if (title !== undefined && 't' in title) return translate(title.t);
  return viewer.component;
}

/** One "Open as" row for each viewer of the host's file other than `current`. */
export function openAsItems(scena: Scena, host: string, uri: string, current: string | null): PickerAction[] {
  return viewersOf(scena, uri)
    .filter((viewer) => viewer.component !== current)
    .map((viewer) => ({
      title: translate('files/openAs', { viewer: viewerTitle(viewer) }),
      group: translate('files/openWith'),
      ...(viewer.opens?.icon === undefined ? {} : { icon: viewer.opens.icon }),
      onSelect: (menu) => {
        menu.closeMenu();
        void scena.commands.execute('ahp.openFile', { host, uri, viewer: viewer.component });
      },
    }));
}
