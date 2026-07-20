/**
 * Minimal screen-host blink/jiggle forensics for React pilots (book-step-2/3).
 * Samples opacity/visibility + Motion presence; remount jiggle via pageJiggleMonitor.
 */
import { playbackDiagScreenEnter } from "@/app/shell/playbackDiag";
import { samplePageJiggle } from "@/app/shell/pageJiggleMonitor";

function sampleHostPresence(host: HTMLElement | null): {
  opacity: number | null;
  visibility: string | null;
  motionPresence: boolean;
} {
  if (!host || typeof getComputedStyle !== "function") {
    return { opacity: null, visibility: null, motionPresence: false };
  }
  const style = getComputedStyle(host);
  const opacity = Number.parseFloat(style.opacity);
  const motionPresence = Boolean(
    host.querySelector(
      "[data-projection-id], [data-framer-appear-id], [data-framer-component-type]"
    )
  );
  return {
    opacity: Number.isFinite(opacity) ? opacity : null,
    visibility: style.visibility || null,
    motionPresence,
  };
}

/** Log screen-enter + remount/render counters for a React screen host. */
export function noteReactScreenHostEnter(options: {
  screenId: string;
  host: HTMLElement | null;
  remountCount: number;
  renderCount: number;
  createdRoot: boolean;
}): void {
  const sample = sampleHostPresence(options.host);
  let wireOpacity: number | null = null;
  try {
    const mount = document.querySelector(
      ".studio-wire-mount"
    ) as HTMLElement | null;
    if (mount) {
      const op = Number.parseFloat(getComputedStyle(mount).opacity);
      wireOpacity = Number.isFinite(op) ? op : null;
    }
  } catch {
    wireOpacity = null;
  }
  playbackDiagScreenEnter({
    screenId: options.screenId,
    remountCount: options.remountCount,
    renderCount: options.renderCount,
    createdRoot: options.createdRoot,
    opacity: sample.opacity,
    visibility: sample.visibility,
    motionPresence: sample.motionPresence,
    detail: `screen-enter ${options.screenId} remount=${options.remountCount} render=${options.renderCount} createdRoot=${options.createdRoot} hostOpacity=${sample.opacity ?? "?"} wireOpacity=${wireOpacity ?? "?"} visibility=${sample.visibility ?? "?"} motion=${sample.motionPresence ? "yes" : "no"}`,
  });
  // True remount only — prop re-renders must not flood jiggle samples.
  if (options.createdRoot) {
    samplePageJiggle(options.screenId);
  }
}

export { samplePageJiggle } from "@/app/shell/pageJiggleMonitor";
