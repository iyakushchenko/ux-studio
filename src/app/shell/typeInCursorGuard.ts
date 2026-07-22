/**
 * CJM type-in cursor guard — keep robo-cursor visible; latch if hidden.
 *
 * Split from playbackDiag to avoid import cycles with agentTestingPoSignal.
 */

import {
  parkDemoCursorForTypeIn,
  readDemoCursorDomState,
  clearDemoCursorCarriageLatches,
} from "@/app/scenario/demoCursor";
import { latchPoSignal } from "@/app/shell/agent-testing/agentTestingPoSignal";
import { playbackDiagCursor } from "@/app/shell/playbackDiag";

let hiddenLatchedForActiveTypeIn = false;

export function resetTypeInCursorGuard(): void {
  hiddenLatchedForActiveTypeIn = false;
}

/** Type-in finished / aborted — drop carriage latch so Play hover/click is hand|arrow. */
export function endTypeInCursorGuard(): void {
  resetTypeInCursorGuard();
  // Split-frame disappearance after the last typed character used to be
  // cleared before QA could see it. Audit both sides of latch cleanup.
  reportTypeInCursorVisibility("end");
  clearDemoCursorCarriageLatches();
  requestAnimationFrame(() => reportTypeInCursorVisibility("post-end-frame"));
}

/** Hold journey park rest at type-in start; log visibility. */
export function beginTypeInCursorGuard(target: HTMLElement): void {
  resetTypeInCursorGuard();
  // Force one park pose for this type-in; ticks must not slide it.
  parkDemoCursorForTypeIn(target, { force: true });
  reportTypeInCursorVisibility("start", target);
}

/**
 * PO: stay PARKED during type-in — no caret-slide / travel while text lands.
 * Re-assert park only if missing/exiting; never move along the field.
 * HARD: do NOT log cursor visibility every N chars (QA/perf flood).
 * Animation itself is unchanged — only diag/QA emit is gated.
 * Hidden latch still fires when cursor is missing on re-park.
 */
export function tickTypeInCursorGuard(target: HTMLElement, chars: number): void {
  const existing = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
  if (
    !existing ||
    existing.classList.contains("proto-chat-demo-cursor--exit")
  ) {
    // Report before recovery. Reporting only after re-park falsely said the
    // cursor was healthy when it had vanished for a frame.
    reportTypeInCursorVisibility("hidden-before-repark", target, chars);
    parkDemoCursorForTypeIn(target);
  } else if (!existing.classList.contains("proto-chat-demo-cursor--parked")) {
    // Restore parked class without reseeding (parkDemoCursorForTypeIn holds pose).
    parkDemoCursorForTypeIn(target);
  }
}

export function reportTypeInCursorVisibility(
  phase: string,
  _target?: HTMLElement,
  chars?: number
): boolean {
  const dom = readDemoCursorDomState();
  const detail = dom.visible
    ? `type-in ${phase} cursor visible`
    : `type-in ${phase} cursor HIDDEN (missing=${dom.missing} opacity=${dom.opacity ?? "n/a"} display=${dom.display ?? "n/a"})`;
  playbackDiagCursor({
    action: dom.visible ? "park" : "dwell-no-cursor",
    detail,
    parked: dom.parked,
    parkReason: dom.parked ? "type-in-park" : null,
  });
  if (!dom.visible && !hiddenLatchedForActiveTypeIn) {
    hiddenLatchedForActiveTypeIn = true;
    try {
      latchPoSignal({
        type: "cursor",
        code: "CURSOR_HIDDEN_DURING_TYPEIN",
        note: detail,
      });
    } catch {
      /* hang-safe */
    }
    try {
      console.warn(
        "[PLAYBACK_DIAG] cursor",
        "CURSOR_HIDDEN_DURING_TYPEIN",
        { phase, chars, ...dom }
      );
    } catch {
      /* ignore */
    }
  }
  return dom.visible;
}
