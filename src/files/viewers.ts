import type { ComponentDefinition, PickerAction, Scena } from '@softov/scena/types';

/** The resource kind every file viewer opens. */
export const FILE_KIND = 'ahp-file';

/** The viewer every file has: the text, with line numbers. */
export const TEXT_VIEWER = 'FilePage';

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

/** A viewer's name, as the "Open as" row says it. */
export const viewerTitle = (viewer: ComponentDefinition): string =>
  typeof viewer.opens?.title === 'string' ? viewer.opens.title : viewer.component;

/** One "Open as" row for each viewer of this file other than `current`. */
export function openAsItems(scena: Scena, uri: string, current: string | null): PickerAction[] {
  return viewersOf(scena, uri)
    .filter((viewer) => viewer.component !== current)
    .map((viewer) => ({
      title: `Open as ${viewerTitle(viewer)}`,
      group: 'Open with',
      ...(viewer.opens?.icon === undefined ? {} : { icon: viewer.opens.icon }),
      onSelect: (host) => {
        host.closeMenu();
        void scena.commands.execute('ahp.openFile', { uri, viewer: viewer.component });
      },
    }));
}
