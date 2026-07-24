/**
 * First-class camera beat — wait (show page) then eased scroll to target.
 * Step-back reverses to the scrollTop captured at beat start.
 */

import { resolvePlaybackSelectorChain } from "@/app/recording/recordingCapture";
import type { JourneyBeatCamera } from "@/app/orchestra/types";
import {
  animateScrollTo,
  getPrototypeScrollRoot,
  scrollCameraToTarget,
  setCameraBeatDwellActive,
} from "@/app/scenario/playbackScroll";
import { playbackDiagLog, playbackDiagScroll } from "@/app/shell/playbackDiag";
import { playbackMs } from "@/app/shell/playbackTiming";

const DEFAULT_CAMERA_DWELL_MS = 1200;

type CameraUndo = {
  scrollEl: HTMLElement;
  fromTop: number;
};

let lastCameraUndo: CameraUndo | null = null;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Retired / hidden hosts resolve via data-name but sit under display:none (0×0).
 * Scrolling them is a no-op hang risk — treat unusable.
 */
export function isPlaybackCameraTargetUsable(el: HTMLElement | null): boolean {
  if (!el?.isConnected) return false;
  if (el.closest("[data-studio-legacy-retired]")) return false;
  let node: HTMLElement | null = el;
  while (node) {
    try {
      if (getComputedStyle(node).display === "none") return false;
    } catch {
      return false;
    }
    node = node.parentElement;
  }
  try {
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 && rect.height < 1) return false;
  } catch {
    return false;
  }
  return true;
}

function resolveCameraTarget(
  camera: JourneyBeatCamera
): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const chain =
    camera.selectorChain?.filter((s) => s && s !== "#root") ??
    (camera.anchorSelector ? [camera.anchorSelector] : undefined);
  if (chain?.length) {
    const fromChain = resolvePlaybackSelectorChain(chain, document);
    if (isPlaybackCameraTargetUsable(fromChain)) return fromChain;
  }
  if (camera.anchorSelector) {
    const fromAnchor = document.querySelector<HTMLElement>(
      camera.anchorSelector
    );
    if (isPlaybackCameraTargetUsable(fromAnchor)) return fromAnchor;
  }
  return null;
}

/** Clear undo stash (jump-to-start / tests). */
export function clearCameraBeatUndo(): void {
  lastCameraUndo = null;
  setCameraBeatDwellActive(false);
}

export function peekCameraBeatUndo(): CameraUndo | null {
  return lastCameraUndo;
}

/**
 * Play camera beat: capture fromTop → dwell (show page) → ease to target.
 */
export async function playCameraBeat(
  camera: JourneyBeatCamera,
  options?: { skip?: boolean; instant?: boolean; beatId?: string }
): Promise<{ ok: boolean; step?: string }> {
  const scrollEl = getPrototypeScrollRoot();
  const fromTop = scrollEl?.scrollTop ?? 0;
  if (scrollEl) {
    lastCameraUndo = { scrollEl, fromTop };
  } else {
    lastCameraUndo = null;
  }

  const dwellMs = Math.max(0, camera.dwellMs ?? DEFAULT_CAMERA_DWELL_MS);
  const beatId = options?.beatId;

  playbackDiagLog(
    "info",
    `camera-beat dwell ${dwellMs}ms → target`,
    beatId ? { beatId } : undefined
  );

  if (options?.skip || options?.instant) {
    // Skip motion — still resolve target snap for state honesty.
  } else if (dwellMs > 0) {
    setCameraBeatDwellActive(true);
    try {
      await delay(playbackMs(dwellMs));
    } finally {
      setCameraBeatDwellActive(false);
    }
  }

  const target = resolveCameraTarget(camera);
  if (!target) {
    // Dwell-only is valid (show page, no scroll).
    if (!camera.selectorChain?.length && !camera.anchorSelector) {
      return { ok: true };
    }
    // Noisy retired/hidden anchors (module.plp.filters / module.pdp under display:none)
    // — prefer soft continue after dwell over hard-fail / ghost scroll hang.
    playbackDiagLog(
      "info",
      `camera-beat:target-unusable — dwell only (${
        camera.anchorSelector ?? camera.selectorChain?.[0] ?? "?"
      })`,
      beatId ? { beatId } : undefined
    );
    return { ok: true, step: "camera-beat:target-unusable" };
  }

  if (options?.skip || options?.instant) {
    await scrollCameraToTarget(target, { instant: true });
  } else {
    await scrollCameraToTarget(target, { instant: false });
  }

  try {
    playbackDiagScroll({
      beatId,
      detail: "camera-beat scrollIntoView done (eased)",
      intoViewRequested: true,
      intoViewDone: true,
    });
  } catch {
    /* hang-safe */
  }

  return { ok: true };
}

/**
 * Reverse the last camera beat — ease (or snap) back to fromTop.
 * Used by step-back when landing on / leaving a camera beat.
 */
export async function reverseCameraBeat(options?: {
  instant?: boolean;
  beatId?: string;
}): Promise<boolean> {
  const undo = lastCameraUndo;
  if (!undo?.scrollEl?.isConnected) {
    lastCameraUndo = null;
    return false;
  }

  const { scrollEl, fromTop } = undo;
  playbackDiagLog(
    "info",
    `camera-beat reverse → top ${Math.round(fromTop)}`,
    options?.beatId ? { beatId: options.beatId } : undefined
  );

  if (options?.instant) {
    scrollEl.scrollTop = fromTop;
  } else {
    await animateScrollTo(scrollEl, fromTop);
  }

  try {
    playbackDiagScroll({
      beatId: options?.beatId,
      detail: "camera-beat reverse done",
      retreat: true,
      intoViewRequested: true,
      intoViewDone: true,
      beforeTop: scrollEl.scrollTop,
      afterTop: fromTop,
    });
  } catch {
    /* hang-safe */
  }

  return true;
}
