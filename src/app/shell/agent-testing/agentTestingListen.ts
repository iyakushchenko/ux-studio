/**
 * QA “listen” helpers — draft, typing wait, transport block, priority hints.
 * Overlay owns pause/latch; this module stays hang-safe + lean.
 */

import { isQaProveModeActive } from "@/app/shell/agent-testing/agentTestingPresence";
import {
  clearQaProgressFreeze,
  isQaProgressFrozen,
} from "@/app/shell/agent-testing/agentTestingProgressFreeze";
import { clearFailHandoff } from "@/app/shell/agent-testing/agentTestingFailHandoff";

export const QA_MESSAGE_DRAFT_KEY = "studioQaMessageDraft";

/** Prefer cause-before-symptom; cap spam. */
export function buildQaPriorityHints(input: {
  capturePaused?: boolean;
  awaitingReply?: boolean;
  poSignalCode?: string | null;
  diagnosticOpen?: boolean;
  diagnosticMessage?: string | null;
  mcpPhase?: string | null;
  userTyping?: boolean;
}): string[] {
  const hints: string[] = [];
  if (input.poSignalCode) {
    hints.push(
      `CAUSE: consume latch ${input.poSignalCode} via __studioConsumePoSignal before proceed`
    );
  }
  if (input.diagnosticOpen) {
    hints.push(
      `CAUSE: playback diagnostic open — Ack/consume; do not click Play under modal${
        input.diagnosticMessage
          ? ` (${clip(input.diagnosticMessage, 72)})`
          : ""
      }`
    );
  }
  if (input.awaitingReply) {
    hints.push("CAUSE: PENDING — wait for PO Message/Send (or typing extends timeout)");
  }
  if (input.userTyping) {
    hints.push("STATE: PO typing in Message — do not refresh/continue");
  }
  if (input.capturePaused) {
    hints.push("STATE: QA Pause — Play/progress halted until Resume + latch cleared");
  }
  if (input.mcpPhase === "error") {
    hints.push("CAUSE: MCP ERROR diode — sitrep before acting");
  }
  return hints.slice(0, 6);
}

function clip(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export function readQaMessageDraft(): string {
  try {
    if (typeof sessionStorage === "undefined") return "";
    return sessionStorage.getItem(QA_MESSAGE_DRAFT_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeQaMessageDraft(text: string): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    const t = text ?? "";
    if (!t) {
      sessionStorage.removeItem(QA_MESSAGE_DRAFT_KEY);
      return;
    }
    sessionStorage.setItem(QA_MESSAGE_DRAFT_KEY, t.slice(0, 280));
  } catch {
    /* private mode */
  }
}

export function clearQaMessageDraft(): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.removeItem(QA_MESSAGE_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** True when QA should refuse further Play / SF / jump (paused, diag, or FAIL handoff). */
export function shouldBlockQaPlay(input: {
  overlayActive: boolean;
  capturePaused: boolean;
  diagnosticOpen: boolean;
  /** FAIL handoff / progress freeze — zero advance until confirm. */
  progressFrozen?: boolean;
}): boolean {
  if (!input.overlayActive) return false;
  return (
    input.capturePaused ||
    input.diagnosticOpen ||
    input.progressFrozen === true
  );
}

/**
 * App / MCP transport gate — refuse Play/SF while diagnostic or FAIL freeze.
 * QA Pause alone auto-resumes capture (PO: never "Play ignored — QA Pause" after Reset).
 * Returns true when transport was blocked (caller must return early).
 *
 * Prove/MCP smokes: clear orphan freeze/handoff/capture-pause when Studio state
 * has no open diagnostic — prevents silent SF no-op → transport-no-progress /
 * step-forward-unavailable (bubble handoff / sticky diagnosticBlocking).
 */
export function refusePlayIfQaBlocks(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const w = window as Window & {
      __studioAgentTestingOverlay?: {
        shouldBlockPlay?: () => boolean;
        autoResumeCaptureForPlay?: () => boolean;
        isDiagnosticOpen?: () => boolean;
        isDiagnosticBlocking?: () => boolean;
        clearPlaybackBlocksForReset?: (source?: string) => void;
      };
      __studioNoteBlockedQaPlay?: () => void;
      __studioIsQaProgressFrozen?: () => boolean;
      __studioClearQaPlaybackBlocksForReset?: (source?: string) => void;
      __protoStudioState?: () => { diagnosticOpen?: boolean } | undefined;
    };
    // Pause-only: lift capture so Play/SF proceed without a Resume click.
    w.__studioAgentTestingOverlay?.autoResumeCaptureForPlay?.();

    const frozen =
      w.__studioIsQaProgressFrozen?.() === true || isQaProgressFrozen();
    const studioDiag = w.__protoStudioState?.()?.diagnosticOpen === true;
    const overlayDiag =
      w.__studioAgentTestingOverlay?.isDiagnosticOpen?.() === true ||
      w.__studioAgentTestingOverlay?.isDiagnosticBlocking?.() === true;

    if (isQaProveModeActive() && (frozen || overlayDiag) && !studioDiag) {
      try {
        (
          w.__studioClearQaPlaybackBlocksForReset ??
          w.__studioAgentTestingOverlay?.clearPlaybackBlocksForReset
        )?.("prove-orphan-freeze");
      } catch {
        try {
          clearQaProgressFreeze();
          clearFailHandoff();
        } catch {
          /* hang-safe */
        }
      }
      try {
        w.__studioAgentTestingOverlay?.autoResumeCaptureForPlay?.();
      } catch {
        /* hang-safe */
      }
    }

    const stillFrozen =
      w.__studioIsQaProgressFrozen?.() === true || isQaProgressFrozen();
    if (stillFrozen) {
      w.__studioNoteBlockedQaPlay?.();
      return true;
    }
    const blocked =
      w.__studioAgentTestingOverlay?.shouldBlockPlay?.() === true;
    if (!blocked) return false;
    w.__studioNoteBlockedQaPlay?.();
    return true;
  } catch {
    return false;
  }
}
