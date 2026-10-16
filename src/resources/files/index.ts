import type { ContextSnapshot, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { FILE_KIND, fileTabKey, fileTabOf, MARKDOWN_VIEWER, openAsItems, TEXT_VIEWER, viewersOf } from './viewers.js';
import { EMOJIcon } from '../emojis.js';
import { AUDIO, IMAGES, selectorOf, VIDEOS } from './icons.js';

/** Arguments of `ahp.openFile`. */
export interface OpenFileArgs {
  uri: string;
  line?: number | null;
  end?: number | null;
  /** The viewer to open it in; by default the text when lines are named, else the file's first viewer. */
  viewer?: string;
}

/** Arguments of `ahp.openDiff`: the file, and the content of each side that exists. */
export interface OpenDiffArgs {
  file: string;
  before?: string;
  after?: string;
  /** The changeset the change is in and its id there, so the tab offers the host's operations on it. */
  changeset?: string;
  change?: string;
  /** Whether the changeset takes review marks. */
  review?: boolean;
}

/** The command slot of a tab strip's own buttons. */
const STRIP_SLOT = 'surface/title';

const nameOf = (uri: string): string => decodeURIComponent(uri.replace(/\/+$/, '').split('/').pop() ?? uri);

/** Files and diffs, opened in `main` from links, tool calls and changes. */
export function registerFiles(scena: Scena): Disposable {
  /** The file of the active tab in `main` when it shows in `from` and may also show in `to`. */
  const switchable = (ctx: ContextSnapshot, from: string, to: string): string | undefined => {
    if (ctx['$/surface/name'] !== 'main') return undefined;
    const tab = fileTabOf(ctx['$/tab/key'] as string | undefined);
    if (tab === undefined || tab.component !== from) return undefined;
    return viewersOf(scena, tab.uri).some((viewer) => viewer.component === to) ? tab.uri : undefined;
  };
  /** Replace the active file tab with the same file in `to`. */
  const switchTo = (from: string, to: string): void => {
    const uri = switchable({ '$/surface/name': 'main', '$/tab/key': scena.store.get<string>('$/tab/key') }, from, to);
    if (uri === undefined) return;
    scena.surfaces.close(fileTabKey(from, uri));
    void scena.commands.execute('ahp.openFile', { uri, viewer: to });
  };
  return combineDisposables(
    scena.components.register({
      component: TEXT_VIEWER,
      category: 'page',
      props: { icon: EMOJIcon.file },
      renderer: { kind: 'react', load: () => import('./FilePage.js') },
      opens: { resourceKinds: [FILE_KIND], title: { t: 'files/viewers/text' }, icon: EMOJIcon.file, priority: 10 },
    }),
    scena.components.register({
      component: MARKDOWN_VIEWER,
      category: 'page',
      props: { icon: EMOJIcon.markdown },
      renderer: { kind: 'react', load: () => import('./MarkdownPage.js') },
      opens: { resourceKinds: [FILE_KIND], title: { t: 'files/viewers/markdown' }, icon: EMOJIcon.markdown, priority: 20, selector: '$/resource/ext == "md" || $/resource/ext == "markdown"' },
    }),
    scena.components.register({
      component: 'ImagePage',
      category: 'page',
      props: { icon: EMOJIcon.image },
      renderer: { kind: 'react', load: () => import('./ImagePage.js') },
      opens: { resourceKinds: [FILE_KIND], title: { t: 'files/viewers/image' }, icon: EMOJIcon.image, priority: 20, selector: selectorOf(IMAGES) },
    }),
    scena.components.register({
      component: 'VideoPage',
      category: 'page',
      props: { icon: EMOJIcon.video },
      renderer: { kind: 'react', load: () => import('./VideoPage.js') },
      opens: { resourceKinds: [FILE_KIND], title: { t: 'files/viewers/video' }, icon: EMOJIcon.video, priority: 20, selector: selectorOf(VIDEOS) },
    }),
    scena.components.register({
      component: 'AudioPage',
      category: 'page',
      props: { icon: EMOJIcon.audio },
      renderer: { kind: 'react', load: () => import('./AudioPage.js') },
      opens: { resourceKinds: [FILE_KIND], title: { t: 'files/viewers/audio' }, icon: EMOJIcon.audio, priority: 20, selector: selectorOf(AUDIO) },
    }),
    scena.components.register({
      component: 'DiffPage',
      category: 'page',
      props: { icon: EMOJIcon.diff },
      renderer: { kind: 'react', load: () => import('./DiffPage.js') },
    }),
    scena.commands.register({
      id: 'ahp.openFile',
      title: () => translate('files/commands/openFile'),
      run: (ctx, args) => {
        const target = args as OpenFileArgs | undefined;
        if (target?.uri === undefined) return;
        const viewers = viewersOf(scena, target.uri);
        const named = target.line === undefined || target.line === null ? null : TEXT_VIEWER;
        const viewer = viewers.find((one) => one.component === (target.viewer ?? named)) ?? viewers[0];
        const component = viewer?.component ?? TEXT_VIEWER;
        ctx.surfaces.open({
          surface: 'main',
          key: fileTabKey(component, target.uri),
          resource: { component, uri: target.uri, line: target.line ?? null, end: target.end ?? null },
          props: { title: nameOf(target.uri) },
        });
      },
    }),
    // A Markdown file's tab switches between the text and the drawn page.
    scena.commands.register({
      id: 'ahp.showFileText',
      title: () => translate('files/commands/showText'),
      icon: EMOJIcon.file,
      slots: [STRIP_SLOT],
      when: (ctx) => switchable(ctx, MARKDOWN_VIEWER, TEXT_VIEWER) !== undefined,
      run: () => switchTo(MARKDOWN_VIEWER, TEXT_VIEWER),
    }),
    scena.commands.register({
      id: 'ahp.showFileMarkdown',
      title: () => translate('files/commands/showMarkdown'),
      icon: EMOJIcon.markdown,
      slots: [STRIP_SLOT],
      when: (ctx) => switchable(ctx, TEXT_VIEWER, MARKDOWN_VIEWER) !== undefined,
      run: () => switchTo(TEXT_VIEWER, MARKDOWN_VIEWER),
    }),
    // A file tab's menu offers the file's other viewers.
    scena.mountMenus.register('tab:context', (mount) => {
      const node = mount.component as { component?: unknown; uri?: unknown };
      if (typeof node.uri !== 'string' || typeof node.component !== 'string') return [];
      if (!viewersOf(scena, node.uri).some((viewer) => viewer.component === node.component)) return [];
      return openAsItems(scena, node.uri, node.component);
    }),
    scena.commands.register({
      id: 'ahp.openDiff',
      title: () => translate('files/commands/openDiff'),
      run: (ctx, args) => {
        const target = args as OpenDiffArgs | undefined;
        if (target?.file === undefined) return;
        ctx.surfaces.open({
          surface: 'main',
          key: `diff:${target.file}:${target.after ?? target.before ?? ''}`,
          resource: {
            component: 'DiffPage',
            file: target.file,
            ...(target.before === undefined ? {} : { before: target.before }),
            ...(target.after === undefined ? {} : { after: target.after }),
            ...(target.changeset === undefined ? {} : { changeset: target.changeset, change: target.change ?? null, review: target.review === true }),
          },
          props: { title: nameOf(target.file) },
        });
      },
    }),
  );
}
