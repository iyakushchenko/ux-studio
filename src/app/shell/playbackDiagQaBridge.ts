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

/** Intentional host-top resets — never “jumped the wrong way” in QA. */
function isIntentionalScrollOrigin(detail: string): boolean {
  if (!/scrollCameraToOrigin/i.test(detail)) return false;
  // Require an explicit reason — bare named-SSoT mid-play snaps can still soft-fail.
  return /jump-to-start|resetPrototypeScroll|page-land|play-end|journey-reset|book-step-\d+-first-mount/i.test(
    detail
  );
}

function isScrollReversal(event: PlaybackDiagEvent): boolean {
  const detail = detailOf(event);
  // Target-driven intoView / session skips are camera doing its job — not a yank.
  if (
    /scrollIntoView|skipped \(camera session\)|skipped \(hold\/ease\)/i.test(
      detail
    )
  ) {
    return false;
  }
  // Named SSoT host-top (jump-to-start / screen land) is expected — not a reversal.
  if (isIntentionalScrollOrigin(detail)) {
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
  // Word-boundary — do not treat reason tags like `jump-to-start` as bubble JUMP.
  if (/jump-to-start/i.test(detailOf(event))) return false;
  return /\bJUMP\b|\bCHOP\b|bubble-jump|bubble-chop/i.test(detailOf(event));
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
    // Hard problems + lean cursor-engine trackers (not remove/routine park spam)
    if (event.cursor?.onTarget === false) {
      return /OFF-TARGET|off-target|click suppressed|hotspot miss/i.test(detail);
    }
    if (/ABRUPT-PARK|cursor-engine:abrupt-park/i.test(detail)) return true;
    if (/GRAPHIC-THRASH|cursor-engine:graphic-thrash/i.test(detail)) return true;
    if (/HIDDEN|cursor-hidden|FAIL|OFF-TARGET|click suppressed/i.test(detail)) {
      return true;
    }
    // Suppress force-seed / routine park spam (refresh remount, resize, type-in seed).
    if (
      /cursor-engine:park-force\b/i.test(detail) ||
      /reason:\s*(resize|idempotent-remount|cjm-restart|journey-mode-on|type-in-park|observe-stop|journey-end-revive)\b/i.test(
        detail
      )
    ) {
      return false;
    }
    // Play-end / jump-to-start rest is expected — do not paint as attention.
    if (
      /cursor-engine:park-rest\b/i.test(detail) &&
      /jump-to-start|play-end|journey-end|journey-park/i.test(detail)
    ) {
      return false;
    }
    // Lean engine milestones (deduped at emit) — meaningful park / step-play / submit / graphic
    if (
      /^cursor-engine:(park-rest|type-in-hold|cancel-settle|park-on-step|stay-on-play|park-from-submit|graphic-arrow|graphic-hand|graphic-carriage)\b/i.test(
        detail
      )
    ) {
      return true;
    }
    if (/REST-ON-SUBMIT|cursor-engine:rest-on-submit/i.test(detail)) return true;
    return false;
  }

  if (kind === "scroll") {
    // Intentional host-top — dump-only (never soft-fail “wrong way”).
    if (isIntentionalScrollOrigin(detail)) return false;
    if (isScrollReversal(event)) return true;
    // Routine camera dwell — dump-only (PO: chat spam before every click).
    if (
      /^chat-camera:wait\b/i.test(detail) &&
      /kind:camera dwell|camera dwell/i.test(detail)
    ) {
      return false;
    }
    if (/^chat-camera:wait\b/i.test(detail)) return false;
    // Lean camera trackers — thinking / target / skip signals only.
    if (/^chat-camera:(thinking|pin-bottom|host-end|target|skip-)/i.test(detail)) {
      return true;
    }
    if (/^chat-camera:/i.test(detail)) return false;
    if (
      /SCROLL_ISSUE|reversal|stutter|unexpected|JUMP|competing|interrupted|script-timeout/i.test(
        detail
      )
    ) {
      return true;
    }
    return false;
  }

  if (kind === "info") {
    if (/camera-beat:target-unusable/i.test(detail)) return true;
    if (/script-timeout/i.test(detail)) return true;
    if (/diag|fail|warn|error|clear|po-signal/i.test(detail)) {
      return true;
    }
    return false;
  }

  if (
    kind === "chat-bubble-motion" ||
    kind === "chat-reveal"
  ) {
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

  // REC lean milestones — camera waits, clicks, screen changes (not flood).
  if (kind === "rec-capture") {
    if (/scroll-stop/i.test(detail) || event.beatKind === "scroll-stop") {
      return true;
    }
    if (/^scroll\s*→/i.test(detail) || event.beatKind === "scroll") {
      return true;
    }
    if (/^demo-click\b/i.test(detail) || event.beatKind === "demo-click") {
      return true;
    }
    if (/^screen\b/i.test(detail) || event.beatKind === "screen") {
      return true;
    }
    if (
      event.clickOk === false ||
      /no-selector|weak|chrome-target|miss|unusable/i.test(detail)
    ) {
      return true;
    }
    return false;
  }
  if (kind === "rec-compile") return true;

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
  if (
    event.kind === "info" &&
    /camera-beat:target-unusable/i.test(detailOf(event))
  ) {
    return "soft-fail";
  }
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
    if (
      /ABRUPT-PARK|cursor-engine:abrupt-park|REST-ON-SUBMIT|cursor-engine:rest-on-submit|GRAPHIC-THRASH|cursor-engine:graphic-thrash|HIDDEN|cursor-hidden/i.test(
        detailOf(event)
      )
    ) {
      return "fail";
    }
    // Cleared / parked / abort / engine milestones = info
    return "ok";
  }
  // Word-boundary JUMP — do not match reason tags like `jump-to-start`.
  if (
    /\bFAIL\b|\berror\b|OFF-TARGET|script-timeout|\bCHOP\b|\bJUMP\b/i.test(
      detailOf(event)
    ) &&
    !/jump-to-start/i.test(detailOf(event))
  ) {
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
    if (/camera-beat:target-unusable/i.test(detail)) {
      return "Camera target missing — wait only";
    }
    return `Step skipped${detail ? ` — ${clip(detail, 60)}` : ""}`;
  }

  if (kind === "click") {
    return event.clickOk === false
      ? `Click missed${detail ? ` — ${clip(detail, 70)}` : ""}`
      : `Click ok${detail ? ` — ${clip(detail, 70)}` : ""}`;
  }

  if (kind === "cursor") {
    if (/ABRUPT-PARK|cursor-engine:abrupt-park/i.test(detail)) {
      return "ABRUPT PARK — cursor teleported (FAIL)";
    }
    if (/GRAPHIC-THRASH|cursor-engine:graphic-thrash/i.test(detail)) {
      return "Cursor graphic thrash — FAIL (steady binary)";
    }
    if (/REST-ON-SUBMIT|cursor-engine:rest-on-submit/i.test(detail)) {
      return "Cursor left on submit — FAIL";
    }
    if (/cursor-engine:graphic-carriage\b/i.test(detail)) {
      return "Cursor → carriage (text)";
    }
    if (/cursor-engine:graphic-hand\b/i.test(detail)) {
      return "Cursor → hand";
    }
    if (/cursor-engine:graphic-arrow\b/i.test(detail)) {
      return "Cursor → arrow";
    }
    if (/type-in-park|type-in park|cursor-engine:type-in-hold/i.test(detail)) {
      return "Cursor held for typing";
    }
    if (/cursor-engine:park-from-submit/i.test(detail)) {
      return "Cursor parked away from submit";
    }
    if (/cursor-engine:park-on-step/i.test(detail)) {
      return "Cursor parked after step";
    }
    if (/cursor-engine:stay-on-play/i.test(detail)) {
      return "Cursor stayed at last click (Play)";
    }
    if (/cursor-engine:park-rest/i.test(detail)) {
      if (/jump-to-start|play-end|journey-end/i.test(detail)) {
        return "Cursor parked (play-end)";
      }
      return "Cursor eased to rest";
    }
    if (/cursor-engine:park-force/i.test(detail)) {
      return "Cursor seed (force)";
    }
    if (/cursor-engine:cancel-settle/i.test(detail)) {
      return "Cursor travel cancelled — settled";
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
      return "Cursor park";
    }
    if (/abort/i.test(detail)) {
      return "Cursor travel cancelled";
    }
    return `Cursor — ${clip(detail || "update", 70)}`;
  }

  if (kind === "scroll") {
    // Generic camera dwell (traditional + agentic) — do not say “Chat”.
    if (
      /^chat-camera:wait\b/i.test(detail) &&
      /kind:camera dwell|camera dwell/i.test(detail)
    ) {
      return "Camera: wait";
    }
    if (/^chat-camera:wait\b/i.test(detail)) return "Camera: wait";
    if (/^chat-camera:thinking\b/i.test(detail)) {
      return "Chat scroll to thinking";
    }
    if (/^chat-camera:pin-bottom\b/i.test(detail)) return "Chat pin bottom";
    if (/^chat-camera:host-end\b/i.test(detail)) return "Chat host-end";
    if (/^chat-camera:target\b/i.test(detail)) return "Camera: target";
    if (/^chat-camera:skip-dwell\b/i.test(detail)) {
      return "Camera: wait (settle skipped)";
    }
    if (/^chat-camera:skip-ease\b/i.test(detail)) {
      return "Camera: ease in flight";
    }
    if (isIntentionalScrollOrigin(detail)) {
      return "Camera reset to top";
    }
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
    if (/camera-beat:target-unusable/i.test(detail)) {
      return "Camera target missing — wait only";
    }
    if (/script-timeout/i.test(detail)) return "Script timed out";
    if (/po-signal/i.test(detail)) {
      return `PO signal — ${clip(detail.replace(/^po-signal\s*/i, ""), 70)}`;
    }
    if (/clear/i.test(detail)) return "Playback diagnostics cleared";
    return clip(detail || "Info", 90);
  }

  if (kind === "rec-capture") {
    if (/scroll-stop/i.test(detail) || event.beatKind === "scroll-stop") {
      const ms = detail.match(/scroll-stop\s+(\d+)\s*ms/i)?.[1];
      return ms
        ? `Camera wait after scroll (${ms}ms)`
        : "Camera wait after scroll";
    }
    if (/^scroll\s*→/i.test(detail) || event.beatKind === "scroll") {
      const target = detail.replace(/^scroll\s*→\s*/i, "").trim();
      return `Camera move — ${clip(target, 60)}`;
    }
    if (/^demo-click\b/i.test(detail) || event.beatKind === "demo-click") {
      const rest = detail.replace(/^demo-click\s*(WEAK\s*)?/i, "").trim();
      return `REC click — ${clip(rest, 60)}`;
    }
    if (/^screen\b/i.test(detail) || event.beatKind === "screen") {
      return `REC screen — ${clip(detail, 60)}`;
    }
    if (
      event.clickOk === false ||
      /no-selector|weak|chrome-target|miss|unusable/i.test(detail)
    ) {
      return `REC click weak — ${clip(detail || "unusable selector", 70)}`;
    }
    return clip(detail || "REC capture", 90);
  }
  if (kind === "rec-compile") {
    return `REC compiled — ${clip(detail || "journey beats", 80)}`;
  }

  return clip(detail || kind, 90);
}

/** Mirror a diag event into ring + overlay chat when gate open. */
let lastMirroredJourneyResetAt = 0;
const JOURNEY_RESET_DEDUPE_MS = 1600;
let lastMirroredPlayEndAt = 0;
const PLAY_END_DEDUPE_MS = 1600;
let lastMirroredSoftFailKey = "";
let lastMirroredSoftFailAt = 0;
const SOFT_FAIL_DEDUPE_MS = 900;
let lastMirroredChatCameraKey = "";
let lastMirroredChatCameraAt = 0;
const CHAT_CAMERA_MIRROR_DEDUPE_MS = 500;

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

  if (event.kind === "play-end") {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - lastMirroredPlayEndAt < PLAY_END_DEDUPE_MS) {
      return;
    }
    lastMirroredPlayEndAt = now;
  }

  // Second-line dedupe for chat camera trackers (emit already dedupes; mirror too).
  const detail = detailOf(event);
  if (event.kind === "scroll" && /^chat-camera:/i.test(detail)) {
    const key = detail.replace(/\s+/g, " ").slice(0, 80);
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (
      key === lastMirroredChatCameraKey &&
      now - lastMirroredChatCameraAt < CHAT_CAMERA_MIRROR_DEDUPE_MS
    ) {
      return;
    }
    lastMirroredChatCameraKey = key;
    lastMirroredChatCameraAt = now;
  }

  const label = labelForPlaybackDiagEvent(event);
  const outcome = outcomeForPlaybackDiagEvent(event);

  // Soft-fail rows (scroll-reversal etc.) often double-emit — keep one visible.
  if (outcome === "soft-fail") {
    const key = `${event.kind}|${label}`;
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (
      key === lastMirroredSoftFailKey &&
      now - lastMirroredSoftFailAt < SOFT_FAIL_DEDUPE_MS
    ) {
      return;
    }
    lastMirroredSoftFailKey = key;
    lastMirroredSoftFailAt = now;
  }

  // HARD: do NOT appendQaDiagRing here — logStep → pushLogEntry already rings.
  // Double-ring was the restore/refresh duplicate source (detail row + label row).
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
  // logStep → pushLogEntry rings once (no double appendQaDiagRing).
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
