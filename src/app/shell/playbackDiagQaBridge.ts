/**
 * Lean bridge: PLAYBACK_DIAG / PlaybackDiagnostic → QA ring + overlay chat.
 * One chronological sequence in the main QA log — human-readable, not a cryptic side pane.
 */

import type { PlaybackDiagnosticError } from "@/app/shell/playbackDiagnostic";
import { getOpenDiagnosticFlash } from "@/app/shell/playbackDiagnosticFlash";
import { appendQaDiagRing, isQaDiagGateOpen } from "@/app/shell/qaDiagGate";
import type { PlaybackDiagEvent } from "@/app/shell/playbackDiag";
import {
  isAgentTestingFinaleSealed,
  isQuietDiagDismissSource,
} from "@/app/shell/agent-testing/agentTestingFinaleSeal";

/** Align with QA chat row outcomes — ok = neutral info, not warn/fail paint. */
export type PlaybackDiagQaOutcome = "ok" | "soft-fail" | "fail" | "pass";

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

let suppressDiagnosticUntil = 0;

/** Brief suppress after session wipe so cancelScroll/reset cannot re-open modal. */
export function suppressPlaybackDiagnosticBriefly(ms = 900): void {
  suppressDiagnosticUntil = Date.now() + Math.max(0, ms);
}

export function isPlaybackDiagnosticSuppressed(): boolean {
  return Date.now() < suppressDiagnosticUntil;
}

type DismissFn = (source: string) => void;
let registeredDismiss: DismissFn | null = null;

type ForceClearFn = () => void;
let registeredForceClear: ForceClearFn | null = null;

type DiagnosticOpenFn = (error: PlaybackDiagnosticError) => void;
let registeredDiagnosticOpen: DiagnosticOpenFn | null = null;

/** App registers modal clear (setPlaybackDiagnostic(null) + flash dismiss). */
export function registerPlaybackDiagnosticDismiss(fn: DismissFn | null): void {
  registeredDismiss = fn;
}

/** App registers hard setPlaybackDiagnostic(null) — no Alarm latch. */
export function registerPlaybackDiagnosticForceClear(
  fn: ForceClearFn | null
): void {
  registeredForceClear = fn;
}

/** QA overlay: pause + latch when diagnostic popup opens. */
export function registerQaDiagnosticOpenHandler(
  fn: DiagnosticOpenFn | null
): void {
  registeredDiagnosticOpen = fn;
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

function detailOf(event: PlaybackDiagEvent): string {
  return (event.detail ?? "").trim();
}

function isScrollReversal(event: PlaybackDiagEvent): boolean {
  const detail = detailOf(event);
  // Target-driven intoView / session skips are camera doing its job — not a yank.
  // Blind `scrollCameraToOrigin` host-top during play still soft-fails (symptom of
  // competing snaps); intentional force baselines are rare at play-end rewind.
  if (/scrollIntoView|skipped \(camera session\)|skipped \(hold\/ease\)/i.test(detail)) {
    return false;
  }
  const before = event.scroll?.beforeTop;
  const after = event.scroll?.afterTop;
  return (
    typeof before === "number" &&
    typeof after === "number" &&
    after < before - 48 &&
    !event.scroll?.retreat
  );
}

function isBubbleChopOrJump(event: PlaybackDiagEvent): boolean {
  if (event.bubble?.jump || event.bubble?.chop) return true;
  return /JUMP|CHOP|bubble-jump|bubble-chop/i.test(detailOf(event));
}

/**
 * Which PLAYBACK_DIAG events deserve a visible QA chat row (lean — not every rAF).
 * Mirrored: FAIL / JUMP / CHOP / script-timeout / scroll-reversal / alarms /
 * type-in start|end|skip / play-end / journey-reset / hub-nav / click miss /
 * cursor off-target / transport errors.
 * Suppressed: type-in-progress, TRACE/frame bubble samples, routine cursor
 * park/remove/abort chatter, healthy step-forward, camera origin nudges.
 */
export function shouldMirrorPlaybackDiagToQa(event: PlaybackDiagEvent): boolean {
  const kind = event.kind;
  const detail = detailOf(event);

  // HARD (PO): never mirror per-char type-in progress. Start/end OK (≤1 each).
  if (kind === "type-in-progress") return false;
  if (kind === "type-in-start" || kind === "type-in-end") return true;
  if (kind === "type-in-skip" || kind === "skip") return true;

  if (kind === "click" && event.clickOk === false) return true;

  if (kind === "cursor") {
    // Only hard off-target / hidden-during-type-in / click-suppressed — not remove/park spam
    if (event.cursor?.onTarget === false) {
      return /OFF-TARGET|off-target|click suppressed|hotspot miss/i.test(detail);
    }
    return /HIDDEN|cursor-hidden|FAIL|OFF-TARGET|click suppressed/i.test(detail);
  }

  if (kind === "scroll") {
    if (isScrollReversal(event)) return true;
    if (
      /SCROLL_ISSUE|reversal|stutter|unexpected|JUMP|competing|interrupted|script-timeout/i.test(
        detail
      )
    ) {
      return true;
    }
    return false;
  }

  if (kind === "chat-bubble-motion" || kind === "chat-reveal" || kind === "info") {
    if (isBubbleChopOrJump(event)) return true;
    if (
      /JUMP|CHOP|stutter|competing|layoutY|fight|script-timeout|FAIL|Alarm|ERROR/i.test(
        detail
      )
    ) {
      return true;
    }
    // Routine TRACE / frame / co-travel — dump only
    if (kind === "chat-bubble-motion") {
      const phase = event.bubble?.phase;
      if (phase === "frame" || phase === "trace") return false;
    }
    if (kind === "info" && /diag|fail|warn|error|clear|po-signal/i.test(detail)) {
      return true;
    }
    return false;
  }

  if (
    kind === "transport" ||
    kind === "step-forward" ||
    kind === "step-back"
  ) {
    return (
      event.ok === false ||
      /fail|warn|error|no-op|blocked|stall|mismatch|clear|unexpected|script-timeout/i.test(
        detail
      )
    );
  }

  if (kind === "play-end" || kind === "journey-reset" || kind === "hub-nav") {
    return true;
  }

  return false;
}

export function outcomeForPlaybackDiagEvent(
  event: PlaybackDiagEvent
): PlaybackDiagQaOutcome {
  // Routine milestones — neutral info (never warn/fail paint).
  if (
    event.kind === "journey-reset" ||
    event.kind === "play-end" ||
    event.kind === "type-in-start"
  ) {
    return "ok";
  }
  if (event.kind === "type-in-end") {
    return event.typeOk === false ? "fail" : "ok";
  }
  if (event.clickOk === false) return "fail";
  if (event.ok === false) return "fail";
  if (isBubbleChopOrJump(event)) return "fail";
  if (event.cursor?.onTarget === false) {
    if (
      /OFF-TARGET|off-target|click suppressed|hotspot miss/i.test(
        detailOf(event)
      )
    ) {
      return "fail";
    }
  }
  if (event.kind === "skip" || event.kind === "type-in-skip") return "soft-fail";
  if (event.kind === "hub-nav") return "fail";
  if (event.kind === "scroll") {
    if (isScrollReversal(event)) return "soft-fail";
    if (/SCROLL_ISSUE|fail|error|script-timeout/i.test(detailOf(event))) {
      return "fail";
    }
    if (/warn|unexpected|reversal|stutter/i.test(detailOf(event))) {
      return "soft-fail";
    }
    return "ok";
  }
  if (event.kind === "cursor") {
    // Cleared / parked / abort = info; hard miss already handled above.
    return "ok";
  }
  if (/FAIL|error|OFF-TARGET|script-timeout|CHOP|JUMP/i.test(detailOf(event))) {
    return "fail";
  }
  // Soft attention only — not routine clear / po-signal chatter as "warn red-ish".
  if (/warn|unexpected|monitor/i.test(detailOf(event))) return "soft-fail";
  if (/po-signal/i.test(detailOf(event))) return "soft-fail";
  return "ok";
}

/**
 * Plain-language QA chat label. Machine kind stays on ring `detail` / data attrs.
 */
export function labelForPlaybackDiagEvent(event: PlaybackDiagEvent): string {
  const detail = detailOf(event);
  const kind = event.kind;

  if (kind === "type-in-start") return "Typing started";
  if (kind === "type-in-end") {
    return event.typeOk === false ? "Typing finished — FAIL" : "Typing finished";
  }
  if (kind === "type-in-skip") {
    return `Typing skipped${detail ? ` — ${clip(detail, 60)}` : ""}`;
  }
  if (kind === "skip") {
    return `Step skipped${detail ? ` — ${clip(detail, 60)}` : ""}`;
  }

  if (kind === "click") {
    return event.clickOk === false
      ? `Click missed${detail ? ` — ${clip(detail, 70)}` : ""}`
      : `Click ok${detail ? ` — ${clip(detail, 70)}` : ""}`;
  }

  if (kind === "cursor") {
    if (/type-in-park|type-in park/i.test(detail)) {
      return "Cursor parked for typing";
    }
    if (/HIDDEN|cursor-hidden/i.test(detail)) {
      return "Cursor hidden during typing — FAIL";
    }
    if (/OFF-TARGET|off-target|hotspot miss/i.test(detail)) {
      return "Cursor missed the target";
    }
    if (/click suppressed/i.test(detail)) {
      return "Click blocked — cursor off target";
    }
    if (/^remove\b|cursor remove|\bremove$/i.test(detail)) {
      return "Cursor cleared";
    }
    if (/PARKED|park/i.test(detail)) {
      return "Cursor parked";
    }
    if (/abort/i.test(detail)) {
      return "Cursor travel cancelled";
    }
    return `Cursor — ${clip(detail || "update", 70)}`;
  }

  if (kind === "scroll") {
    if (isScrollReversal(event) || /reversal/i.test(detail)) {
      const before = event.scroll?.beforeTop;
      const after = event.scroll?.afterTop;
      const delta =
        typeof before === "number" && typeof after === "number"
          ? Math.round(after - before)
          : null;
      return `Scroll jumped the wrong way${delta != null ? ` (Δ${delta})` : ""}`;
    }
    if (/SCROLL_ISSUE/i.test(detail)) {
      return `Scroll problem — ${clip(detail, 70)}`;
    }
    if (/interrupted/i.test(detail)) {
      return "Scroll was interrupted";
    }
    return `Scroll — ${clip(detail || "moved", 70)}`;
  }

  if (kind === "chat-bubble-motion" || kind === "chat-reveal") {
    if (event.bubble?.chop || /CHOP|chop/i.test(detail)) {
      return "Chat bubble motion cut short";
    }
    if (event.bubble?.jump || /JUMP|jump/i.test(detail)) {
      return "Chat bubble jumped";
    }
    return `Chat motion — ${clip(detail || kind, 70)}`;
  }

  if (kind === "play-end") return "Play finished — back at journey start";
  if (kind === "journey-reset") return "Journey reset to start";
  if (kind === "hub-nav") {
    return `Unexpected hub navigation${detail ? ` — ${clip(detail, 60)}` : ""}`;
  }

  if (kind === "transport" || kind === "step-forward" || kind === "step-back") {
    if (/script-timeout/i.test(detail)) return "Script timed out";
    if (event.ok === false || /fail|error|blocked|stall/i.test(detail)) {
      return `Playback issue — ${clip(detail || kind, 70)}`;
    }
    return clip(detail || kind, 90);
  }

  if (kind === "info") {
    if (/script-timeout/i.test(detail)) return "Script timed out";
    if (/po-signal/i.test(detail)) {
      return `PO signal — ${clip(detail.replace(/^po-signal\s*/i, ""), 70)}`;
    }
    if (/clear/i.test(detail)) return "Playback diagnostics cleared";
    return clip(detail || "Info", 90);
  }

  return clip(detail || kind, 90);
}

/** Mirror a diag event into ring + overlay chat when gate open. */
let lastMirroredJourneyResetAt = 0;
const JOURNEY_RESET_DEDUPE_MS = 800;

export function mirrorPlaybackDiagToQa(event: PlaybackDiagEvent): void {
  if (!isQaDiagGateOpen()) return;
  if (isAgentTestingFinaleSealed()) return;
  if (!shouldMirrorPlaybackDiagToQa(event)) return;

  // Dedupe double journey-reset rows at play-end (play-end + 2× journey-reset).
  if (event.kind === "journey-reset") {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - lastMirroredJourneyResetAt < JOURNEY_RESET_DEDUPE_MS) {
      return;
    }
    lastMirroredJourneyResetAt = now;
  }

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
  if (isAgentTestingFinaleSealed()) return;
  const label = "Playback diagnostics cleared";
  try {
    appendQaDiagRing({ kind: "playback-diag", label, text: "clear" });
  } catch {
    /* hang-safe */
  }
  try {
    overlayApi()?.logStep?.({
      kind: "playback-diag",
      label,
      outcome: "ok",
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
  const phase = ctx.phase ?? "";
  const label =
    phase === "script-timeout"
      ? `Script timed out — ${clip(error.message, 80)}`
      : `Playback diagnostic — ${clip(error.message, 100)}`;
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
  if (isQaDiagGateOpen()) {
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
  // Always notify QA listen handler (pause/latch) when registered.
  try {
    registeredDiagnosticOpen?.(error);
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

/**
 * Quiet clear — session end / self-test / prove-wave wipe.
 * Dismisses popup without Alarm latch. Never leave modal blocking after jobs.
 * Hard-clears React state even when AnimatePresence / race left DOM painted.
 */
export function clearStalePlaybackDiagnostic(
  source = "qa-session-end"
): boolean {
  let openDom = false;
  try {
    openDom =
      typeof document !== "undefined" &&
      document.querySelector(".studio-playback-diagnostic") != null;
  } catch {
    openDom = false;
  }
  let openFlash = false;
  try {
    openFlash = Boolean(getOpenDiagnosticFlash());
  } catch {
    openFlash = false;
  }
  const had = Boolean(lastDiagnostic) || openFlash || openDom;
  try {
    registeredDismiss?.(source);
  } catch {
    /* hang-safe */
  }
  try {
    registeredForceClear?.();
  } catch {
    /* hang-safe */
  }
  // MCP harness quiet dismiss (DOM-gated) — second belt if React lagging.
  try {
    (
      window as Window & {
        __protoDismissPlaybackDiagnostic?: () => boolean;
      }
    ).__protoDismissPlaybackDiagnostic?.();
  } catch {
    /* hang-safe */
  }
  lastDiagnostic = null;
  suppressPlaybackDiagnosticBriefly(900);
  const quiet =
    isQuietDiagDismissSource(source) || isAgentTestingFinaleSealed();
  if (had && !quiet) {
    try {
      appendQaDiagRing({
        kind: "playback-diag",
        label: `Diagnostic auto-dismissed (${source})`,
        text: source,
      });
    } catch {
      /* hang-safe */
    }
  }
  if (had) {
    try {
      console.info("[AGENT_TESTING] stale playback diagnostic cleared", source);
    } catch {
      /* ignore */
    }
  }
  return had;
}

/** True when diagnostic popup / flash is still open (leak detector). */
export function isPlaybackDiagnosticModalOpen(): boolean {
  try {
    if (getOpenDiagnosticFlash()) return true;
  } catch {
    /* ignore */
  }
  try {
    return (
      typeof document !== "undefined" &&
      document.querySelector(".studio-playback-diagnostic") != null
    );
  } catch {
    return false;
  }
}

export function installPlaybackDiagQaBridgeApis(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    __studioConsumePlaybackDiagnostic?: typeof consumePlaybackDiagnostic;
    __studioPeekPlaybackDiagnostic?: typeof peekPlaybackDiagnostic;
    __studioClearStalePlaybackDiagnostic?: typeof clearStalePlaybackDiagnostic;
    __studioIsPlaybackDiagnosticOpen?: typeof isPlaybackDiagnosticModalOpen;
    __protoConsumePlaybackDiagnostic?: typeof consumePlaybackDiagnostic;
  };
  w.__studioConsumePlaybackDiagnostic = consumePlaybackDiagnostic;
  w.__studioPeekPlaybackDiagnostic = peekPlaybackDiagnostic;
  w.__studioClearStalePlaybackDiagnostic = clearStalePlaybackDiagnostic;
  w.__studioIsPlaybackDiagnosticOpen = isPlaybackDiagnosticModalOpen;
  w.__protoConsumePlaybackDiagnostic = consumePlaybackDiagnostic;
}

export function uninstallPlaybackDiagQaBridgeApis(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    __studioConsumePlaybackDiagnostic?: unknown;
    __studioPeekPlaybackDiagnostic?: unknown;
    __studioClearStalePlaybackDiagnostic?: unknown;
    __studioIsPlaybackDiagnosticOpen?: unknown;
    __protoConsumePlaybackDiagnostic?: unknown;
  };
  delete w.__studioConsumePlaybackDiagnostic;
  delete w.__studioPeekPlaybackDiagnostic;
  delete w.__studioClearStalePlaybackDiagnostic;
  delete w.__studioIsPlaybackDiagnosticOpen;
  delete w.__protoConsumePlaybackDiagnostic;
}
