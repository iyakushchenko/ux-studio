import type { PlaybackDiagnosticError } from "@/app/shell/playbackDiagnostic";
import { logControlPanel } from "@/app/shell/controlPanelLog";
import { ingestPlaybackDiagnosticToQa } from "@/app/shell/playbackDiagQaBridge";

export type DiagnosticFlashRecord = {
  id: number;
  openedAtMs: number;
  closedAtMs?: number;
  durationMs?: number;
  kind?: string;
  message: string;
  beatId?: string;
  failureStep?: string;
  dismissedBy?: string;
};

const MAX_FLASHES = 12;
const flashes: DiagnosticFlashRecord[] = [];
let openFlash: DiagnosticFlashRecord | null = null;
let flashId = 0;

export function recordPlaybackDiagnosticOpen(
  error: PlaybackDiagnosticError,
  source = "playback-guard"
): DiagnosticFlashRecord {
  const record: DiagnosticFlashRecord = {
    id: ++flashId,
    openedAtMs: performance.now(),
    kind: error.context.phase,
    message: error.message,
    beatId: error.context.beatId,
    failureStep: error.context.failureStep,
  };
  openFlash = record;
  flashes.push(record);
  if (flashes.length > MAX_FLASHES) {
    flashes.splice(0, flashes.length - MAX_FLASHES);
  }
  logControlPanel("diagnostic:open", {
    source,
    kind: record.kind,
    message: record.message,
    beatId: record.beatId,
    failureStep: record.failureStep,
    detail: error.context.detail,
  });
  // Lean bridge — QA dump/ring is SSoT for agents; popup remains for PO eyes.
  try {
    ingestPlaybackDiagnosticToQa(error);
  } catch {
    /* hang-safe */
  }
  return record;
}

export function recordPlaybackDiagnosticDismiss(source = "user"): void {
  if (!openFlash) return;
  const closedAtMs = performance.now();
  openFlash.closedAtMs = closedAtMs;
  openFlash.durationMs = Math.round(closedAtMs - openFlash.openedAtMs);
  openFlash.dismissedBy = source;
  logControlPanel("diagnostic:dismiss", {
    source,
    kind: openFlash.kind,
    message: openFlash.message,
    beatId: openFlash.beatId,
    durationMs: openFlash.durationMs,
    flash: openFlash.durationMs != null && openFlash.durationMs < 500,
  });
  openFlash = null;
}

export function getRecentDiagnosticFlashes(limit = 8): DiagnosticFlashRecord[] {
  return flashes.slice(-limit);
}

export function getOpenDiagnosticFlash(): DiagnosticFlashRecord | null {
  return openFlash;
}

declare global {
  interface Window {
    __protoDiagnosticFlashes?: () => DiagnosticFlashRecord[];
  }
}
