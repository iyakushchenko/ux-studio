/**
 * PLAYBACK_DIAG — console-first CJM playback diagnostics.
 *
 * Contract: every beat (agentic + traditional) logs cursor/scroll/click/type
 * so Quinn can prove regressions without guessing. See docs/shell/PLAYBACK_DIAG.md.
 *
 * Console emit is gated by `qaDiagGate` (open via version-chip logger / agent overlay).
 *
 * Console:
 *   window.__studioPlaybackDiag()
 *   window.__studioAssertTypeIn({ minChars?: number, minSamples?: number })
 *   window.__studioAssertPlayEndedAtStart({ startBeatId, startScreenId? })
 *   window.__studioPlaybackDiagClear()
 */

import { appendQaDiagRing, isQaDiagGateOpen } from "@/app/shell/qaDiagGate";
import {
  installPlaybackDiagQaBridgeApis,
  mirrorPlaybackDiagClearToQa,
  mirrorPlaybackDiagToQa,
  uninstallPlaybackDiagQaBridgeApis,
} from "@/app/shell/playbackDiagQaBridge";
import { clearDemoCursorCarriageLatches } from "@/app/scenario/demoCursor";

export type PlaybackDiagKind =
  | "type-in-start"
  | "type-in-progress"
  | "type-in-end"
  | "type-in-skip"
  | "step-forward"
  | "step-back"
  | "retreat-sync"
  | "transport"
  | "play-end"
  | "journey-reset"
  | "hub-nav"
  | "beat"
  | "target"
  | "cursor"
  | "scroll"
  | "click"
  | "skip"
  | "screen-enter"
  | "nav-cross"
  | "info"
  /** Chat bubble pull-up / thinking→reply motion samples (gate-open only). */
  | "chat-bubble-motion"
  /** REC capture — demo-click / chrome-reject / screen seed */
  | "rec-capture"
  /** REC compile → journey summary */
  | "rec-compile"
  /** REC ↺ replay step outcome */
  | "rec-replay";

export type PlaybackDiagMode = "agentic" | "traditional" | "browse" | "unknown";

export type PlaybackDiagBBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PlaybackDiagEvent = {
  t: number;
  kind: PlaybackDiagKind;
  surface?: string;
  detail?: string;
  chars?: number;
  targetChars?: number;
  beatId?: string | null;
  counter?: string | null;
  /** Beat / script kind (tab-landing, screen-frames, homeScript id, …). */
  beatKind?: string | null;
  mode?: PlaybackDiagMode | string | null;
  screenBefore?: string | null;
  screenAfter?: string | null;
  selector?: string | null;
  found?: boolean;
  bbox?: PlaybackDiagBBox | null;
  cursor?: {
    travelStart?: { x: number; y: number } | null;
    travelEnd?: { x: number; y: number } | null;
    onTarget?: boolean;
    hoverApplied?: boolean;
    press?: boolean;
    release?: boolean;
    graphicState?: string | null;
    samples?: number;
    parked?: boolean;
    parkReason?: string | null;
  };
  scroll?: {
    host?: string | null;
    beforeTop?: number | null;
    afterTop?: number | null;
    intoViewRequested?: boolean;
    intoViewDone?: boolean;
    retreat?: boolean;
  };
  clickOk?: boolean;
  typeOk?: boolean;
  skipReason?: string | null;
  startBeatId?: string | null;
  startScreenId?: string | null;
  /** Hub navigation reason + stack (PO leak forensics). */
  hubReason?: string | null;
  hubStack?: string | null;
  /** Screen host presence / blink forensics (book-step-2/3 etc.). */
  remountCount?: number;
  renderCount?: number;
  createdRoot?: boolean;
  opacity?: number | null;
  visibility?: string | null;
  motionPresence?: boolean;
  navCross?: boolean;
  sameTab?: boolean;
  instant?: boolean;
  /** Chat bubble motion forensics (kind=chat-bubble-motion). */
  bubble?: {
    id: string;
    phase: string;
    y?: number | null;
    opacity?: number | null;
    layoutY?: number | null;
    deltaY?: number | null;
    deltaTransformY?: number | null;
    scrollTop?: number | null;
    shouldAnimate?: boolean;
    visibleCount?: number | null;
    note?: string | null;
    jump?: boolean;
    jumpReason?: string | null;
    chop?: boolean;
    chopReason?: string | null;
    /** Composer-exit TRACE — dock/clearPx/lock/scrollMax. */
    trace?: {
      scrollTop?: number | null;
      scrollMax?: number | null;
      scrollLock?: boolean;
      composerDockTop?: number | null;
      bubbleBottom?: number | null;
      clearPx?: number | null;
      underComposer?: boolean;
      cameraTag?: string | null;
      deltaScrollTop?: number | null;
    } | null;
  };
  ok?: boolean;
};

/** Cap full bubble frame series for Save Log (gate-open sampling). */
const MAX_BUBBLE_SAMPLES = 720;
/** Keep every Nth pull-up rAF in dump — still detect JUMP/CHOP every frame. */
const BUBBLE_FRAME_SAMPLE_EVERY = 4;
/** Dedupe routine camera TRACE into dump (same tag within this window). */
const BUBBLE_TRACE_SAMPLE_MS = 280;
const bubbleSamples: PlaybackDiagEvent[] = [];
/** Per-id phase set — detect skipped mount→start→end. */
const bubblePhasesById = new Map<string, Set<string>>();
/** Per-id last transform y for jump detection across frames. */
const bubblePrevTransformY = new Map<string, number>();
/** Per-id frame counter for dump sampling (not for JUMP Δ — that stays consecutive). */
const bubbleFrameCounters = new Map<string, number>();
/** Last kept routine TRACE key → timestamp (perf — avoid overlay/console flood). */
const bubbleTraceLastKept = new Map<string, number>();

export const CHAT_BUBBLE_JUMP_LAYOUT_PX = 10;
export const CHAT_BUBBLE_JUMP_TRANSFORM_PX = 4.5;
export const CHAT_BUBBLE_SCROLL_CHOP_PX = 18;

const MAX_EVENTS = 400;
const events: PlaybackDiagEvent[] = [];
/**
 * Durable click tallies — survive MAX_EVENTS rotation so dump summaries.click.ok
 * matches real successful clicks even when early click events were shifted out.
 */
let clickOkCount = 0;
let clickFailCount = 0;
/** Completed type-in char samples (in-memory only — never per-char events). */
let completedTypeInSamples: number[] = [];
let typeInActive: {
  surface: string;
  startedAt: number;
  targetChars: number;
  samples: number[];
  /** Latch CURSOR_HIDDEN_DURING_TYPEIN at most once per type-in. */
  hiddenLatched?: boolean;
} | null = null;

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function readScreenId(): string | null {
  if (typeof location === "undefined") return null;
  return new URLSearchParams(location.search).get("screen");
}

function consolePayload(full: PlaybackDiagEvent): Record<string, unknown> {
  return {
    surface: full.surface,
    detail: full.detail,
    beatId: full.beatId,
    beatKind: full.beatKind,
    mode: full.mode,
    screenBefore: full.screenBefore,
    screenAfter: full.screenAfter,
    selector: full.selector,
    found: full.found,
    bbox: full.bbox,
    cursor: full.cursor,
    scroll: full.scroll,
    clickOk: full.clickOk,
    typeOk: full.typeOk,
    skipReason: full.skipReason,
    chars: full.chars,
    targetChars: full.targetChars,
    counter: full.counter,
    startBeatId: full.startBeatId,
    startScreenId: full.startScreenId,
    hubReason: full.hubReason,
    hubStack: full.hubStack,
    remountCount: full.remountCount,
    renderCount: full.renderCount,
    createdRoot: full.createdRoot,
    opacity: full.opacity,
    visibility: full.visibility,
    motionPresence: full.motionPresence,
    navCross: full.navCross,
    sameTab: full.sameTab,
    instant: full.instant,
    bubble: full.bubble,
    ok: full.ok,
  };
}

/** Lean console — FAIL/chop/JUMP + milestones; not every cursor/scroll/beat tick. */
function shouldConsolePlaybackDiag(full: PlaybackDiagEvent): boolean {
  if (full.ok === false || full.clickOk === false) return true;
  if (full.kind === "type-in-progress") return false;
  if (
    full.kind === "type-in-start" ||
    full.kind === "type-in-end" ||
    full.kind === "type-in-skip" ||
    full.kind === "skip" ||
    full.kind === "play-end" ||
    full.kind === "journey-reset" ||
    full.kind === "hub-nav" ||
    full.kind === "nav-cross"
  ) {
    return true;
  }
  if (full.kind === "click") return true;
  if (full.kind === "cursor") {
    return (
      full.cursor?.onTarget === false ||
      /HIDDEN|OFF-TARGET|FAIL|suppressed|hotspot miss/i.test(full.detail ?? "")
    );
  }
  if (full.kind === "scroll") {
    return /SCROLL_ISSUE|reversal|stutter|unexpected|JUMP|competing|interrupted|FAIL/i.test(
      full.detail ?? ""
    );
  }
  if (
    full.kind === "step-forward" ||
    full.kind === "step-back" ||
    full.kind === "transport" ||
    full.kind === "retreat-sync"
  ) {
    return (
      full.ok === false ||
      /fail|warn|error|no-op|blocked|stall|mismatch|unexpected/i.test(
        full.detail ?? ""
      )
    );
  }
  if (full.kind === "info" || full.kind === "rec-capture" || full.kind === "rec-replay") {
    return /fail|warn|error|JUMP|CHOP|FAIL|clear/i.test(full.detail ?? "");
  }
  // beat / target / page-jiggle — dump only; too chatty for Live console.
  return false;
}

function push(event: Omit<PlaybackDiagEvent, "t">): PlaybackDiagEvent {
  const full: PlaybackDiagEvent = { t: now(), ...event };
  events.push(full);
  if (events.length > MAX_EVENTS) events.shift();
  // Heavy console only while QA diag gate is open (version-chip logger / agent overlay).
  if (isQaDiagGateOpen() && shouldConsolePlaybackDiag(full)) {
    console.info("[PLAYBACK_DIAG]", full.kind, consolePayload(full));
  }
  // Lean QA mirror — monitor/error family rows (not every sample).
  try {
    mirrorPlaybackDiagToQa(full);
  } catch {
    /* hang-safe */
  }
  return full;
}

export function playbackDiagClear(): void {
  events.length = 0;
  bubbleSamples.length = 0;
  bubblePhasesById.clear();
  bubblePrevTransformY.clear();
  bubbleFrameCounters.clear();
  bubbleTraceLastKept.clear();
  typeInActive = null;
  completedTypeInSamples = [];
  clickOkCount = 0;
  clickFailCount = 0;
  if (isQaDiagGateOpen()) {
    console.info("[PLAYBACK_DIAG]", "clear");
  }
  try {
    mirrorPlaybackDiagClearToQa();
  } catch {
    /* hang-safe */
  }
}

export function playbackDiagLog(
  kind: PlaybackDiagKind,
  detail?: string,
  extra?: Partial<PlaybackDiagEvent>
): void {
  push({ kind, detail, ...extra });
}

/** Resolve mode from URL / studio state when callers omit it. */
export function resolvePlaybackDiagMode(): PlaybackDiagMode {
  if (typeof location === "undefined") return "unknown";
  const params = new URLSearchParams(location.search);
  const exp = params.get("experience");
  if (exp === "agentic") return "agentic";
  if (exp === "traditional") return "traditional";
  const cjm = params.get("cjm");
  if (cjm === "off") return "browse";
  return "unknown";
}

export function playbackDiagBeat(options: {
  detail?: string;
  beatId?: string | null;
  beatKind?: string | null;
  mode?: PlaybackDiagMode | string | null;
  screenBefore?: string | null;
  screenAfter?: string | null;
  phase?: "enter" | "exit" | "advance" | "retreat";
}): void {
  const screen = readScreenId();
  const screenAfter = options.screenAfter ?? screen;
  push({
    kind: "beat",
    detail:
      options.detail ??
      `${options.phase ?? "enter"} ${options.beatId ?? "?"} (${options.beatKind ?? "?"})`,
    beatId: options.beatId,
    beatKind: options.beatKind,
    mode: options.mode ?? resolvePlaybackDiagMode(),
    screenBefore: options.screenBefore ?? screen,
    screenAfter,
  });
  // Objective page-jiggle sample on beat enter/advance (rAF y/opacity).
  if (options.phase === "enter" || options.phase === "advance" || !options.phase) {
    const sid = screenAfter ?? screen;
    if (sid && typeof requestAnimationFrame === "function") {
      void import("./pageJiggleMonitor").then((m) => {
        m.samplePageJiggle(sid);
      });
    }
  }
}

export function playbackDiagTarget(options: {
  selector?: string | null;
  found: boolean;
  element?: HTMLElement | null;
  beatId?: string | null;
  detail?: string;
}): void {
  let bbox: PlaybackDiagBBox | null = null;
  if (options.element && typeof options.element.getBoundingClientRect === "function") {
    const r = options.element.getBoundingClientRect();
    bbox = {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  }
  push({
    kind: "target",
    detail:
      options.detail ??
      (options.found
        ? `target found ${options.selector ?? ""}`
        : `target MISSING ${options.selector ?? ""}`),
    selector: options.selector,
    found: options.found,
    bbox,
    beatId: options.beatId,
  });
}

export function playbackDiagCursor(options: {
  detail?: string;
  beatId?: string | null;
  action?: string;
  travelStart?: { x: number; y: number } | null;
  travelEnd?: { x: number; y: number } | null;
  onTarget?: boolean;
  hoverApplied?: boolean;
  press?: boolean;
  release?: boolean;
  graphicState?: string | null;
  samples?: number;
  parked?: boolean;
  parkReason?: string | null;
  selector?: string | null;
}): void {
  const parked = options.parked === true || options.action === "park";
  push({
    kind: "cursor",
    detail:
      options.detail ??
      (parked
        ? `PARKED — ${options.parkReason ?? options.action ?? "rest"}`
        : `cursor ${options.action ?? "event"}`),
    beatId: options.beatId,
    selector: options.selector,
    cursor: {
      travelStart: options.travelStart,
      travelEnd: options.travelEnd,
      onTarget: options.onTarget,
      hoverApplied: options.hoverApplied,
      press: options.press,
      release: options.release,
      graphicState: options.graphicState,
      samples: options.samples,
      parked,
      parkReason: options.parkReason ?? (parked ? options.detail ?? null : null),
    },
  });
}

export function playbackDiagScroll(options: {
  detail?: string;
  beatId?: string | null;
  host?: string | null;
  beforeTop?: number | null;
  afterTop?: number | null;
  intoViewRequested?: boolean;
  intoViewDone?: boolean;
  retreat?: boolean;
  selector?: string | null;
}): void {
  push({
    kind: "scroll",
    detail:
      options.detail ??
      `scroll ${options.host ?? "?"} ${options.beforeTop ?? "?"}→${options.afterTop ?? "?"}${
        options.retreat ? " (retreat)" : ""
      }`,
    beatId: options.beatId,
    selector: options.selector,
    scroll: {
      host: options.host,
      beforeTop: options.beforeTop,
      afterTop: options.afterTop,
      intoViewRequested: options.intoViewRequested,
      intoViewDone: options.intoViewDone,
      retreat: options.retreat,
    },
  });
}

export function playbackDiagClick(options: {
  ok: boolean;
  selector?: string | null;
  beatId?: string | null;
  detail?: string;
  found?: boolean;
  bbox?: PlaybackDiagBBox | null;
}): void {
  if (options.ok) clickOkCount += 1;
  else clickFailCount += 1;
  push({
    kind: "click",
    detail:
      options.detail ??
      (options.ok ? `click ok ${options.selector ?? ""}` : `click FAIL ${options.selector ?? ""}`),
    selector: options.selector,
    found: options.found ?? Boolean(options.selector),
    bbox: options.bbox,
    beatId: options.beatId,
    clickOk: options.ok,
    ok: options.ok,
  });
}

export function playbackDiagSkip(options: {
  reason: string;
  beatId?: string | null;
  detail?: string;
}): void {
  push({
    kind: "skip",
    detail: options.detail ?? `skipped — ${options.reason}`,
    beatId: options.beatId,
    skipReason: options.reason,
  });
}

/** REC capture step — filter console: `[PLAYBACK_DIAG] rec-capture`. */
export function playbackDiagRecCapture(options: {
  detail: string;
  eventKind?: string;
  selector?: string | null;
  found?: boolean;
  usable?: boolean;
  beatId?: string | null;
  screenId?: string | null;
  chromeRejected?: boolean;
}): void {
  push({
    kind: "rec-capture",
    surface: "rec-capture",
    detail: options.detail,
    beatKind: options.eventKind,
    selector: options.selector,
    found: options.found,
    clickOk: options.usable,
    beatId: options.beatId,
    screenAfter: options.screenId ?? readScreenId(),
    skipReason: options.chromeRejected ? "chrome-target" : undefined,
    mode: resolvePlaybackDiagMode(),
  });
}

/** REC compile → journey — filter: `[PLAYBACK_DIAG] rec-compile`. */
export function playbackDiagRecCompile(options: {
  detail: string;
  journeyId?: string;
  beatCount?: number;
  clickBeats?: number;
  gaps?: string[];
}): void {
  push({
    kind: "rec-compile",
    surface: "rec-compile",
    detail: options.detail,
    beatId: options.journeyId,
    counter:
      options.beatCount != null
        ? `beats:${options.beatCount};clicks:${options.clickBeats ?? 0}`
        : undefined,
    skipReason: options.gaps?.slice(0, 4).join(",") || undefined,
    mode: resolvePlaybackDiagMode(),
  });
}

/** REC ↺ replay step — filter: `[PLAYBACK_DIAG] rec-replay`. */
export function playbackDiagRecReplay(options: {
  detail: string;
  eventKind?: string;
  selector?: string | null;
  ok?: boolean;
  error?: string;
  index?: number;
  total?: number;
}): void {
  push({
    kind: "rec-replay",
    surface: "rec-replay",
    detail: options.detail,
    beatKind: options.eventKind,
    selector: options.selector,
    found: options.ok,
    clickOk: options.ok,
    skipReason: options.error,
    counter:
      options.index != null && options.total != null
        ? `${options.index + 1}/${options.total}`
        : undefined,
    mode: resolvePlaybackDiagMode(),
  });
}

export function playbackDiagJourneyReset(options: {
  startBeatId?: string | null;
  startScreenId?: string | null;
  fromBeatId?: string | null;
  detail?: string;
  mode?: PlaybackDiagMode | string | null;
}): void {
  const screen = readScreenId();
  push({
    kind: "journey-reset",
    detail:
      options.detail ??
      `reset → start beat ${options.startBeatId ?? "?"} screen ${options.startScreenId ?? screen ?? "?"}`,
    beatId: options.startBeatId,
    startBeatId: options.startBeatId,
    startScreenId: options.startScreenId ?? screen,
    screenBefore: screen,
    screenAfter: options.startScreenId ?? screen,
    mode: options.mode ?? resolvePlaybackDiagMode(),
    surface: options.fromBeatId
      ? `${options.fromBeatId}→${options.startBeatId ?? "start"}`
      : undefined,
  });
}

/** Mark CJM type-in start (Home / Chat composer). */
export function playbackDiagTypeInStart(
  surface: string,
  targetChars: number,
  detail?: string
): void {
  typeInActive = {
    surface,
    startedAt: now(),
    targetChars,
    samples: [0],
  };
  push({
    kind: "type-in-start",
    surface,
    targetChars,
    chars: 0,
    detail: detail ?? `type-in start → ${targetChars} chars`,
  });
}

/**
 * Sample typed length during animation — sparse in-memory only.
 * HARD: never push per-char events (QA overlay + console flood).
 * HARD: never store every char in samples either (dump smell: samples=249
 * with starts/ends=2). Keep ≤ start + every 16 + final for assertTypeIn.
 */
export function playbackDiagTypeInProgress(chars: number): void {
  if (!typeInActive) return;
  const samples = typeInActive.samples;
  const last = samples[samples.length - 1];
  const atCheckpoint =
    chars === 0 ||
    chars % 16 === 0 ||
    chars === typeInActive.targetChars;
  if (!atCheckpoint && last === chars) return;
  if (!atCheckpoint && last != null && chars - last < 16) return;
  if (last === chars) return;
  samples.push(chars);
}

export function playbackDiagTypeInEnd(ok: boolean, detail?: string): void {
  const active = typeInActive;
  if (active?.samples.length) {
    completedTypeInSamples.push(...active.samples);
  }
  typeInActive = null;
  // Drop carriage latch — sticky composer focus must not paint I-beam on later hover/click.
  try {
    clearDemoCursorCarriageLatches();
  } catch {
    /* hang-safe */
  }
  push({
    kind: "type-in-end",
    surface: active?.surface,
    chars: active?.samples[active.samples.length - 1],
    targetChars: active?.targetChars,
    typeOk: ok,
    detail:
      detail ??
      (ok
        ? `type-in ok (${active?.samples.length ?? 0} samples, ${Math.round(
            now() - (active?.startedAt ?? now())
          )}ms)`
        : "type-in failed / aborted"),
  });
}

/** Forbidden skip path — logged so regressions are obvious. */
export function playbackDiagTypeInSkip(surface: string, reason: string): void {
  push({
    kind: "type-in-skip",
    surface,
    detail: reason,
    skipReason: reason,
  });
}

export type PlaybackDiagBundle = {
  events: PlaybackDiagEvent[];
  typeInActive: typeof typeInActive;
  typeIn: {
    starts: number;
    ends: number;
    skips: number;
    lastStart?: PlaybackDiagEvent;
    lastEnd?: PlaybackDiagEvent;
    progressSamples: number[];
  };
  step: {
    forwards: number;
    backs: number;
    retreatSyncs: number;
  };
  cursor: {
    events: number;
    parks: number;
    lastParkReason?: string | null;
  };
  scroll: {
    events: number;
    retreatIntoView: number;
  };
  click: {
    ok: number;
    fail: number;
  };
  skip: {
    count: number;
    reasons: string[];
  };
  playEnd: {
    count: number;
    last?: PlaybackDiagEvent;
  };
  journeyReset: {
    count: number;
    last?: PlaybackDiagEvent;
  };
  hubNav: {
    count: number;
    last?: PlaybackDiagEvent;
  };
  screenEnter: {
    count: number;
    last?: PlaybackDiagEvent;
  };
  navCross: {
    count: number;
    ran: number;
    skipped: number;
    last?: PlaybackDiagEvent;
  };
  rec: {
    capture: number;
    compile: number;
    replay: number;
    lastCapture?: PlaybackDiagEvent;
    lastCompile?: PlaybackDiagEvent;
    lastReplay?: PlaybackDiagEvent;
  };
  /** Gate-open chat bubble motion series + jump/chop summary. */
  chatBubbleMotion: {
    samples: PlaybackDiagEvent[];
    count: number;
    jumps: number;
    chops: number;
    maxAbsDeltaY: number;
    maxAbsDeltaTransformY: number;
    skippedPhaseNotes: string[];
    ids: string[];
  };
};

/**
 * Chat bubble pull-up / thinking→reply forensics.
 * Records **only while QA gate open** (full frame series → dump; lean log lines).
 */
export function playbackDiagChatBubbleMotion(options: {
  id: string;
  phase: string;
  y?: number | null;
  opacity?: number | null;
  layoutY?: number | null;
  deltaY?: number | null;
  scrollTop?: number | null;
  shouldAnimate?: boolean;
  visibleCount?: number | null;
  note?: string | null;
  trace?: {
    scrollTop?: number | null;
    scrollMax?: number | null;
    scrollLock?: boolean;
    composerDockTop?: number | null;
    bubbleBottom?: number | null;
    clearPx?: number | null;
    underComposer?: boolean;
    cameraTag?: string | null;
    deltaScrollTop?: number | null;
  } | null;
  chop?: boolean;
  chopReason?: string | null;
}): PlaybackDiagEvent | null {
  if (!isQaDiagGateOpen()) return null;

  const id = options.id;
  const phase = options.phase;
  const phases = bubblePhasesById.get(id) ?? new Set<string>();
  phases.add(phase);
  bubblePhasesById.set(id, phases);

  let jump = false;
  let jumpReason: string | null = null;
  const deltaY = options.deltaY ?? null;
  let deltaTransformY: number | null = null;
  const dScroll = options.trace?.deltaScrollTop;

  if (typeof options.y === "number" && Number.isFinite(options.y)) {
    const prevY = bubblePrevTransformY.get(id);
    if (prevY != null && phase === "frame") {
      deltaTransformY = Math.round((options.y - prevY) * 100) / 100;
      if (Math.abs(deltaTransformY) > CHAT_BUBBLE_JUMP_TRANSFORM_PX) {
        jump = true;
        jumpReason = `transform Δy=${deltaTransformY}`;
      }
    }
    bubblePrevTransformY.set(id, options.y);
  }

  if (
    typeof deltaY === "number" &&
    Math.abs(deltaY) > CHAT_BUBBLE_JUMP_LAYOUT_PX
  ) {
    // Camera co-travel during pull-up moves layoutY with scrollTop — not a JUMP.
    const camTravel =
      typeof dScroll === "number" && Math.abs(dScroll) > 0.5;
    if (!camTravel) {
      jump = true;
      jumpReason = jumpReason
        ? `${jumpReason}; layout ΔY=${deltaY}`
        : `layout ΔY=${deltaY}`;
    }
  }

  let chop = options.chop === true;
  let chopReason = options.chopReason ?? null;
  if (
    typeof dScroll === "number" &&
    Math.abs(dScroll) > CHAT_BUBBLE_SCROLL_CHOP_PX
  ) {
    // Pull-up scroll lock = intentional camera co-travel (any Δ). Large host-end
    // steps on tall threads (r1+) are expected — must not hard-CHOP / halt Play.
    const easedCoTravel = options.trace?.scrollLock === true;
    if (!easedCoTravel) {
      chop = true;
      chopReason = chopReason ?? `scrollTop Δ=${dScroll}`;
    }
  }
  // underComposer on frames is expected during rise-from-dock — TRACE only, not CHOP.

  let skippedNote: string | null = null;
  if (phase === "animate-end") {
    if (!phases.has("animate-start") && !phases.has("mount")) {
      skippedNote = `${id}: animate-end without mount/start`;
    } else if (!phases.has("animate-start")) {
      skippedNote = `${id}: animate-end without animate-start`;
    }
    bubblePrevTransformY.delete(id);
    bubbleFrameCounters.delete(id);
  }

  const cameraTag =
    options.trace?.cameraTag ??
    (typeof options.note === "string"
      ? options.note.replace(/^camera:/, "")
      : null);
  const isMilestonePhase =
    phase === "mount" ||
    phase === "animate-start" ||
    phase === "animate-end" ||
    phase === "thinking-handoff" ||
    phase === "exit";
  /** Routine co-travel TRACE — dump-sampled only; never flood console/overlay. */
  const isRoutineTrace =
    phase === "trace" &&
    !jump &&
    !chop &&
    !/topup|fail|JUMP|CHOP|error/i.test(
      `${options.note ?? ""} ${cameraTag ?? ""} ${options.chopReason ?? ""}`
    );

  let keepInSamples = true;
  if (jump || chop || skippedNote || isMilestonePhase) {
    keepInSamples = true;
  } else if (phase === "frame") {
    const n = (bubbleFrameCounters.get(id) ?? 0) + 1;
    bubbleFrameCounters.set(id, n);
    keepInSamples = n === 1 || n % BUBBLE_FRAME_SAMPLE_EVERY === 0;
  } else if (phase === "trace") {
    const tagKey = `${id}:${cameraTag ?? options.note ?? "camera"}`;
    const last = bubbleTraceLastKept.get(tagKey) ?? 0;
    const tNow = now();
    if (isRoutineTrace && tNow - last < BUBBLE_TRACE_SAMPLE_MS) {
      keepInSamples = false;
    } else {
      bubbleTraceLastKept.set(tagKey, tNow);
    }
  }

  const detail =
    jump
      ? `Bubble JUMP ${id} ${phase} ΔY=${deltaY ?? "?"} ${jumpReason ?? ""}`.trim()
      : chop
        ? `Bubble CHOP ${id} ${phase} ${chopReason ?? ""}`.trim()
        : phase === "frame"
          ? `Bubble ${id} frame y=${options.y ?? "?"} op=${options.opacity ?? "?"} scroll=${options.scrollTop ?? options.trace?.scrollTop ?? "?"}`
          : phase === "trace"
            ? `Bubble TRACE ${id} ${options.note ?? options.trace?.cameraTag ?? "camera"}`
            : phase === "thinking-handoff"
              ? `Bubble ${id} thinking→reply`
              : phase === "animate-start" || phase === "mount"
                ? `Bubble ${id} pull-up`
                : phase === "animate-end"
                  ? `Bubble ${id} settle`
                  : `Bubble ${id} ${phase}`;

  const bubble = {
    id,
    phase,
    y: options.y ?? null,
    opacity: options.opacity ?? null,
    layoutY: options.layoutY ?? null,
    deltaY,
    deltaTransformY,
    scrollTop: options.scrollTop ?? options.trace?.scrollTop ?? null,
    shouldAnimate: options.shouldAnimate ?? true,
    visibleCount: options.visibleCount ?? null,
    note: options.note ?? skippedNote,
    jump,
    jumpReason,
    chop,
    chopReason,
    trace: options.trace ?? null,
  };

  const full: PlaybackDiagEvent = {
    t: now(),
    kind: "chat-bubble-motion",
    surface: "chat",
    detail,
    screenAfter: readScreenId(),
    ok: !jump && !chop && !skippedNote,
    bubble,
  };

  if (keepInSamples) {
    bubbleSamples.push(full);
    if (bubbleSamples.length > MAX_BUBBLE_SAMPLES) bubbleSamples.shift();
  }

  // Never console every pull-up rAF / routine camera TRACE — JUMP/CHOP + milestones only.
  const emitConsole =
    jump ||
    chop ||
    !!skippedNote ||
    isMilestonePhase ||
    (phase === "trace" && !isRoutineTrace);
  if (isQaDiagGateOpen() && emitConsole) {
    console.info("[PLAYBACK_DIAG]", full.kind, consolePayload(full));
  }

  // Overlay / event ring: milestones + FAIL class — not routine TRACE waterfall.
  const summarize =
    jump ||
    chop ||
    isMilestonePhase ||
    (phase === "trace" && !isRoutineTrace) ||
    !!skippedNote;

  if (summarize) {
    events.push(full);
    if (events.length > MAX_EVENTS) events.shift();

    const label = jump
      ? `Bubble JUMP ΔY=${deltaY ?? "?"} (${id})`
      : chop
        ? `Bubble CHOP ${chopReason ?? id}`
        : phase === "trace"
          ? `Bubble TRACE ${options.note ?? id}`
          : phase === "thinking-handoff"
            ? `Bubble ${id} thinking→reply`
            : phase === "animate-start" || phase === "mount"
              ? `Bubble ${id} pull-up`
              : phase === "animate-end"
                ? `Bubble ${id} settle${skippedNote ? " · SKIP" : ""}`
                : `Bubble ${id} ${phase}`;
    if (jump || chop) {
      try {
        (
          window as Window & { __studioBeginQaFailHandoff?: (r: string) => void }
        ).__studioBeginQaFailHandoff?.(jump ? "bubble-jump" : "bubble-chop");
      } catch {
        /* hang-safe */
      }
    }
    try {
      appendQaDiagRing({
        kind: "chat-bubble-motion",
        label,
        text: detail,
        screenId: readScreenId(),
      });
    } catch {
      /* hang-safe */
    }
    try {
      const api =
        typeof window !== "undefined"
          ? (
              window as Window & {
                __studioAgentTestingOverlay?: {
                  logStep?: (input: {
                    label?: string;
                    outcome?: "ok" | "soft-fail" | "fail";
                    kind?: string;
                  }) => void;
                };
              }
            ).__studioAgentTestingOverlay
          : undefined;
      api?.logStep?.({
        kind: jump || chop ? "chat-bubble-motion" : "sequence",
        label,
        outcome: jump || chop || skippedNote ? "soft-fail" : "ok",
      });
    } catch {
      /* hang-safe */
    }
  }

  return keepInSamples || summarize ? full : null;
}

export function getPlaybackDiagBundle(): PlaybackDiagBundle {
  const typeStarts = events.filter((e) => e.kind === "type-in-start");
  const typeEnds = events.filter((e) => e.kind === "type-in-end");
  const typeSkips = events.filter((e) => e.kind === "type-in-skip");
  const playEnds = events.filter((e) => e.kind === "play-end");
  const resets = events.filter((e) => e.kind === "journey-reset");
  const hubNavs = events.filter((e) => e.kind === "hub-nav");
  const screenEnters = events.filter((e) => e.kind === "screen-enter");
  const navCrossEvents = events.filter((e) => e.kind === "nav-cross");
  const cursorEvents = events.filter((e) => e.kind === "cursor");
  const parks = cursorEvents.filter((e) => e.cursor?.parked);
  const scrollEvents = events.filter((e) => e.kind === "scroll");
  const skipEvents = events.filter((e) => e.kind === "skip");
  // Prefer in-memory samples (per-char, no event spam). Legacy type-in-progress
  // events (if any) still count so old dumps stay assertable.
  const legacyProgress = events
    .filter((e) => e.kind === "type-in-progress" && typeof e.chars === "number")
    .map((e) => e.chars as number);
  const liveSamples = typeInActive?.samples ?? [];
  const progressSamples =
    completedTypeInSamples.length || liveSamples.length
      ? [...completedTypeInSamples, ...liveSamples]
      : legacyProgress;

  return {
    events: [...events],
    typeInActive,
    typeIn: {
      starts: typeStarts.length,
      ends: typeEnds.length,
      skips: typeSkips.length,
      lastStart: typeStarts[typeStarts.length - 1],
      lastEnd: typeEnds[typeEnds.length - 1],
      progressSamples,
    },
    step: {
      forwards: events.filter((e) => e.kind === "step-forward").length,
      backs: events.filter((e) => e.kind === "step-back").length,
      retreatSyncs: events.filter((e) => e.kind === "retreat-sync").length,
    },
    cursor: {
      events: cursorEvents.length,
      parks: parks.length,
      lastParkReason: parks[parks.length - 1]?.cursor?.parkReason ?? null,
    },
    scroll: {
      events: scrollEvents.length,
      retreatIntoView: scrollEvents.filter(
        (e) => e.scroll?.retreat && e.scroll?.intoViewDone
      ).length,
    },
    click: {
      ok: clickOkCount,
      fail: clickFailCount,
    },
    skip: {
      count: skipEvents.length,
      reasons: skipEvents
        .map((e) => e.skipReason)
        .filter((r): r is string => Boolean(r)),
    },
    playEnd: {
      count: playEnds.length,
      last: playEnds[playEnds.length - 1],
    },
    journeyReset: {
      count: resets.length,
      last: resets[resets.length - 1],
    },
    hubNav: {
      count: hubNavs.length,
      last: hubNavs[hubNavs.length - 1],
    },
    screenEnter: {
      count: screenEnters.length,
      last: screenEnters[screenEnters.length - 1],
    },
    navCross: {
      count: navCrossEvents.length,
      ran: navCrossEvents.filter((e) => e.navCross === true).length,
      skipped: navCrossEvents.filter((e) => e.instant === true || e.navCross === false)
        .length,
      last: navCrossEvents[navCrossEvents.length - 1],
    },
    rec: (() => {
      const captures = events.filter((e) => e.kind === "rec-capture");
      const compiles = events.filter((e) => e.kind === "rec-compile");
      const replays = events.filter((e) => e.kind === "rec-replay");
      return {
        capture: captures.length,
        compile: compiles.length,
        replay: replays.length,
        lastCapture: captures[captures.length - 1],
        lastCompile: compiles[compiles.length - 1],
        lastReplay: replays[replays.length - 1],
      };
    })(),
    chatBubbleMotion: (() => {
      const samples = [...bubbleSamples];
      let jumps = 0;
      let chops = 0;
      let maxAbsDeltaY = 0;
      let maxAbsDeltaTransformY = 0;
      const ids = new Set<string>();
      const skippedPhaseNotes: string[] = [];
      for (const ev of samples) {
        const b = ev.bubble;
        if (!b) continue;
        ids.add(b.id);
        if (b.jump) jumps += 1;
        if (b.chop) chops += 1;
        if (typeof b.deltaY === "number") {
          maxAbsDeltaY = Math.max(maxAbsDeltaY, Math.abs(b.deltaY));
        }
        if (typeof b.deltaTransformY === "number") {
          maxAbsDeltaTransformY = Math.max(
            maxAbsDeltaTransformY,
            Math.abs(b.deltaTransformY)
          );
        }
        if (
          typeof b.note === "string" &&
          b.note.includes("without") &&
          !skippedPhaseNotes.includes(b.note)
        ) {
          skippedPhaseNotes.push(b.note);
        }
      }
      return {
        samples,
        count: samples.length,
        jumps,
        chops,
        maxAbsDeltaY,
        maxAbsDeltaTransformY,
        skippedPhaseNotes,
        ids: [...ids],
      };
    })(),
  };
}

/** React screen host enter / remount / opacity snapshot (blink forensics). */
export function playbackDiagScreenEnter(options: {
  screenId: string;
  remountCount?: number;
  renderCount?: number;
  createdRoot?: boolean;
  opacity?: number | null;
  visibility?: string | null;
  motionPresence?: boolean;
  detail?: string;
}): void {
  push({
    kind: "screen-enter",
    surface: options.screenId,
    detail:
      options.detail ??
      `screen-enter ${options.screenId} remount=${options.remountCount ?? "?"} render=${options.renderCount ?? "?"} opacity=${options.opacity ?? "?"} motion=${options.motionPresence ? "yes" : "no"}`,
    screenAfter: options.screenId,
    remountCount: options.remountCount,
    renderCount: options.renderCount,
    createdRoot: options.createdRoot,
    opacity: options.opacity,
    visibility: options.visibility,
    motionPresence: options.motionPresence,
    mode: resolvePlaybackDiagMode(),
  });
}

/** Wire-mount nav crossfade start / skip (page blink when ran on same-tab). */
export function playbackDiagNavCross(options: {
  detail?: string;
  screenBefore?: string | null;
  screenAfter?: string | null;
  sameTab?: boolean;
  instant?: boolean;
  navCross?: boolean;
}): void {
  const ran = options.navCross === true && options.instant !== true;
  push({
    kind: "nav-cross",
    detail:
      options.detail ??
      (ran
        ? `nav-cross RUN sameTab=${options.sameTab ?? "?"}`
        : `nav-cross SKIP sameTab=${options.sameTab ?? "?"} instant=${options.instant ?? false}`),
    screenBefore: options.screenBefore ?? readScreenId(),
    screenAfter: options.screenAfter ?? readScreenId(),
    sameTab: options.sameTab,
    instant: options.instant,
    navCross: ran,
    mode: resolvePlaybackDiagMode(),
  });
}

/** Play finished → CJM start (not hub / not stuck on last beat). */
/**
 * Every navigation to hub must log reason + stack so the next PO leak is obvious.
 * Product paths must never call this except user Hub nav.
 */
export function playbackDiagHubNav(options: {
  reason: string;
  source?: string;
}): void {
  let stack: string | null = null;
  try {
    stack =
      new Error(`hub-nav:${options.reason}`).stack
        ?.split("\n")
        .slice(0, 14)
        .join("\n") ?? null;
  } catch {
    stack = null;
  }
  const screenBefore = readScreenId();
  push({
    kind: "hub-nav",
    detail: options.reason,
    hubReason: options.reason,
    hubStack: stack,
    screenBefore,
    screenAfter: "hub",
    surface: options.source,
    mode: resolvePlaybackDiagMode(),
  });
  try {
    if (isQaDiagGateOpen()) {
      console.warn(
        "[PLAYBACK_DIAG] hub-nav",
        options.reason,
        {
          source: options.source,
          screenBefore,
          stack,
        }
      );
    }
  } catch {
    /* hang-safe */
  }
}

export function playbackDiagPlayEnd(options: {
  fromBeatId?: string | null;
  toBeatId?: string | null;
  counter?: string | null;
  detail?: string;
  startScreenId?: string | null;
}): void {
  const screen = readScreenId();
  push({
    kind: "play-end",
    detail: options.detail ?? "play-end → journey-start",
    beatId: options.toBeatId ?? options.fromBeatId,
    startBeatId: options.toBeatId,
    startScreenId: options.startScreenId ?? screen,
    counter: options.counter,
    screenBefore: screen,
    screenAfter: options.startScreenId ?? screen,
    mode: resolvePlaybackDiagMode(),
    surface: options.fromBeatId
      ? `${options.fromBeatId}→${options.toBeatId ?? "start"}`
      : undefined,
  });
}

export type PlayEndAtStartAssertOptions = {
  /** Expected first playable beat id (e.g. traditional-plp / agentic-home). */
  startBeatId: string;
  /** URL screen id that must match start (e.g. plp / site-pilot). */
  startScreenId?: string;
};

export type PlayEndAtStartAssertResult = {
  pass: boolean;
  reason?: string;
  bundle: PlaybackDiagBundle;
  beatId?: string | null;
  screenId?: string | null;
};

export function assertPlaybackPlayEndedAtStart(
  options: PlayEndAtStartAssertOptions
): PlayEndAtStartAssertResult {
  const bundle = getPlaybackDiagBundle();
  const state = (
    window as Window & {
      __protoStudioState?: () => {
        beatId?: string | null;
        isPlaying?: boolean;
        isOnAir?: boolean;
      };
    }
  ).__protoStudioState?.();
  const beatId = state?.beatId ?? null;
  const screenId =
    typeof location !== "undefined"
      ? new URLSearchParams(location.search).get("screen")
      : null;

  if (bundle.playEnd.count < 1) {
    const result = {
      pass: false,
      reason: "no play-end diag — Play did not return to CJM start",
      bundle,
      beatId,
      screenId,
    };
    console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart FAIL", result.reason);
    return result;
  }

  if (state?.isPlaying || state?.isOnAir) {
    const result = {
      pass: false,
      reason: "transport still on-air/playing after play-end",
      bundle,
      beatId,
      screenId,
    };
    console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart FAIL", result.reason);
    return result;
  }

  if (beatId !== options.startBeatId) {
    const result = {
      pass: false,
      reason: `beatId=${beatId ?? "null"} expected start ${options.startBeatId}`,
      bundle,
      beatId,
      screenId,
    };
    console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart FAIL", result.reason);
    return result;
  }

  if (screenId === "hub") {
    const result = {
      pass: false,
      reason: "screen=hub after play-end — must stay on CJM start, not hub",
      bundle,
      beatId,
      screenId,
    };
    console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart FAIL", result.reason);
    return result;
  }

  if (options.startScreenId && screenId !== options.startScreenId) {
    const result = {
      pass: false,
      reason: `screen=${screenId ?? "null"} expected ${options.startScreenId}`,
      bundle,
      beatId,
      screenId,
    };
    console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart FAIL", result.reason);
    return result;
  }

  const result = { pass: true, bundle, beatId, screenId };
  console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart PASS", {
    beatId,
    screenId,
    playEndCount: bundle.playEnd.count,
  });
  return result;
}

export type TypeInAssertOptions = {
  /** Minimum unique char lengths observed during type-in (default 3). */
  minSamples?: number;
  /** Minimum final chars (default 8). */
  minChars?: number;
  /** Fail if any type-in-skip was logged since clear (default true). */
  failOnSkip?: boolean;
};

export type TypeInAssertResult = {
  pass: boolean;
  reason?: string;
  bundle: PlaybackDiagBundle;
};

export function assertPlaybackTypeIn(
  options?: TypeInAssertOptions
): TypeInAssertResult {
  const minSamples = options?.minSamples ?? 3;
  const minChars = options?.minChars ?? 8;
  const failOnSkip = options?.failOnSkip ?? true;
  const bundle = getPlaybackDiagBundle();

  if (failOnSkip && bundle.typeIn.skips > 0) {
    const result = {
      pass: false,
      reason: `type-in-skip logged (${bundle.typeIn.skips}) — prefilled skip is forbidden in CJM`,
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  if (bundle.typeIn.starts < 1) {
    const result = {
      pass: false,
      reason: "no type-in-start events",
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  const unique = [...new Set(bundle.typeIn.progressSamples)];
  if (unique.length < minSamples) {
    const result = {
      pass: false,
      reason: `type-in progress samples ${unique.length} < minSamples ${minSamples} (unique=${JSON.stringify(unique)})`,
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  const maxChars = Math.max(0, ...unique);
  if (maxChars < minChars) {
    const result = {
      pass: false,
      reason: `type-in max chars ${maxChars} < minChars ${minChars}`,
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  const result = { pass: true, bundle };
  console.info("[PLAYBACK_DIAG]", "assertTypeIn PASS", {
    starts: bundle.typeIn.starts,
    uniqueSamples: unique.length,
    maxChars,
  });
  return result;
}

export function installPlaybackDiagWindowApis(): void {
  const w = window as Window & {
    __studioPlaybackDiag?: () => PlaybackDiagBundle;
    __studioPlaybackDiagClear?: () => void;
    __studioAssertTypeIn?: (options?: TypeInAssertOptions) => TypeInAssertResult;
    __studioAssertPlayEndedAtStart?: (
      options: PlayEndAtStartAssertOptions
    ) => PlayEndAtStartAssertResult;
    __protoPlaybackDiag?: () => PlaybackDiagBundle;
    __protoPlaybackDiagClear?: () => void;
    __protoAssertTypeIn?: (options?: TypeInAssertOptions) => TypeInAssertResult;
    __protoAssertPlayEndedAtStart?: (
      options: PlayEndAtStartAssertOptions
    ) => PlayEndAtStartAssertResult;
  };
  w.__studioPlaybackDiag = getPlaybackDiagBundle;
  w.__studioPlaybackDiagClear = playbackDiagClear;
  w.__studioAssertTypeIn = assertPlaybackTypeIn;
  w.__studioAssertPlayEndedAtStart = assertPlaybackPlayEndedAtStart;
  w.__protoPlaybackDiag = getPlaybackDiagBundle;
  w.__protoPlaybackDiagClear = playbackDiagClear;
  w.__protoAssertTypeIn = assertPlaybackTypeIn;
  w.__protoAssertPlayEndedAtStart = assertPlaybackPlayEndedAtStart;
  installPlaybackDiagQaBridgeApis();
}

export function uninstallPlaybackDiagWindowApis(): void {
  const w = window as Window & {
    __studioPlaybackDiag?: unknown;
    __studioAssertPlayEndedAtStart?: unknown;
    __protoAssertPlayEndedAtStart?: unknown;
    __studioPlaybackDiagClear?: unknown;
    __studioAssertTypeIn?: unknown;
    __protoPlaybackDiag?: unknown;
    __protoPlaybackDiagClear?: unknown;
    __protoAssertTypeIn?: unknown;
  };
  delete w.__studioPlaybackDiag;
  delete w.__studioPlaybackDiagClear;
  delete w.__studioAssertTypeIn;
  delete w.__studioAssertPlayEndedAtStart;
  delete w.__protoPlaybackDiag;
  delete w.__protoPlaybackDiagClear;
  delete w.__protoAssertTypeIn;
  delete w.__protoAssertPlayEndedAtStart;
  uninstallPlaybackDiagQaBridgeApis();
}
