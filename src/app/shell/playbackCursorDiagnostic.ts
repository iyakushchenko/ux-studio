import { describePlaybackElement } from "@/app/shell/playbackInteractionContext";
import { logQaCheck, logQaCursor } from "@/app/shell/controlPanelQa";
import {
  isDemoCursorFadedAtJourneyEnd,
  isDemoCursorJourneyModePinned,
  readDemoCursorDomState,
} from "@/app/scenario/demoCursor";

export type PlaybackCursorAction =
  | "travel"
  | "scroll-into-view"
  | "hover-dwell"
  | "press"
  | "click"
  | "park"
  | "unpark"
  | "fade"
  | "remove"
  | "abort"
  | "dwell-no-cursor"
  /** Legacy aliases still used in book playback scripts. */
  | "move"
  | "scroll"
  | "hover"
  | "release"
  | "script-start"
  | "script-end"
  | "dwell-sync"
  | "guard-hit";

export type PlaybackCursorPhase = "dwell" | "script" | "sync" | "idle";

export type PlaybackCursorEvent = {
  seq: number;
  ts: number;
  atMs: number;
  action: PlaybackCursorAction;
  beatId?: string;
  scriptId?: string;
  phase?: PlaybackCursorPhase;
  target?: string;
  instant?: boolean;
  animated?: boolean;
  scroll?: boolean;
  abortReason?: string;
  guardReason?: string;
  detail?: string;
  /** True when cursor travel/click occurs on a dwell-only book-step2 beat. */
  unexpectedOnDwell?: boolean;
};

export type PlaybackCursorDiagnosticContext = {
  beatId?: string;
  beatLabel?: string;
  scriptId?: string;
  phase?: PlaybackCursorPhase;
  isScripting?: boolean;
};

export type CursorDiagnosticState = {
  enabled: boolean;
  cursorVisible: boolean;
  cursorParked: boolean;
  cursorFaded: boolean;
  lastCursorAction: string | null;
  lastCursorTarget: string | null;
  lastCursorBeatId: string | null;
  cursorEventCount: number;
  unexpectedOnDwellCount: number;
  recentCursorEvents: PlaybackCursorEvent[];
  lastSummary: string;
};

const MAX_EVENTS = 20;
const BOOK_STEP2_BEATS = new Set([
  "book-step2",
  "book-step2-date",
  "book-step2-time",
  "book-step2-reserve",
]);

const TRAVEL_OR_CLICK_ACTIONS = new Set<PlaybackCursorAction>([
  "travel",
  "move",
  "click",
  "hover",
  "hover-dwell",
  "press",
]);

let seq = 0;
const ring: PlaybackCursorEvent[] = [];
let context: PlaybackCursorDiagnosticContext = {};
let lastSummary = "";
let qaEyesEnabled = false;

export function isBookStep2BeatId(beatId: string | undefined | null): boolean {
  return beatId != null && BOOK_STEP2_BEATS.has(beatId);
}

export function isBookStep2DwellBeatId(beatId: string | undefined | null): boolean {
  return beatId === "book-step2";
}

export function enableCursorQaEyes(): void {
  qaEyesEnabled = true;
}

export function disableCursorQaEyes(): void {
  qaEyesEnabled = false;
  if (typeof document !== "undefined") {
    delete document.documentElement.dataset.studioQaAutomation;
  }
}

export function isCursorQaEyesEnabled(): boolean {
  return qaEyesEnabled;
}

/** Cursor QA logs only during an explicit QA session while journey mode is on. */
export function shouldTrackCursorDiagnostics(): boolean {
  return qaEyesEnabled && isDemoCursorJourneyModePinned();
}

export function setPlaybackCursorDiagnosticContext(
  partial: PlaybackCursorDiagnosticContext
): void {
  context = { ...context, ...partial };
}

export function resetPlaybackCursorDiagnosticContext(): void {
  context = {};
}

export function resetPlaybackCursorDiagnostic(): void {
  ring.length = 0;
  seq = 0;
  lastSummary = "";
  context = {};
  qaEyesEnabled = false;
  if (typeof document !== "undefined") {
    delete document.documentElement.dataset.studioQaAutomation;
  }
}

export function describeCursorTarget(target: HTMLElement): string {
  return describePlaybackElement(target);
}

export function formatPlaybackCursorEventSummary(event: PlaybackCursorEvent): string {
  const parts = [event.action];
  if (event.beatId) parts.push(event.beatId);
  if (event.scriptId) parts.push(event.scriptId);
  if (event.target) parts.push(event.target.replace(/^<[^>]+>\s*/, "").slice(0, 48));
  if (event.abortReason) parts.push(`abort:${event.abortReason}`);
  if (event.guardReason) parts.push(`guard:${event.guardReason}`);
  if (event.unexpectedOnDwell) parts.push("unexpected-dwell");
  return parts.join(" · ");
}

function isUnexpectedOnBookStep2Dwell(
  action: PlaybackCursorAction,
  beatId: string | undefined,
  phase: PlaybackCursorPhase | undefined
): boolean {
  if (!isBookStep2DwellBeatId(beatId)) return false;
  if (phase === "sync") return false;
  if (action === "dwell-no-cursor" || action === "dwell-sync" || action === "park") {
    return false;
  }
  return TRAVEL_OR_CLICK_ACTIONS.has(action);
}

export function logCursorDiagnostic(
  action: PlaybackCursorAction,
  detail?: Omit<
    PlaybackCursorEvent,
    "seq" | "ts" | "atMs" | "action" | "beatId" | "scriptId" | "phase"
  > & {
    beatId?: string;
    scriptId?: string;
    phase?: PlaybackCursorPhase;
  }
): PlaybackCursorEvent {
  return notePlaybackCursorEvent(action, detail);
}

export function notePlaybackCursorEvent(
  action: PlaybackCursorAction,
  detail?: Omit<
    PlaybackCursorEvent,
    "seq" | "ts" | "atMs" | "action" | "beatId" | "scriptId" | "phase"
  > & {
    beatId?: string;
    scriptId?: string;
    phase?: PlaybackCursorPhase;
  }
): PlaybackCursorEvent {
  const beatId = detail?.beatId ?? context.beatId;
  const scriptId = detail?.scriptId ?? context.scriptId;
  const phase = detail?.phase ?? context.phase;
  const unexpectedOnDwell =
    detail?.unexpectedOnDwell ??
    (isUnexpectedOnBookStep2Dwell(action, beatId, phase)
      ? true
      : undefined);

  const track = shouldTrackCursorDiagnostics();
  const atMs = performance.now();
  if (!track) {
    return {
      seq: 0,
      ts: atMs,
      atMs,
      action,
      beatId,
      scriptId,
      phase,
      target: detail?.target,
      instant: detail?.instant,
      animated: detail?.animated,
      scroll: detail?.scroll,
      abortReason: detail?.abortReason,
      guardReason: detail?.guardReason,
      detail: detail?.detail,
      unexpectedOnDwell,
    };
  }

  const event: PlaybackCursorEvent = {
    seq: ++seq,
    ts: atMs,
    atMs,
    action,
    beatId,
    scriptId,
    phase,
    target: detail?.target,
    instant: detail?.instant,
    animated: detail?.animated,
    scroll: detail?.scroll,
    abortReason: detail?.abortReason,
    guardReason: detail?.guardReason,
    detail: detail?.detail,
    unexpectedOnDwell,
  };

  ring.push(event);
  if (ring.length > MAX_EVENTS) {
    ring.splice(0, ring.length - MAX_EVENTS);
  }

  lastSummary = formatPlaybackCursorEventSummary(event);

  logQaCursor({
    action,
    beatId,
    scriptId,
    phase,
    target: event.target,
    instant: event.instant,
    animated: event.animated,
    scroll: event.scroll,
    abortReason: event.abortReason,
    guardReason: event.guardReason,
    detail: event.detail,
    unexpectedOnDwell: event.unexpectedOnDwell,
    summary: lastSummary,
  });

  if (qaEyesEnabled && unexpectedOnDwell) {
    logQaCheck("book-step2-dwell-cursor", false, {
      action,
      beatId,
      target: event.target,
      detail: event.detail,
    });
  }

  return event;
}

export function getRecentPlaybackCursorEvents(limit = 8): PlaybackCursorEvent[] {
  return ring.slice(-limit);
}

export function getPlaybackCursorSummary(): {
  last: PlaybackCursorEvent | null;
  lastSummary: string;
  count: number;
  bookStep2Count: number;
  unexpectedOnDwellCount: number;
} {
  const last = ring.length > 0 ? ring[ring.length - 1]! : null;
  return {
    last,
    lastSummary,
    count: ring.length,
    bookStep2Count: ring.filter((e) => isBookStep2BeatId(e.beatId)).length,
    unexpectedOnDwellCount: ring.filter((e) => e.unexpectedOnDwell).length,
  };
}

/** Full cursor diagnostic snapshot for MCP / robot QA. */
export function getPlaybackCursorDiagnosticsSnapshot(limit = 20) {
  const summary = getPlaybackCursorSummary();
  return {
    ...summary,
    events: getRecentPlaybackCursorEvents(limit),
    context: { ...context },
  };
}

export function getCursorDiagnosticState(): CursorDiagnosticState {
  const summary = getPlaybackCursorSummary();
  const last = summary.last;
  const dom =
    typeof document !== "undefined"
      ? readDemoCursorDomState()
      : { visible: false, parked: false, faded: false };

  return {
    enabled: qaEyesEnabled,
    cursorVisible: dom.visible,
    cursorParked: dom.parked,
    cursorFaded: dom.faded || isDemoCursorFadedAtJourneyEnd(),
    lastCursorAction: last?.action ?? null,
    lastCursorTarget: last?.target ?? null,
    lastCursorBeatId: last?.beatId ?? null,
    cursorEventCount: summary.count,
    unexpectedOnDwellCount: summary.unexpectedOnDwellCount,
    recentCursorEvents: getRecentPlaybackCursorEvents(5),
    lastSummary: summary.lastSummary,
  };
}

/** Log cursor summary after transport — for robot QA / MCP smoke eyes. */
export function logCursorQaSummary(label: string, beatId?: string | null): void {
  if (!shouldTrackCursorDiagnostics()) return;
  const summary = getPlaybackCursorSummary();
  logQaCursor({
    action: "summary",
    beatId: beatId ?? undefined,
    detail: label,
    summary: `${label} · ${summary.lastSummary || "no events"} · n=${summary.count}`,
  });
}

/** Assert book-step2 dwell had no travel/click since last marker (robot QA). */
export function checkBookStep2DwellCursorViolations(
  sinceSeq = 0
): { pass: boolean; violations: PlaybackCursorEvent[] } {
  const violations = ring.filter(
    (event) =>
      event.seq > sinceSeq &&
      event.unexpectedOnDwell &&
      isBookStep2DwellBeatId(event.beatId)
  );
  return { pass: violations.length === 0, violations };
}

/** Infer script vs dwell phase for book-step2 beats from journey beat metadata. */
export function resolveBookStep2CursorPhase(options: {
  beatId?: string;
  syncState?: boolean;
  dwellOnly?: boolean;
}): PlaybackCursorPhase {
  if (options.syncState) return "sync";
  if (options.dwellOnly || isBookStep2DwellBeatId(options.beatId)) return "dwell";
  if (options.beatId && isBookStep2BeatId(options.beatId)) return "script";
  return "idle";
}

declare global {
  interface Window {
    __protoCursorDiagnostics?: () => CursorDiagnosticState;
  }
}
