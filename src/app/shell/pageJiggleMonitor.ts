/**
 * Objective page-jiggle forensics: rAF samples of page-root y/opacity.
 * Used at beat enter (general) and React screen host remount (book-step-2/3).
 *
 * Waits out wire-mount nav-cross before sampling so crossfade/tab-swap scroll
 * does not inflate deltaY. Prefers React screen host (not wire mount).
 */
import { playbackDiagLog } from "@/app/shell/playbackDiag";

export type PageJiggleSample = {
  t: number;
  y: number;
  opacity: number;
  visible: boolean;
  motionPresence: boolean;
};

function resolvePageRoot(
  screenId: string,
  rootSelector?: string
): HTMLElement | null {
  if (rootSelector) {
    const el = document.querySelector(rootSelector);
    if (el instanceof HTMLElement) return el;
  }
  const host = document.querySelector(
    `.studio-react-screen-host[data-studio-react-screen="${screenId}"]`
  );
  if (host instanceof HTMLElement) return host;
  // Prefer page root over wire-mount — wire y thrash during nav-cross is noise.
  const page = document.querySelector(
    `[data-studio-react-screen="${screenId}"]`
  );
  if (page instanceof HTMLElement) return page;
  return null;
}

function wireMountSettled(): boolean {
  const wire = document.querySelector(
    ".studio-wire-mount"
  ) as HTMLElement | null;
  if (!wire) return true;
  if (wire.classList.contains("studio-wire-mount--nav-cross")) return false;
  const op = Number.parseFloat(getComputedStyle(wire).opacity);
  return !Number.isFinite(op) || op >= 0.95;
}

/**
 * Sample page-root y/opacity/Motion across N rAF frames during a beat.
 * Emits `[PLAYBACK_DIAG] page-jiggle` with deltaY + opacity dips.
 */
export function samplePageJiggle(
  screenId: string,
  rootSelector?: string,
  maxFrames = 12
): void {
  const waitStart = performance.now();
  const begin = () => {
    const root = resolvePageRoot(screenId, rootSelector);
    if (!root || !wireMountSettled()) {
      if (performance.now() - waitStart < 600) {
        requestAnimationFrame(begin);
        return;
      }
      if (!root) return;
    }
    runCapture(screenId, root, maxFrames);
  };
  requestAnimationFrame(begin);
}

function runCapture(
  screenId: string,
  root: HTMLElement,
  maxFrames: number
): void {
  const samples: PageJiggleSample[] = [];
  let count = 0;

  const capture = () => {
    const rect = root.getBoundingClientRect();
    const style = getComputedStyle(root);
    const opacity = Number.parseFloat(style.opacity);
    const motionPresence = Boolean(
      root.querySelector(
        "[data-projection-id], [data-framer-appear-id], [data-framer-component-type]"
      )
    );
    samples.push({
      t: performance.now(),
      y: Math.round(rect.top * 100) / 100,
      opacity: Number.isFinite(opacity) ? opacity : 1,
      visible: style.display !== "none" && style.visibility !== "hidden",
      motionPresence,
    });
    count++;
    if (count < maxFrames) {
      requestAnimationFrame(capture);
    } else {
      reportJiggle(screenId, samples);
    }
  };
  requestAnimationFrame(capture);
}

function reportJiggle(screenId: string, samples: PageJiggleSample[]): void {
  if (samples.length < 2) return;
  const ys = samples.map((s) => s.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const deltaY = Math.round((maxY - minY) * 100) / 100;
  const minOpacity = Math.min(...samples.map((s) => s.opacity));
  const anyHidden = samples.some((s) => !s.visible);
  const motionEnterExit =
    samples.some((s) => s.motionPresence) &&
    samples.some((s) => !s.motionPresence);
  const durationMs = Math.round(
    samples[samples.length - 1]!.t - samples[0]!.t
  );
  const jiggle = deltaY > 1 || minOpacity < 0.95 || anyHidden;

  if (jiggle) {
    playbackDiagLog(
      "info",
      `page-jiggle ${screenId} deltaY=${deltaY} minOpacity=${minOpacity} hidden=${anyHidden} motionFlip=${motionEnterExit} dur=${durationMs}ms`,
      { surface: screenId, screenAfter: screenId }
    );
  }
  console.info("[PLAYBACK_DIAG] page-jiggle", {
    screenId,
    deltaY,
    minOpacity,
    anyHidden,
    motionEnterExit,
    durationMs,
    jiggle,
    samples: samples.map((s) => ({
      t: Math.round(s.t),
      y: s.y,
      op: s.opacity,
      motion: s.motionPresence,
    })),
  });
}
