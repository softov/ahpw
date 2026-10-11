import type { ReactElement } from 'react';
import { MediaFrame } from './media.js';

/** A video file, in the browser's own player. */
export default function VideoPage({ uri }: { uri?: string }): ReactElement {
  return (
    <MediaFrame uri={uri}>
      {(url) => <video className="web-video" src={url} controls preload="metadata" />}
    </MediaFrame>
  );
}
