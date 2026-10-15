import { StreamLanguage, type StreamParser } from '@codemirror/language';
import type { Extension } from '@codemirror/state';

/** A language the editor highlights. */
export type LanguageKey =
  | 'javascript' | 'jsx' | 'typescript' | 'tsx'
  | 'cpp' | 'java' | 'kotlin' | 'csharp'
  | 'html' | 'php' | 'xml' | 'css' | 'scss' | 'less'
  | 'json' | 'markdown' | 'yaml' | 'toml'
  | 'python' | 'ruby' | 'lua' | 'swift' | 'rust' | 'go' | 'sql'
  | 'shell' | 'dockerfile';

/** Each extension, lower case and without the dot, and the language it is written in. */
const BY_EXTENSION: Readonly<Record<string, LanguageKey>> = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx',
  ts: 'typescript', mts: 'typescript', cts: 'typescript', tsx: 'tsx',
  c: 'cpp', h: 'cpp', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', hh: 'cpp',
  java: 'java', kt: 'kotlin', kts: 'kotlin', cs: 'csharp',
  html: 'html', htm: 'html', xhtml: 'html', php: 'php',
  xml: 'xml', svg: 'xml',
  css: 'css', scss: 'scss', less: 'less',
  json: 'json', jsonc: 'json',
  md: 'markdown', markdown: 'markdown',
  yaml: 'yaml', yml: 'yaml', toml: 'toml',
  py: 'python', rb: 'ruby', lua: 'lua', swift: 'swift', rs: 'rust', go: 'go', sql: 'sql',
  sh: 'shell', bash: 'shell',
  dockerfile: 'dockerfile',
};

/** The language a file is written in, by its name; null for plain text. */
export function languageOf(uri: string): LanguageKey | null {
  const name = (uri.replace(/[?#].*$/, '').split('/').pop() ?? '').toLowerCase();
  if (name === 'dockerfile' || name.startsWith('dockerfile.')) return 'dockerfile';
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return null;
  return BY_EXTENSION[name.slice(dot + 1)] ?? null;
}

/** A legacy mode, as a language. */
const stream = (parser: StreamParser<unknown>): Extension => StreamLanguage.define(parser);

/** Each language's support, loaded the first time a file needs it. */
const LOADERS: Readonly<Record<LanguageKey, () => Promise<Extension>>> = {
  javascript: async () => (await import('@codemirror/lang-javascript')).javascript(),
  jsx: async () => (await import('@codemirror/lang-javascript')).javascript({ jsx: true }),
  typescript: async () => (await import('@codemirror/lang-javascript')).javascript({ typescript: true }),
  tsx: async () => (await import('@codemirror/lang-javascript')).javascript({ jsx: true, typescript: true }),
  cpp: async () => (await import('@codemirror/lang-cpp')).cpp(),
  java: async () => (await import('@codemirror/lang-java')).java(),
  kotlin: async () => stream((await import('@codemirror/legacy-modes/mode/clike')).kotlin),
  csharp: async () => stream((await import('@codemirror/legacy-modes/mode/clike')).csharp),
  html: async () => (await import('@codemirror/lang-html')).html(),
  php: async () => (await import('@codemirror/lang-php')).php(),
  xml: async () => (await import('@codemirror/lang-xml')).xml(),
  css: async () => (await import('@codemirror/lang-css')).css(),
  scss: async () => (await import('@codemirror/lang-css')).css(),
  less: async () => (await import('@codemirror/lang-css')).css(),
  json: async () => (await import('@codemirror/lang-json')).json(),
  markdown: async () => (await import('@codemirror/lang-markdown')).markdown(),
  yaml: async () => (await import('@codemirror/lang-yaml')).yaml(),
  toml: async () => stream((await import('@codemirror/legacy-modes/mode/toml')).toml),
  python: async () => (await import('@codemirror/lang-python')).python(),
  ruby: async () => stream((await import('@codemirror/legacy-modes/mode/ruby')).ruby),
  lua: async () => stream((await import('@codemirror/legacy-modes/mode/lua')).lua),
  swift: async () => stream((await import('@codemirror/legacy-modes/mode/swift')).swift),
  rust: async () => (await import('@codemirror/lang-rust')).rust(),
  go: async () => (await import('@codemirror/lang-go')).go(),
  sql: async () => (await import('@codemirror/lang-sql')).sql(),
  shell: async () => stream((await import('@codemirror/legacy-modes/mode/shell')).shell),
  dockerfile: async () => stream((await import('@codemirror/legacy-modes/mode/dockerfile')).dockerFile),
};

/** A language's support for the editor, or nothing for plain text. */
export function loadLanguage(key: LanguageKey | null): Promise<Extension> {
  return key === null ? Promise.resolve([]) : LOADERS[key]();
}
