import { useEffect, useRef, useState, type PointerEvent, type ReactElement, type WheelEvent } from 'react';
import { MediaFrame } from './media.js';
import { percentOf } from './zoom.js';

const MIN_SCALE = 1;
const MAX_SCALE = 20;
/** How much one press of [-] or [+] zooms. */
const STEP = 1.25;

/** An image, drawn through `<img>`, so an SVG's scripts never run. The bar and the wheel zoom, drag pans, double-click fits. */
function Zoomable({ url, alt }: { url: string; alt: string }): ReactElement {
  const frame = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(MIN_SCALE);
  const [size, setSize] = useState({ fitted: 0, natural: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const reset = (): void => { setScale(MIN_SCALE); setOffset({ x: 0, y: 0 }); };
  useEffect(reset, [url]);

  /** Zooms to `wanted`, keeping the point at (cx, cy) from the centre where it is. */
  const zoomTo = (wanted: number, cx = 0, cy = 0): void => {
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, wanted));
    if (next === scale) return;
    const ratio = next / scale;
    setOffset(next === MIN_SCALE ? { x: 0, y: 0 } : (o) => ({ x: cx - (cx - o.x) * ratio, y: cy - (cy - o.y) * ratio }));
    setScale(next);
  };
  const onWheel = (event: WheelEvent<HTMLDivElement>): void => {
    const rect = frame.current?.getBoundingClientRect();
    if (rect === undefined) return;
    zoomTo(scale * Math.exp(-event.deltaY * 0.0015), event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2);
  };
  const measure = (): void => {
    const node = image.current;
    if (node !== null) setSize({ fitted: node.offsetWidth, natural: node.naturalWidth });
  };
  useEffect(() => {
    const node = frame.current;
    if (node === null || typeof ResizeObserver === 'undefined') return;
    const watch = new ResizeObserver(measure);
    watch.observe(node);
    return () => watch.disconnect();
  }, []);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (scale <= MIN_SCALE) return;
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const from = drag.current;
    if (from !== null) setOffset({ x: from.ox + event.clientX - from.x, y: from.oy + event.clientY - from.y });
  };
  const onPointerUp = (): void => { drag.current = null; setDragging(false); };

  // React adds wheel listeners as passive, so the page would scroll too; this one may cancel.
  useEffect(() => {
    const node = frame.current;
    const stop = (event: globalThis.WheelEvent): void => event.preventDefault();
    node?.addEventListener('wheel', stop, { passive: false });
    return () => node?.removeEventListener('wheel', stop);
  }, []);

  const zoomed = scale > MIN_SCALE;
  return (
    <div className="web-image__view">
      <div className="web-image__bar" role="toolbar" aria-label="Zoom">
        <button type="button" className="web-image__step" title="Zoom out" aria-label="Zoom out" disabled={!zoomed} onClick={() => zoomTo(scale / STEP)}>−</button>
        <button type="button" className="web-image__step web-image__percent" title="Fit" aria-label="Fit" disabled={!zoomed} onClick={reset}>{percentOf(scale, size.fitted, size.natural)}%</button>
        <button type="button" className="web-image__step" title="Zoom in" aria-label="Zoom in" disabled={scale >= MAX_SCALE} onClick={() => zoomTo(scale * STEP)}>+</button>
      </div>
      <div
        ref={frame}
        className="web-image"
        data-zoomed={zoomed ? 'true' : 'false'}
        data-dragging={dragging ? 'true' : 'false'}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={reset}
      >
        <img
          ref={image}
          src={url}
          alt={alt}
          draggable={false}
          onLoad={measure}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        />
      </div>
    </div>
  );
}

const nameOf = (uri: string): string => decodeURIComponent(uri.split('/').pop() ?? uri);

/** An image file, PNG to SVG, with zoom and pan. */
export default function ImagePage({ uri }: { uri?: string }): ReactElement {
  return <MediaFrame uri={uri}>{(url) => <Zoomable url={url} alt={nameOf(uri ?? '')} />}</MediaFrame>;
}
