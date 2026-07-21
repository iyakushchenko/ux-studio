import type {
  BookScriptId,
  JourneyBeat,
  JourneyRuntime,
  TabScriptId,
} from "@/app/orchestra/types";
import { isPopupTouchpoint } from "@/app/nav/resolveStudioTouchpoint";

/** Book director steps that move the prototype scroll root (not selection-only). */
const BOOK_SCRIPT_SCROLLS_VIEWPORT = new Set<BookScriptId>([
  "select-book-time",
  "reserve-appointment",
]);

/** Traditional tab scripts that ease the prototype scroll root via demo cursor travel. */
const TAB_SCRIPT_SCROLLS_VIEWPORT = new Set<TabScriptId>([
  "plp-open-pdp",
  "pdp-book-now",
  "book-location-pick",
  "history-view-details",
]);

export function directorScriptScrollsViewport(
  scriptLabel: string | undefined
): boolean {
  if (!scriptLabel) return false;
  return (
    BOOK_SCRIPT_SCROLLS_VIEWPORT.has(scriptLabel as BookScriptId) ||
    TAB_SCRIPT_SCROLLS_VIEWPORT.has(scriptLabel as TabScriptId)
  );
}

/** First-class camera dwell/scroll step (own STEPS slot). */
export function beatHasCameraStep(beat: JourneyBeat | undefined): boolean {
  if (!beat) return false;
  return beat.kind === "camera" || Boolean(beat.camera);
}

/**
 * Beat runs a cursor-guided playback script (not dwell / screen-frames / camera).
 * Camera is its own engine (`beatHasCameraStep`) — never a director handoff script.
 */
export function beatHasDirectorScript(beat: JourneyBeat | undefined): boolean {
  if (!beat) return false;
  if (beatHasCameraStep(beat)) return false;
  return Boolean(
    beat.bookScript ??
      beat.tabScript ??
      beat.homeScript ??
      beat.availScript ??
      beat.recordedClick?.selectorChain?.length
  );
}

/** Tab/overlay landing beat with no script — dwell frame (not camera step). */
export function isDwellLandingBeat(beat: JourneyBeat | undefined): boolean {
  if (!beat || beat.kind === "screen-frames") return false;
  if (beatHasCameraStep(beat)) return false;
  return !beatHasDirectorScript(beat);
}

export function beatsShareProtoTab(
  previous: JourneyBeat | undefined,
  next: JourneyBeat | undefined
): boolean {
  return (
    previous?.protoTab != null &&
    next?.protoTab != null &&
    previous.protoTab === next.protoTab
  );
}

/** Display / scroll-guard label for a camera beat (not a director script id). */
export function beatCameraLabel(
  beat: JourneyBeat | undefined
): string | undefined {
  if (!beatHasCameraStep(beat)) return undefined;
  return (
    beat!.camera?.selectorChain?.[0] ||
    beat!.camera?.anchorSelector ||
    "camera"
  );
}

/**
 * Director script id/label for handoff + outcome monitors.
 * Camera-only beats return undefined (use `beatCameraLabel`).
 */
export function beatDirectorScriptLabel(
  beat: JourneyBeat | undefined
): string | undefined {
  if (!beat) return undefined;
  if (beatHasCameraStep(beat)) return undefined;
  if (beat.recordedClick?.selectorChain?.length) {
    return (
      beat.recordedClick.element?.trim() ||
      beat.recordedClick.selectorChain[0] ||
      "recorded-click"
    );
  }
  return (
    beat.bookScript ??
    beat.tabScript ??
    beat.homeScript ??
    beat.availScript
  );
}

export function findJourneyBeat(
  beats: readonly JourneyBeat[],
  beatId: string | undefined
): JourneyBeat | undefined {
  if (!beatId) return undefined;
  return beats.find((beat) => beat.id === beatId);
}

function isBookStep2FunnelBeat(beat: JourneyBeat | undefined): boolean {
  return beat?.id?.startsWith("book-step2") ?? false;
}

/** Close book-step1 overlays before the book-step2 dwell lands (wire state can lag one frame). */
export function prepareBeatIndexAdvance(
  runtime: Pick<JourneyRuntime, "closeAllPopups" | "closeAvailability">,
  nextBeat: JourneyBeat | undefined
): void {
  if (nextBeat?.id !== "book-step2") return;
  runtime.closeAllPopups();
  runtime.closeAvailability();
}

/** Director script on this beat includes a same-screen camera scroll. */
export function beatDirectorScriptScrollsViewport(
  beat: JourneyBeat | undefined
): boolean {
  if (!beat?.bookScript) return false;
  return BOOK_SCRIPT_SCROLLS_VIEWPORT.has(beat.bookScript);
}

/**
 * Same-screen touchpoint advance where the next beat's director script should
 * reposition the prototype scroll root (chained interactions on one tab).
 *
 * Selection-only steps (e.g. book date) do not scroll — the next beat owns camera
 * follow when its script runs.
 */
export function beatExpectsViewportFollow(
  previousBeat: JourneyBeat | undefined,
  nextBeat: JourneyBeat | undefined
): boolean {
  if (!previousBeat || !nextBeat) return false;
  if (
    previousBeat.kind === "screen-frames" ||
    nextBeat.kind === "screen-frames" ||
    previousBeat.kind === "overlay" ||
    nextBeat.kind === "overlay"
  ) {
    return false;
  }
  if (!beatsShareProtoTab(previousBeat, nextBeat)) return false;
  if (!beatHasDirectorScript(nextBeat)) return false;
  if (previousBeat.bookScript === "select-book-date") return false;
  if (!beatDirectorScriptScrollsViewport(nextBeat)) return false;
  return beatHasDirectorScript(previousBeat) || isDwellLandingBeat(previousBeat);
}

/** After a director script ends, verify scroll when that beat's script moves camera. */
export function beatExpectsViewportFollowAfterScript(
  beat: JourneyBeat | undefined
): boolean {
  return beatDirectorScriptScrollsViewport(beat);
}

/**
 * Manual step-forward on a selection-only beat advances the beat index; chain-run the
 * next beat's director script in the same gesture (e.g. book date → time scroll/select).
 */
export function shouldChainManualDirectorStepOnAdvance(
  previousBeat: JourneyBeat | undefined,
  nextBeat: JourneyBeat | undefined
): boolean {
  if (!previousBeat || !nextBeat) return false;
  if (!beatHasDirectorScript(nextBeat)) return false;

  if (
    previousBeat.bookScript === "reserve-appointment" &&
    nextBeat.tabScript === "confirmation-open-appointments"
  ) {
    return true;
  }
  if (
    previousBeat.tabScript === "confirmation-open-appointments" &&
    nextBeat.tabScript === "history-view-details"
  ) {
    return true;
  }
  if (
    previousBeat.tabScript === "login-sign-in" &&
    nextBeat.tabScript === "book-location-pick"
  ) {
    return true;
  }

  if (!beatsShareProtoTab(previousBeat, nextBeat)) return false;
  return (
    (previousBeat.bookScript === "select-book-date" &&
      nextBeat.bookScript === "select-book-time") ||
    (previousBeat.bookScript === "select-book-time" &&
      nextBeat.bookScript === "reserve-appointment")
  );
}

/**
 * Viewport scroll follow applies only to in-page prototype scroll — not popups.
 */
export function touchpointExpectsViewportFollow(
  baselineTouchpointKey: string | undefined,
  touchpointKey: string | undefined,
  beatLevelExpects: boolean
): boolean {
  if (!beatLevelExpects) return false;
  if (isPopupTouchpoint(baselineTouchpointKey)) return false;
  if (isPopupTouchpoint(touchpointKey)) return false;
  return true;
}
