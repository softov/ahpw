import type { ReactElement } from 'react';
import { fileLink } from './link.js';
import { useFileUrl } from './media.js';

/**
 * An image a markdown file names. A web or data src is drawn as written; a
 * path is read through the host from the file's folder, as the image viewer
 * reads one, because the page's own URL is not where the file is. Drawn
 * through `<img>`, so an SVG's scripts never run.
 */
function HostImage({ host, src, alt, base }: { host: string; src: string; alt: string; base: string | null }): ReactElement {
  const target = /^(https?|data):/i.test(src) ? null : fileLink(src, base);
  const file = useFileUrl(host, target?.uri);
  if (target === null) return <img src={src} alt={alt} />;
  if (file !== null && 'url' in file) return <img src={file.url} alt={alt} />;
  // Reading, too large, or not there: the alt text holds the place, the path on hover.
  return <span className="web-md__image" title={target.uri} data-state={file === null ? 'reading' : 'missing'}>{alt}</span>;
}

/** Markdown's `image` for a file in `base` on the host `host`. */
export const imagesFrom = (host: string, base: string | null) => (src: string, alt: string): ReactElement => <HostImage host={host} src={src} alt={alt} base={base} />;
