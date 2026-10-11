import { EMOJIcon } from '../emojis.js';
import { extOf } from './viewers.js';

/** Images, by extension, with the type a browser draws them as. */
export const IMAGES: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  bmp: 'image/bmp', ico: 'image/x-icon', avif: 'image/avif', svg: 'image/svg+xml',
};
/** Videos, by extension, with the type a browser plays them as. */
export const VIDEOS: Record<string, string> = {
  mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', ogv: 'video/ogg',
};
/** Audio, by extension, with the type a browser plays it as. */
export const AUDIO: Record<string, string> = {
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg',
  m4a: 'audio/mp4', aac: 'audio/aac', flac: 'audio/flac',
};

/** The kinds of file that have their own icon, by extension. */
const KINDS: [icon: string, extensions: string[]][] = [
  [EMOJIcon.image, [...Object.keys(IMAGES), 'tif', 'tiff']],
  [EMOJIcon.video, [...Object.keys(VIDEOS), 'mkv', 'avi']],
  [EMOJIcon.audio, Object.keys(AUDIO)],
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

/** The type a browser shows a file as, from its extension; '' for a file it has no viewer for. */
export function mediaTypeOf(uri: string): string {
  const ext = extOf(uri);
  return IMAGES[ext] ?? VIDEOS[ext] ?? AUDIO[ext] ?? '';
}

/** A viewer selector that matches these extensions. */
export const selectorOf = (types: Record<string, string>): string =>
  Object.keys(types).map((ext) => `$/resource/ext == "${ext}"`).join(' || ');
