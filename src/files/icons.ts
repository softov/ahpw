import { EMOJIcon } from '../emojis.js';
import { extOf } from './viewers.js';

/** The kinds of file that have their own icon, by extension. */
const KINDS: [icon: string, extensions: string[]][] = [
  [EMOJIcon.image, ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif', 'tif', 'tiff', 'svg']],
  [EMOJIcon.video, ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', 'ogv']],
  [EMOJIcon.audio, ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'flac', 'aac', 'opus']],
  [EMOJIcon.markdown, ['md', 'markdown']],
  [EMOJIcon.data, ['json', 'jsonc', 'json5', 'jsonl', 'yaml', 'yml', 'toml', 'xml', 'csv', 'ini', 'lock']],
  [EMOJIcon.archive, ['zip', 'tar', 'gz', 'tgz', 'bz2', 'xz', '7z', 'rar']],
  [EMOJIcon.code, [
    'js', 'mjs', 'cjs', 'jsx', 'ts', 'mts', 'cts', 'tsx', 'vue', 'svelte', 'html', 'htm', 'css', 'scss', 'less',
    'c', 'h', 'cc', 'cpp', 'hpp', 'cs', 'go', 'rs', 'py', 'rb', 'php', 'java', 'kt', 'swift', 'lua', 'sql',
    'sh', 'bash', 'zsh', 'ps1',
  ]],
];

const BY_EXTENSION = new Map(KINDS.flatMap(([icon, extensions]) => extensions.map((ext) => [ext, icon] as const)));

/** The icon a file is drawn with, from its extension; the plain file icon when the kind is not known. */
export function iconOf(uri: string): string {
  return BY_EXTENSION.get(extOf(uri)) ?? EMOJIcon.file;
}
