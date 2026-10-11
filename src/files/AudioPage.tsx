import { useMemo, useRef, useState, type ReactElement } from 'react';
import { EMOJIcon } from '../emojis.js';
import { MediaFrame } from './media.js';

const BARS = 64;

const clock = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
};

/**
 * Play, pause, a row of bars that shows and moves the play position, the speed and the time.
 *
 * The bars are a fixed shape, not the sound: they are there to be clicked, and
 * the played part is drawn in the accent colour.
 */
function Player({ url }: { url: string }): ReactElement {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [failed, setFailed] = useState(false);
  const heights = useMemo(
    () => Array.from({ length: BARS }, (_, i) => Math.min(100, Math.max(15, (Math.abs(Math.sin(i * 0.45) * 0.6 + Math.cos(i * 0.9) * 0.4) + (i % 5) * 0.06) * 100))),
    [],
  );
  const played = duration > 0 ? current / duration : 0;

  const toggle = (): void => {
    const node = audio.current;
    if (node === null) return;
    if (node.paused) void node.play().catch(() => setFailed(true));
    else node.pause();
  };
  const seek = (fraction: number): void => {
    const node = audio.current;
    if (node === null || duration <= 0) return;
    node.currentTime = fraction * duration;
    setCurrent(node.currentTime);
  };
  const faster = (): void => {
    const next = rate >= 2 ? 0.5 : rate + 0.5;
    if (audio.current !== null) audio.current.playbackRate = next;
    setRate(next);
  };

  if (failed) return <p className="web-note web-media__note">This browser cannot play this file.</p>;
  return (
    <div className="web-audio">
      <button type="button" className="web-audio__play" onClick={toggle} title={playing ? 'Pause' : 'Play'}>
        {playing ? EMOJIcon.pause : EMOJIcon.run}
      </button>
      <div className="web-audio__track">
        <div
          className="web-audio__bars"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            seek(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)));
          }}
        >
          {heights.map((height, i) => (
            <span key={i} data-played={played >= i / BARS ? 'true' : 'false'} style={{ height: `${height}%` }} />
          ))}
        </div>
        <div className="web-audio__time">
          <span>{clock(current)}</span>
          <span>{clock(duration)}</span>
        </div>
      </div>
      <button type="button" className="web-audio__rate" onClick={faster} title="Speed">{rate}x</button>
      <audio
        ref={audio}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/** An audio file, with a player. */
export default function AudioPage({ uri }: { uri?: string }): ReactElement {
  return <MediaFrame uri={uri}>{(url) => <Player url={url} />}</MediaFrame>;
}
