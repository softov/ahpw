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
  settings: mono('⚙'),
  file: mono('📄'),
  markdown: mono('📝'),
  diff: 'Δ',
  log: '☰',
  terminal: '❯',

  // actions
  reload: '↻',
  run: mono('▶'),
  pause: mono('⏸'),
  trash: mono('🗑'),
  clear: '⊘',
  close: '✕',
  copy: '⧉',
  more: '⋯',
  archived: '▤',
  group: '☷',
  folder: mono('📁'),
  attach: mono('📎'),

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

  // what a tool call does
  read: '≡',
  search: '⌕',
  edit: '✎',
  subagent: '◈',
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
};
