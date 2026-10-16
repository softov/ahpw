import type { ReactElement } from 'react';
import { MediaFrame } from './media.js';

/** A video file, in the browser's own player. */
export default function VideoPage({ host, uri }: { host: string; uri?: string }): ReactElement {
  return (
    <MediaFrame host={host} uri={uri}>
      {(url) => <video className="web-video" src={url} controls preload="metadata" />}
    </MediaFrame>
  );
}
