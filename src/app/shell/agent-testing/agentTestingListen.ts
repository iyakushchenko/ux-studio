/**
 * QA “listen” helpers — draft, typing wait, transport block, priority hints.
 * Overlay owns pause/latch; this module stays hang-safe + lean.
 */

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
 */
export function refusePlayIfQaBlocks(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const w = window as Window & {
      __studioAgentTestingOverlay?: {
        shouldBlockPlay?: () => boolean;
        autoResumeCaptureForPlay?: () => boolean;
      };
      __studioNoteBlockedQaPlay?: () => void;
      __studioIsQaProgressFrozen?: () => boolean;
    };
    const frozen = w.__studioIsQaProgressFrozen?.() === true;
    if (frozen) {
      w.__studioNoteBlockedQaPlay?.();
      return true;
    }
    // Pause-only: lift capture so Play/SF proceed without a Resume click.
    w.__studioAgentTestingOverlay?.autoResumeCaptureForPlay?.();
    const blocked =
      w.__studioAgentTestingOverlay?.shouldBlockPlay?.() === true;
    if (!blocked) return false;
    w.__studioNoteBlockedQaPlay?.();
    return true;
  } catch {
    return false;
  }
}
