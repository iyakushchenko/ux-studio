/**
 * Prototype nav counter-zoom — keeps the tab strip at 1× while page content zooms (Ctrl+/−).
 *
 * ⚠️ DO NOT MODIFY THIS FILE (or nav layout in studioNavPanel.css / StudioNavPanel.tsx)
 * to “fix gaps”, Cursor-browser quirks, lightbox offsets, fixed positioning, height
 * sync, padding-top on .studio-app-content, --studio-nav-panel-height, etc.
 * Those changes repeatedly broke zoom immunity across browsers and took hours to recover.
 *
 * Safe exception: z-index on .studio-nav-panel-host only (lightbox stacking, not zoom).
 * Ctrl+0 recalibrates baseline after browser reset.
 */
import { useLayoutEffect, type RefObject } from "react";

const ZOOM_STEPS = [
  25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400,
  500,
] as const;

function snapZoomPercent(raw: number): number {
  return ZOOM_STEPS.reduce((best, step) =>
    Math.abs(step - raw) < Math.abs(best - raw) ? step : best,
  );
}

function applyCounterZoom(host: HTMLElement, zoomScale: number): void {
  if (Math.abs(zoomScale - 1) < 0.005) {
    host.style.cssText = "";
    return;
  }
  const inv = 1 / zoomScale;
  host.style.cssText = `zoom: ${inv} !important; will-change: contents;`;
}

/**
 * Counter-zooms the nav host so it stays visually locked at its initial size.
 * Uses the DPR at mount as baseline — only reacts to CHANGES from that point.
 * Ctrl+0 recalibrates baseline after the browser resets.
 */
export function useStudioNavZoom(
  hostRef: RefObject<HTMLElement | null>,
  _shellRef: RefObject<HTMLElement | null>,
  _contentRef: RefObject<HTMLElement | null>,
  zoomLabelRef: RefObject<HTMLElement | null>,
): void {
  useLayoutEffect(() => {
    // Detect current browser zoom using outerWidth/innerWidth ratio
    const detectZoom = (): number => {
      const ratio = window.outerWidth / window.innerWidth;
      // outerWidth includes browser chrome; only trust if reasonable
      if (ratio > 0.25 && ratio < 5) return ratio;
      return 1;
    };

    const initialZoom = detectZoom();
    // Compute what DPR would be at 100% zoom
    let baselineDpr = window.devicePixelRatio / initialZoom;
    let mql: MediaQueryList | null = null;
    let pendingCalibration = false;

    const apply = () => {
      const host = hostRef.current;
      if (!host) return;
      const currentDpr = window.devicePixelRatio || 1;
      const zoom = currentDpr / baselineDpr;
      applyCounterZoom(host, zoom);
      const pct = snapZoomPercent(Math.round(zoom * 100));
      if (zoomLabelRef.current) {
        zoomLabelRef.current.textContent = `${pct}%`;
      }
    };

    const calibrateNow = () => {
      baselineDpr = window.devicePixelRatio;
      pendingCalibration = false;
      apply();
    };

    const onDprChange = () => {
      attachMql();
      if (pendingCalibration) {
        calibrateNow();
      } else {
        apply();
      }
    };

    const attachMql = () => {
      mql?.removeEventListener("change", onDprChange);
      mql = window.matchMedia(
        `(resolution: ${window.devicePixelRatio}dppx)`,
      );
      mql.addEventListener("change", onDprChange);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.isTrusted || !(e.ctrlKey || e.metaKey)) return;
      if (e.key === "0") {
        pendingCalibration = true;
        setTimeout(() => {
          if (pendingCalibration) calibrateNow();
        }, 300);
      }
    };

    apply();
    attachMql();
    window.addEventListener("keydown", onKeyDown);

    return () => {
      mql?.removeEventListener("change", onDprChange);
      window.removeEventListener("keydown", onKeyDown);
      const host = hostRef.current;
      if (host) host.style.cssText = "";
    };
  }, [hostRef, zoomLabelRef]);
}
