import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type DefaultTheme } from 'vitepress';

/** The `docs/` folder, which is the site's source. */
const DOCS = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The repository root. */
const ROOT = resolve(DOCS, '..');

/** Where the repository is shown. */
const GITHUB = 'https://github.com/softov/ahpw';

const { description } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { description: string };

/** One sidebar entry: the text it shows and the page it opens. */
const page = (text: string, link: string): DefaultTheme.SidebarItem => ({ text, link });

/** The sidebar: one group per folder, each in the order `docs/README.md` lists it. */
const sidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Start',
    items: [
      page('Get started', '/start/GET-STARTED'),
      page('Serve', '/start/SERVE'),
      page('Sign in', '/start/SIGN-IN'),
    ],
  },
  {
    text: 'Use',
    items: [
      page('Window', '/use/WINDOW'),
      page('Command palette', '/use/PALETTE'),
      page('Interface', '/use/INTERFACE'),
    ],
  },
  {
    text: 'Subjects',
    items: [
      page('Sessions', '/subjects/SESSIONS'),
      page('Changes', '/subjects/CHANGES'),
      page('Folders', '/subjects/FOLDERS'),
      page('Files', '/subjects/FILES'),
      page('Terminals and log', '/subjects/TERMINALS'),
      page('Automations', '/subjects/AUTOMATIONS'),
      page('Agents', '/subjects/AGENTS'),
      page('Bots', '/subjects/BOTS'),
      page('Computers', '/subjects/COMPUTERS'),
      page('Plugins', '/subjects/PLUGINS'),
      page('Connectors', '/subjects/CONNECTORS'),
      page('Users and roles', '/subjects/USERS'),
      page('Teams and projects', '/subjects/TEAMS'),
      page('Profile and keys', '/subjects/PROFILE'),
      page('Usage', '/subjects/USAGE'),
      page('Policies', '/subjects/POLICIES'),
      page('Host', '/subjects/HOST'),
    ],
  },
  {
    text: 'Reference',
    items: [
      page('CLI', '/reference/CLI'),
      page('Config file', '/reference/CONFIG-FILE'),
      page('Environment', '/reference/ENVIRONMENT'),
      page('Embedding', '/reference/EMBED'),
    ],
  },
];

/** Every page under `docs/`, as a site path such as `/use/SCREEN`. */
const pages = (dir: string): string[] => readdirSync(dir).flatMap((entry) => {
  if (entry.startsWith('.') || entry === 'node_modules' || entry === 'public' || entry === 'media') return [];
  const path = join(dir, entry);
  if (statSync(path).isDirectory()) return pages(path);
  if (!entry.endsWith('.md')) return [];
  return ['/' + relative(DOCS, path).split(sep).join('/').replace(/\.md$/, '')];
});

/** The pages that are not in the sidebar: the home page and the index of all documents. */
const UNLISTED = new Set(['/index', '/README']);

const listed = new Set(sidebar.flatMap((group) => group.items ?? []).map((item) => item.link));
const missing = pages(DOCS).filter((path) => !UNLISTED.has(path) && !listed.has(path));
if (missing.length > 0) {
  throw new Error(`docs/.vitepress/config.mts: not in the sidebar: ${missing.map((path) => `docs${path}.md`).join(', ')}`);
}

/**
 * A link that leaves `docs/` as the site serves it: the file on GitHub.
 *
 * A page that links to `src/` or to the repository's README links to files that
 * are not pages of the site.
 */
const rewrite = (href: string, page: string): string => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#') || href.startsWith('/')) return href;
  const hash = href.indexOf('#');
  const path = hash === -1 ? href : href.slice(0, hash);
  const anchor = hash === -1 ? '' : href.slice(hash);
  const target = resolve(dirname(page), decodeURI(path));
  const inside = relative(DOCS, target);
  if (!inside.startsWith('..')) return href;
  const kind = statSync(target, { throwIfNoEntry: false })?.isDirectory() ? 'tree' : 'blob';
  return `${GITHUB}/${kind}/main/${encodeURI(relative(ROOT, target).split(sep).join('/'))}${anchor}`;
};

export default defineConfig({
  title: 'ahpw',
  description,
  base: process.env.DOCS_BASE ?? '/ahpw/',
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'dark',

  markdown: {
    config(md) {
      // Inline code is shown as written, so a `{{name}}` in it is text and not a Vue expression.
      const code = md.renderer.rules.code_inline!;
      md.renderer.rules.code_inline = (tokens, index, options, env, self) => {
        tokens[index]!.attrSet('v-pre', '');
        return code(tokens, index, options, env, self);
      };

      md.core.ruler.push('ahpw-relative-links', (state) => {
        const page: string | undefined = state.env?.path;
        if (page === undefined) return;
        for (const token of state.tokens) {
          for (const child of token.children ?? []) {
            if (child.type !== 'link_open') continue;
            const href = child.attrGet('href');
            if (href) child.attrSet('href', rewrite(href, page));
          }
        }
      });
    },
  },

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'All documents', link: '/README' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@ahpd/web' },
      { text: 'GitHub', link: GITHUB },
    ],
    sidebar,
    search: { provider: 'local' },
    editLink: {
      pattern: `${GITHUB}/edit/main/docs/:path`,
      text: 'Edit this page on GitHub',
    },
  },
});
