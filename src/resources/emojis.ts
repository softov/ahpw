/** Asks for the text (monochrome) form of the character before it. */
const VS_TEXT = '\u{FE0E}';
/** Asks for the emoji (colour) form of the character before it. */
const VS_EMOJI = '\u{FE0F}';

/** Characters that take a text form: pictographs and the older symbol blocks (⏰, ⚙, ★, ...). */
const TEXT_VARIANT_TARGET =
  /[\p{Extended_Pictographic}↔-↪⌚-⌛⏩-⏳①-⓿■-◿☀-➿⬀-⯿]/u;

/** The text in monochrome: every character that has a text form asks for it. */
export function toMonochromeEmoji(input: string): string {
  const chars = Array.from(input);
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i] ?? '';
    if (ch === VS_EMOJI) {
      out += VS_TEXT;
      continue;
    }
    out += ch;
    if (ch === VS_TEXT) continue;
    const next = chars[i + 1];
    if (TEXT_VARIANT_TARGET.test(ch) && next !== VS_TEXT && next !== VS_EMOJI) out += VS_TEXT;
  }
  return out;
}

const mono = (emoji: string): string => `${emoji}${VS_TEXT}`;

/** Every glyph the page draws as an icon, in its monochrome form where it has one. */
export const EMOJIcon = {
  // pages: the activity bar and their tabs
  sessions: mono('💬'),
  automations: mono('⏰'),
  agents: mono('🤖'),
  host: mono('🖥'),
  computers: mono('💻'),
  bots: mono('👾'),
  users: mono('👤'),
  roles: mono('🛡'),
  teams: mono('👥'),
  members: mono('👥'),
  signIn: mono('🔑'),
  keys: mono('🔐'),
  usage: mono('📊'),
  policies: mono('⚖'),
  settings: mono('⚙'),
  file: mono('📄'),
  markdown: mono('📝'),
  image: mono('🖼'),
  video: mono('🎞'),
  audio: mono('🎵'),
  code: '‹›',
  data: '{}',
  archive: mono('📦'),
  diff: 'Δ',
  log: '☰',
  terminal: '❯',

  // actions
  reload: '↻',
  apply: '⤓',
  run: mono('▶'),
  pause: mono('⏸'),
  stop: mono('⏹'),
  send: '↑',
  trash: mono('🗑'),
  clear: '⊘',
  close: '✕',
  copy: '⧉',
  copyText: '¶',
  more: '⋯',
  callsHidden: '⊘',
  archived: '▤',
  group: '☷',
  sort: '⇅',
  period: '◷',
  filter: '▽',
  records: mono('🧾'),
  pin: mono('📌'),
  folder: mono('📁'),
  tree: '⊢',
  commit: '⊙',
  pullRequest: '⎇',
  attach: mono('📎'),
  open: mono('📂'),
  upload: mono('⬆'),
  download: mono('⬇'),
  link: mono('🔗'),
  back: '←',
  forward: '→',
  share: '⤴',
  external: '↗',

  // status and feedback
  check: '✓',
  cross: '✕',
  error: mono('✖'),
  warning: mono('⚠'),
  info: mono('ℹ'),
  pending: '◌',
  running: '●',
  waiting: '◐',

  // disclosure carets
  caretRight: '▸',
  caretDown: '▾',

  // composer pills, in a narrow box
  approvals: mono('⛨'),
  model: '✦',

  // what a tool call does
  read: '≡',
  search: '⌕',
  edit: '✎',
  subagent: '◈',
  canvas: '▣',
  web: '⊕',
  dot: '•',
  thinking: '∴',

  // layout toggles in the title bar
  panelLeft: mono('◧'),
  panelBottom: mono('⬓'),
  panelRight: mono('◨'),

  // main area layouts
  layoutTabs: '▭',
  layoutGroups: '⊞',
  layoutSplit: '⊟',
  layoutSpatial: '◇',
  layoutStack: '☰',
  layoutSingle: '□',

  // the Manage menu
  language: mono('🌐'),
  theme: mono('🎨'),
  signOut: '⇥',

  // what an agent is customized with
  plugin: mono('🧩'),
  /** The host's own plugins, which 🧩 is not: that is an agent's. */
  hostPlugins: mono('🔣'),
  mcpServer: mono('🔌'),
  /** The host's connectors; the same plug an agent's MCP server shows. */
  connectors: mono('🔌'),
  receive: mono('📥'),
  action: mono('⚡'),
  interface: mono('🪟'),

  // a usage record: what wrote it, and its tokens
  proxy: '⇄',
  tokensIn: '↑',
  tokensOut: '↓',
  cacheRead: '⟲',
  cacheWrite: '⟳',
};
