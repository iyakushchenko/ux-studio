/**
 * ALWAYS CLEAR QA — code law (not a reminder).
 *
 * Every REC arm / prove entrypoint MUST call this first. No skip flag.
 * forceClear → fresh start → assert overlay DOM visible.
 */

import {
  forceClearAgentTestingOverlay,
  holdSettleOpen,
  isAgentTestingOverlayActive,
  isAgentTestingOverlayDomVisible,
  logAgentTestingStep,
  startAgentTestingOverlay,
} from "@/app/shell/agent-testing/agentTestingOverlay";
import { beginQaProveMode } from "@/app/shell/agent-testing/agentTestingPresence";
import { resetQaModalTrackForTests } from "@/app/shell/qaModalTrack";

export type FreshQaSessionResult = {
  ok: boolean;
  title: string;
  overlayVisible: boolean;
  overlayActive: boolean;
  reason?: string;
};

export const QA_FRESH_SESSION_REQUIRED =
  "QA refuse — overlay not active after requireFreshQaSession (ALWAYS CLEAR is code law)";

/**
 * Unskippable QA reset used by ArmRecCapture / RecNewCjmProve / FullPlayProve.
 * No options to skip clear.
 */
export function requireFreshQaSession(
  title = "AGENT TESTING"
): FreshQaSessionResult {
  const cleanTitle = title.trim() || "AGENT TESTING";

  // 1) ALWAYS CLEAR — wipe dirty session / latches / log.
  forceClearAgentTestingOverlay();
  try {
    resetQaModalTrackForTests();
  } catch {
    /* hang-safe */
  }

  // 2) Fresh arm — visible overlay for the whole prove/REC. `start` already
  // establishes agent presence; a second `touch` could confirm a diagnostic
  // raised by the just-reset React tree and make autonomous QA hand itself off.
  startAgentTestingOverlay(cleanTitle);

  // Keep open if sitrep somehow entered settle early (no-op when not settling).
  try {
    holdSettleOpen("require-fresh-qa");
  } catch {
    /* hang-safe */
  }

  // Latch prove-mode so 8s stale auto-pause cannot kill mid-REC/Play.
  try {
    beginQaProveMode("require-fresh-qa");
  } catch {
    /* hang-safe */
  }

  const overlayVisible = isAgentTestingOverlayDomVisible();
  const overlayActive = isAgentTestingOverlayActive();
  const ok = overlayVisible || overlayActive;

  try {
    logAgentTestingStep({
      kind: "helper",
      action: "RequireFreshQaSession",
      label: ok
        ? `QA ALWAYS CLEAR · fresh session · ${cleanTitle}`
        : `QA CLEAR FAIL — overlay not visible/active`,
      outcome: ok ? "ok" : "fail",
    });
  } catch {
    /* hang-safe */
  }

  if (!ok) {
    return {
      ok: false,
      title: cleanTitle,
      overlayVisible,
      overlayActive,
      reason: QA_FRESH_SESSION_REQUIRED,
    };
  }

  return {
    ok: true,
    title: cleanTitle,
    overlayVisible,
    overlayActive,
  };
}

/** True when QA overlay is usable for REC/prove (active or DOM visible). */
export function isFreshQaSessionLive(): boolean {
  try {
    return isAgentTestingOverlayDomVisible() || isAgentTestingOverlayActive();
  } catch {
    return false;
  }
}

/**
 * Bypass-safe: if REC is about to start and QA is missing, force a fresh session.
 * Called from startRecording after REC-switch gate.
 */
export function ensureQaSessionForRecCapture(): FreshQaSessionResult | null {
  if (typeof document === "undefined") return null;
  if (isFreshQaSessionLive()) return null;
  return requireFreshQaSession("AGENT TESTING — REC capture");
}
