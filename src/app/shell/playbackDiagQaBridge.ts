/**
 * Lean bridge: PLAYBACK_DIAG / PlaybackDiagnostic → QA ring + overlay.
 * One monitor path — agents read Save Log / ring; popup optional for PO eyes.
 */

import { appendQaDiagRing, isQaDiagGateOpen } from "@/app/shell/qaDiagGate";
import type { PlaybackDiagEvent } from "@/app/shell/playbackDiag";
import type { PlaybackDiagnosticError } from "@/app/shell/playbackDiagnostic";

export type PlaybackDiagQaOutcome = "ok" | "soft-fail" | "fail";

export type ConsumedPlaybackDiagnostic = {
  consumed: boolean;
  atIso: string;
  kind?: string;
  message?: string;
  beatId?: string;
  failureStep?: string;
  detail?: string;
  /** true when modal dismiss was requested */
  dismissed: boolean;
};

type OverlayLogApi = {
  logStep?: (input: {
    label?: string;
    outcome?: PlaybackDiagQaOutcome;
    kind?: string;
  }) => void;
};

let lastDiagnostic: {
  atMs: number;
  error: {
    message: string;
    kind?: string;
    beatId?: string;
    failureStep?: string;
    detail?: string;
  };
} | null = null;

type DismissFn = (source: string) => void;
let registeredDismiss: DismissFn | null = null;

/** App registers modal clear (setPlaybackDiagnostic(null) + flash dismiss). */
export function registerPlaybackDiagnosticDismiss(fn: DismissFn | null): void {
  registeredDismiss = fn;
}

function overlayApi(): OverlayLogApi | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window as Window & { __studioAgentTestingOverlay?: OverlayLogApi }
  ).__studioAgentTestingOverlay;
}

function clip(s: string, n = 120): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** Which PLAYBACK_DIAG events deserve a visible QA row (lean — not every rAF). */
export function shouldMirrorPlaybackDiagToQa(event: PlaybackDiagEvent): boolean {
  const kind = event.kind;
  if (kind === "click" && event.clickOk === false) return true;
  if (kind === "skip" || kind === "type-in-skip") return true;
  if (kind === "cursor" && event.cursor?.onTarget === false) {
    // Only hard off-target / click-suppressed — not routine travel/remove parks
    return /OFF-TARGET|off-target|click suppressed|hotspot miss/i.test(
      event.detail ?? ""
    );
  }
  if (kind === "scroll") {
    const before = event.scroll?.beforeTop;
    const after = event.scroll?.afterTop;
    if (
      typeof before === "number" &&
      typeof after === "number" &&
      after < before - 48 &&
      !event.scroll?.retreat
    ) {
      return true; // unexpected upward / reversal
    }
    if (/SCROLL_ISSUE|reversal|stutter|unexpected/i.test(event.detail ?? "")) {
      return true;
    }
    return false;
  }
  if (
    kind === "transport" ||
    kind === "step-forward" ||
    kind === "step-back"
  ) {
    // Lean: monitor/error family only — not every SF beat
    return (
      event.ok === false ||
      /fail|warn|error|no-op|blocked|stall|mismatch|clear|unexpected/i.test(
        event.detail ?? ""
      )
    );
  }
  if (kind === "play-end" || kind === "journey-reset") {
    return true;
  }
  if (kind === "info" && /diag|fail|warn|error|clear/i.test(event.detail ?? "")) {
    return true;
  }
  return false;
}

export function outcomeForPlaybackDiagEvent(
  event: PlaybackDiagEvent
): PlaybackDiagQaOutcome {
  if (event.clickOk === false) return "fail";
  if (event.ok === false) return "fail";
  if (event.cursor?.onTarget === false) {
    if (
      /OFF-TARGET|off-target|click suppressed|hotspot miss/i.test(
        event.detail ?? ""
      )
    ) {
      return "fail";
    }
  }
  if (event.kind === "skip" || event.kind === "type-in-skip") return "soft-fail";
  if (event.kind === "scroll") {
    const before = event.scroll?.beforeTop;
    const after = event.scroll?.afterTop;
    if (
      typeof before === "number" &&
      typeof after === "number" &&
      after < before - 48 &&
      !event.scroll?.retreat
    ) {
      return "soft-fail";
    }
    if (/SCROLL_ISSUE|fail|error/i.test(event.detail ?? "")) return "fail";
    if (/warn|unexpected|reversal|stutter/i.test(event.detail ?? "")) {
      return "soft-fail";
    }
  }
  if (/FAIL|error|OFF-TARGET/i.test(event.detail ?? "")) return "fail";
  if (/warn|clear|monitor/i.test(event.detail ?? "")) return "soft-fail";
  return "ok";
}

export function labelForPlaybackDiagEvent(event: PlaybackDiagEvent): string {
  const detail = (event.detail ?? "").trim();
  if (event.kind === "scroll") {
    const before = event.scroll?.beforeTop;
    const after = event.scroll?.afterTop;
    const delta =
      typeof before === "number" && typeof after === "number"
        ? Math.round(after - before)
        : null;
    const rev =
      delta != null && delta < -48 && !event.scroll?.retreat
        ? " · scroll-reversal"
        : "";
    return `playback-diag · scroll${rev}${detail ? ` — ${clip(detail, 80)}` : ""}${
      delta != null ? ` Δ=${delta}` : ""
    }`;
  }
  if (event.kind === "click") {
    return `playback-diag · click ${event.clickOk === false ? "FAIL" : "ok"}${
      detail ? ` — ${clip(detail, 80)}` : ""
    }`;
  }
  return `playback-diag · ${event.kind}${detail ? ` — ${clip(detail, 90)}` : ""}`;
}

/** Mirror a diag event into ring + overlay when gate open. */
export function mirrorPlaybackDiagToQa(event: PlaybackDiagEvent): void {
  if (!isQaDiagGateOpen()) return;
  if (!shouldMirrorPlaybackDiagToQa(event)) return;
  const label = labelForPlaybackDiagEvent(event);
  const outcome = outcomeForPlaybackDiagEvent(event);
  try {
    appendQaDiagRing({
      kind: "playback-diag",
      label,
      text: event.detail ?? event.kind,
      beatId: event.beatId,
      screenId: event.screenAfter ?? event.screenBefore,
      detail: event.kind,
    });
  } catch {
    /* hang-safe */
  }
  try {
    overlayApi()?.logStep?.({
      kind: "playback-diag",
      label,
      outcome,
    });
  } catch {
    /* hang-safe */
  }
}

/** Explicit clear — always monitor-colored when gate open. */
export function mirrorPlaybackDiagClearToQa(): void {
  if (!isQaDiagGateOpen()) return;
  const label = "playback-diag · clear";
  try {
    appendQaDiagRing({ kind: "playback-diag", label, text: "clear" });
  } catch {
    /* hang-safe */
  }
  try {
    overlayApi()?.logStep?.({
      kind: "playback-diag",
      label,
      outcome: "soft-fail",
    });
  } catch {
    /* hang-safe */
  }
}

/** Ingest PlaybackDiagnostic popup into QA (rich lean). */
export function ingestPlaybackDiagnosticToQa(
  error: PlaybackDiagnosticError
): void {
  const ctx = error.context ?? {};
  lastDiagnostic = {
    atMs: Date.now(),
    error: {
      message: error.message,
      kind: ctx.phase,
      beatId: ctx.beatId,
      failureStep: ctx.failureStep,
      detail: ctx.detail,
    },
  };
  const label = `playback-diag · DIAGNOSTIC — ${clip(error.message, 100)}`;
  try {
    appendQaDiagRing({
      kind: "playback-diag",
      label,
      text: error.message,
      beatId: ctx.beatId,
      detail: ctx.failureStep ?? ctx.phase,
    });
  } catch {
    /* hang-safe */
  }
  if (!isQaDiagGateOpen()) return;
  try {
    overlayApi()?.logStep?.({
      kind: "playback-diag",
      label,
      outcome: "fail",
    });
  } catch {
    /* hang-safe */
  }
}

export function peekPlaybackDiagnostic(): ConsumedPlaybackDiagnostic | null {
  if (!lastDiagnostic) return null;
  return {
    consumed: false,
    atIso: new Date(lastDiagnostic.atMs).toISOString(),
    kind: lastDiagnostic.error.kind,
    message: lastDiagnostic.error.message,
    beatId: lastDiagnostic.error.beatId,
    failureStep: lastDiagnostic.error.failureStep,
    detail: lastDiagnostic.error.detail,
    dismissed: false,
  };
}

/**
 * Agent helper — return last diagnostic + dismiss modal (keep Alarm latch via caller).
 * Does not rebuild a second monitor; empties popup after ingest.
 */
export function consumePlaybackDiagnostic(
  options?: { dismiss?: boolean; source?: string }
): ConsumedPlaybackDiagnostic {
  const dismiss = options?.dismiss !== false;
  const peek = peekPlaybackDiagnostic();
  if (!peek) {
    return {
      consumed: false,
      atIso: new Date().toISOString(),
      dismissed: false,
    };
  }
  let dismissed = false;
  if (dismiss) {
    try {
      registeredDismiss?.(options?.source ?? "consume");
      dismissed = true;
    } catch {
      /* hang-safe */
    }
  }
  lastDiagnostic = null;
  return { ...peek, consumed: true, dismissed };
}

export function installPlaybackDiagQaBridgeApis(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    __studioConsumePlaybackDiagnostic?: typeof consumePlaybackDiagnostic;
    __studioPeekPlaybackDiagnostic?: typeof peekPlaybackDiagnostic;
    __protoConsumePlaybackDiagnostic?: typeof consumePlaybackDiagnostic;
  };
  w.__studioConsumePlaybackDiagnostic = consumePlaybackDiagnostic;
  w.__studioPeekPlaybackDiagnostic = peekPlaybackDiagnostic;
  w.__protoConsumePlaybackDiagnostic = consumePlaybackDiagnostic;
}

export function uninstallPlaybackDiagQaBridgeApis(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    __studioConsumePlaybackDiagnostic?: unknown;
    __studioPeekPlaybackDiagnostic?: unknown;
    __protoConsumePlaybackDiagnostic?: unknown;
  };
  delete w.__studioConsumePlaybackDiagnostic;
  delete w.__studioPeekPlaybackDiagnostic;
  delete w.__protoConsumePlaybackDiagnostic;
}
