import { useCallback, useEffect, useRef, useState } from "react";
import { ProtoCloseIcon } from "@/app/chrome/ProtoCloseIcon";

export type HubLightboxImage = {
  src: string;
  alt: string;
  caption?: string;
};

type ViewMetrics = {
  naturalW: number;
  naturalH: number;
  fitScale: number;
};

type Props = {
  image: HubLightboxImage | null;
  onClose: () => void;
};

function computeFit(
  viewport: HTMLElement,
  naturalW: number,
  naturalH: number
): ViewMetrics {
  const fitScale = Math.min(
    viewport.clientWidth / naturalW,
    viewport.clientHeight / naturalH
  );
  return { naturalW, naturalH, fitScale };
}

function zoomAroundAnchor(
  prevScale: number,
  prevPan: { x: number; y: number },
  nextScale: number,
  viewport: HTMLElement,
  fitScale: number,
  anchor: { x: number; y: number } | null
): { scale: number; pan: { x: number; y: number } } {
  const fit = Math.min(fitScale, 1);
  if (nextScale <= fit + 0.001) {
    return { scale: fit, pan: { x: 0, y: 0 } };
  }

  const originX = viewport.clientWidth / 2;
  const originY = viewport.clientHeight / 2;
  const cx = anchor?.x ?? originX;
  const cy = anchor?.y ?? originY;

  const imageX = (cx - originX - prevPan.x) / prevScale;
  const imageY = (cy - originY - prevPan.y) / prevScale;

  return {
    scale: nextScale,
    pan: {
      x: cx - originX - imageX * nextScale,
      y: cy - originY - imageY * nextScale,
    },
  };
}

function viewportAnchorFromClient(
  viewport: HTMLElement,
  clientX: number,
  clientY: number
): { x: number; y: number } | null {
  const rect = viewport.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const inside =
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom;

  if (!inside) return null;

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

export default function ProtoHubImageLightbox({ image, onClose }: Props) {
  const [metrics, setMetrics] = useState<ViewMetrics | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  }>({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const pointerRef = useRef<{
    inViewport: boolean;
    x: number;
    y: number;
  }>({ inViewport: false, x: 0, y: 0 });

  scaleRef.current = scale;
  panRef.current = pan;

  const syncMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    const img = imgRef.current;
    if (!viewport || !img?.naturalWidth) return;
    const next = computeFit(viewport, img.naturalWidth, img.naturalHeight);
    setMetrics(next);
    setScale(Math.min(next.fitScale, 1));
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!image) {
      setMetrics(null);
      return;
    }
    setMetrics(null);
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [image]);

  useEffect(() => {
    if (!image) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [image, onClose]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !image) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!metrics) return;

      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      const minScale = Math.min(metrics.fitScale, 1) * 0.35;
      const maxScale = 1;
      const prevScale = scaleRef.current;
      const prevPan = panRef.current;
      const nextScale = Math.min(
        maxScale,
        Math.max(minScale, prevScale * factor)
      );

      const wheelAnchor = viewportAnchorFromClient(
        viewport,
        e.clientX,
        e.clientY
      );
      const anchor =
        wheelAnchor ??
        (pointerRef.current.inViewport
          ? { x: pointerRef.current.x, y: pointerRef.current.y }
          : null);

      const next = zoomAroundAnchor(
        prevScale,
        prevPan,
        nextScale,
        viewport,
        metrics.fitScale,
        anchor
      );

      scaleRef.current = next.scale;
      panRef.current = next.pan;
      setScale(next.scale);
      setPan(next.pan);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [image, metrics]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !image) return;

    const ro = new ResizeObserver(() => {
      const img = imgRef.current;
      if (!img?.naturalWidth) return;
      const next = computeFit(viewport, img.naturalWidth, img.naturalHeight);
      setMetrics(next);
      setScale(Math.min(next.fitScale, 1));
      setPan({ x: 0, y: 0 });
    });

    ro.observe(viewport);
    return () => ro.disconnect();
  }, [image]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!metrics || scale <= metrics.fitScale) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      pointerRef.current = {
        inViewport: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    if (!dragRef.current.active) return;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
    });
  };

  const onPointerLeave = () => {
    pointerRef.current.inViewport = false;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onViewportDoubleClick = () => {
    if (!metrics) return;
    dragRef.current.active = false;

    const fit = Math.min(metrics.fitScale, 1);
    const isAtFit =
      scale <= fit + 0.01 &&
      Math.abs(pan.x) < 1 &&
      Math.abs(pan.y) < 1;

    if (!isAtFit) {
      setScale(fit);
      setPan({ x: 0, y: 0 });
      return;
    }

    const next = Math.min(1, scale * 1.5);
    if (next > scale + 0.001) {
      const viewport = viewportRef.current;
      if (!viewport) {
        setScale(next);
        return;
      }

      const anchor = pointerRef.current.inViewport
        ? { x: pointerRef.current.x, y: pointerRef.current.y }
        : null;
      const zoomed = zoomAroundAnchor(
        scale,
        pan,
        next,
        viewport,
        metrics.fitScale,
        anchor
      );
      setScale(zoomed.scale);
      setPan(zoomed.pan);
    }
  };

  const onScrimClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const zoomLabel = metrics ? `${Math.round(scale * 100)}%` : "…";

  if (!image) return null;

  const canPan = metrics ? scale > metrics.fitScale + 0.01 : false;

  return (
    <div
      className="proto-hub-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onScrimClick}
    >
      <div className="proto-hub-lightbox__chrome" onClick={(e) => e.stopPropagation()}>
        <div className="proto-hub-lightbox__toolbar">
          <span className="proto-hub-lightbox__zoom" aria-live="polite">
            {zoomLabel}
          </span>
          <p className="proto-hub-lightbox__hint">
            Scroll to zoom · Drag to pan · Double click to fit or zoom in
          </p>
          <button
            type="button"
            className="proto-popup-close proto-hub-lightbox__close"
            aria-label="Close image preview"
            onClick={onClose}
          >
            <ProtoCloseIcon />
          </button>
        </div>

        <div
          ref={viewportRef}
          className={`proto-hub-lightbox__viewport${
            canPan ? " proto-hub-lightbox__viewport--pan" : ""
          }`}
          onDoubleClick={onViewportDoubleClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            className="proto-hub-lightbox__stage"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            }}
          >
            <img
              ref={imgRef}
              className="proto-hub-lightbox__img"
              src={image.src}
              alt={image.alt}
              width={metrics?.naturalW}
              height={metrics?.naturalH}
              draggable={false}
              decoding="async"
              onLoad={syncMetrics}
            />
          </div>
        </div>

        {image.caption ? (
          <p className="proto-hub-lightbox__caption">{image.caption}</p>
        ) : null}
      </div>
    </div>
  );
}
