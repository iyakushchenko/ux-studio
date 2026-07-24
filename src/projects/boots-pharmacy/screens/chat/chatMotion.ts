import { MOTION_EASE_IN_OUT, STUDIO_ENTER_MS } from "@/uxds/motion";
import { playbackDiagChatBubbleMotion } from "@/app/shell/playbackDiag";

/**
 * Legacy / sitePilotChat pull-up for progressive bubbles.
 * User + agent: shared opacity+y ease (no height 0→auto stepping).
 * Agent thinking exits opacity-only (no y collapse).
 */
export const CHAT_PULL_UP = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
  transition: {
    duration: STUDIO_ENTER_MS / 1000,
    ease: MOTION_EASE_IN_OUT,
  },
} as const;

/** Thinking leave — opacity only; same duration as reply enter (sync handoff). */
export const CHAT_THINKING_EXIT = {
  opacity: 0,
  y: 0,
  transition: {
    duration: STUDIO_ENTER_MS / 1000,
    ease: MOTION_EASE_IN_OUT,
  },
} as const;

/** Match platform enter / camera co-travel (ms). */
export const CHAT_PULL_UP_MS = STUDIO_ENTER_MS;

/** Scroll lock while any bubble pull-up tween runs (prevents layoutY JUMP). */
let chatPullUpScrollLocks = 0;

export function acquireChatPullUpScrollLock(): () => void {
  chatPullUpScrollLocks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    chatPullUpScrollLocks = Math.max(0, chatPullUpScrollLocks - 1);
  };
}

export function isChatPullUpScrollLocked(): boolean {
  return chatPullUpScrollLocks > 0;
}

/** Test-only. */
export function resetChatPullUpScrollLockForTests(): void {
  chatPullUpScrollLocks = 0;
}

export type ChatBubbleMotionPhase =
  | "mount"
  | "animate-start"
  | "frame"
  | "animate-end"
  | "thinking-handoff"
  | "exit"
  | "trace";

/** Composer-exit / camera TRACE snapshot (Save Log root-cause). */
export type ChatBubbleComposerTrace = {
  scrollTop: number | null;
  scrollMax: number | null;
  scrollLock: boolean;
  composerDockTop: number | null;
  bubbleBottom: number | null;
  clearPx: number | null;
  underComposer: boolean;
  cameraTag?: string | null;
  deltaScrollTop?: number | null;
};

export type ChatBubbleMotionPayload = {
  id: string;
  phase: ChatBubbleMotionPhase;
  y?: number | null;
  opacity?: number | null;
  layoutY?: number | null;
  deltaY?: number | null;
  /** Host scrollTop during sample (stutter forensics). */
  scrollTop?: number | null;
  shouldAnimate: boolean;
  visibleCount?: number | null;
  note?: string;
  trace?: ChatBubbleComposerTrace | null;
  chop?: boolean;
  chopReason?: string | null;
};

const SCROLL_CHOP_PX = 18;
/** Premium motion guard: >2 dropped 60Hz frames, or sustained sub-42fps. */
const FRAME_GAP_CHOP_MS = 38;
const SLOW_FRAME_MS = 24;
const SLOW_FRAME_STREAK = 3;

/**
 * Measure bubble vs composer dock + scroll host — TRACE for composer-exit chop.
 */
export function readChatBubbleComposerTrace(
  el: HTMLElement | null,
  options?: { cameraTag?: string | null; prevScrollTop?: number | null }
): ChatBubbleComposerTrace {
  const empty: ChatBubbleComposerTrace = {
    scrollTop: null,
    scrollMax: null,
    scrollLock: isChatPullUpScrollLocked(),
    composerDockTop: null,
    bubbleBottom: null,
    clearPx: null,
    underComposer: false,
    cameraTag: options?.cameraTag ?? null,
    deltaScrollTop: null,
  };
  if (!el) return empty;
  try {
    const host =
      el.closest<HTMLElement>(".chat__column") ??
      el.closest<HTMLElement>("[data-studio-react-screen]");
    const dock =
      host?.parentElement?.querySelector<HTMLElement>(".chat__composer-dock") ??
      document.querySelector<HTMLElement>(
        '[data-studio-react-screen="chat"] .chat__composer-dock'
      );
    const scrollTop = host ? host.scrollTop : null;
    const scrollMax = host
      ? Math.max(0, host.scrollHeight - host.clientHeight)
      : null;
    const bubbleBottom =
      Math.round(el.getBoundingClientRect().bottom * 100) / 100;
    const composerDockTop =
      dock && !dock.hidden
        ? Math.round(dock.getBoundingClientRect().top * 100) / 100
        : null;
    const clearPx =
      composerDockTop != null
        ? Math.round((composerDockTop - bubbleBottom) * 100) / 100
        : null;
    const deltaScrollTop =
      scrollTop != null &&
      options?.prevScrollTop != null &&
      Number.isFinite(options.prevScrollTop)
        ? Math.round((scrollTop - options.prevScrollTop) * 100) / 100
        : null;
    return {
      scrollTop,
      scrollMax,
      scrollLock: isChatPullUpScrollLocked(),
      composerDockTop,
      bubbleBottom,
      clearPx,
      underComposer: clearPx != null && clearPx < 0,
      cameraTag: options?.cameraTag ?? null,
      deltaScrollTop,
    };
  } catch {
    return empty;
  }
}

/**
 * Per-bubble motion diag — phase + rAF frame samples.
 * Gate-open only → PLAYBACK_DIAG ring + QA Save Log (`chatBubbleMotion`).
 * Filter DevTools: `[PLAYBACK_DIAG] chat-bubble-motion`
 */
export function logChatBubbleMotion(payload: ChatBubbleMotionPayload): void {
  playbackDiagChatBubbleMotion({
    id: payload.id,
    phase: payload.phase,
    y: payload.y ?? null,
    opacity: payload.opacity ?? null,
    layoutY: payload.layoutY ?? null,
    deltaY: payload.deltaY ?? null,
    scrollTop: payload.scrollTop ?? payload.trace?.scrollTop ?? null,
    shouldAnimate: payload.shouldAnimate,
    visibleCount: payload.visibleCount ?? null,
    note: payload.note ?? null,
    trace: payload.trace ?? null,
    chop: payload.chop ?? false,
    chopReason: payload.chopReason ?? null,
  });
}

/**
 * Camera / clearance TRACE line (settle, top-up, defer) → bubble motion dump.
 */
export function logChatRevealCameraTrace(options: {
  id?: string;
  tag: string;
  el?: HTMLElement | null;
  visibleCount?: number | null;
  delta?: number | null;
  clearPx?: number | null;
}): void {
  const el =
    options.el ??
    (typeof document !== "undefined"
      ? (document.querySelector(
          '[data-studio-chat-revealed="true"][data-studio-chat-pull-up]'
        ) as HTMLElement | null)
      : null);
  const trace = readChatBubbleComposerTrace(el, { cameraTag: options.tag });
  if (options.clearPx != null) {
    trace.clearPx = options.clearPx;
    trace.underComposer = options.clearPx < 0;
  }
  const chop =
    /topup/i.test(options.tag) &&
    (trace.underComposer ||
      (typeof options.clearPx === "number" && options.clearPx < 0));
  // clearance-ok / near-miss top-up (clearPx 0..15) is TRACE forensics only —
  // must NOT hard-CHOP / fail-handoff halt Play (PO: bubble-chop on q1).
  logChatBubbleMotion({
    id: options.id ?? "camera",
    phase: "trace",
    shouldAnimate: true,
    visibleCount: options.visibleCount ?? null,
    scrollTop: trace.scrollTop,
    note: `camera:${options.tag}`,
    trace,
    chop,
    chopReason: chop
      ? `clearance-topup underComposer clearPx=${options.clearPx ?? trace.clearPx}`
      : /topup|clearance/i.test(options.tag)
        ? `clearance clearPx=${options.clearPx ?? trace.clearPx}`
        : null,
  });
}

function readTransformY(style: CSSStyleDeclaration): number {
  const transform = style.transform;
  if (!transform || transform === "none") return 0;
  const m = transform.match(/matrix\(([^)]+)\)/);
  if (m) {
    const parts = m[1]!.split(",").map((p) => Number.parseFloat(p.trim()));
    if (parts.length >= 6 && Number.isFinite(parts[5]!)) return parts[5]!;
  }
  const m3 = transform.match(/matrix3d\(([^)]+)\)/);
  if (m3) {
    const parts = m3[1]!.split(",").map((p) => Number.parseFloat(p.trim()));
    if (parts.length >= 14 && Number.isFinite(parts[13]!)) return parts[13]!;
  }
  return 0;
}

/**
 * Sample a bubble across animation frames (transform y + layout top + TRACE).
 * Returns cancel fn. Proves continuous ease vs abrupt jumps / composer-exit chop.
 */
export function startChatBubbleMotionSample(options: {
  id: string;
  el: HTMLElement | null;
  shouldAnimate: boolean;
  visibleCount?: number;
  durationMs?: number;
}): () => void {
  if (!options.el || !options.shouldAnimate) return () => {};
  const releaseScroll = acquireChatPullUpScrollLock();
  // Do NOT cancel camera here — pull-up + host-end must co-travel so the
  // bubble finishes appearing already on its target scroll position.
  const start = performance.now();
  const durationMs = options.durationMs ?? CHAT_PULL_UP_MS + 80;
  let prevLayoutY: number | null = null;
  let prevScrollTop: number | null = null;
  let prevFrameAt: number | null = null;
  let slowFrameStreak = 0;
  let cadenceChopLatched = false;
  let raf = 0;
  let stopped = false;

  const tick = () => {
    if (stopped || !options.el) return;
    const now = performance.now();
    const frameGapMs = prevFrameAt == null ? null : now - prevFrameAt;
    prevFrameAt = now;
    if (frameGapMs != null && frameGapMs > SLOW_FRAME_MS) {
      slowFrameStreak += 1;
    } else {
      slowFrameStreak = 0;
    }
    // One computed-style read + one bubble rect per frame. The old sampler
    // forced the same layouts repeatedly and could create the stutter it was
    // intended to diagnose while the QA gate was open.
    const style = getComputedStyle(options.el);
    const y = readTransformY(style);
    const opacity = Number.parseFloat(style.opacity);
    const bubbleRect = options.el.getBoundingClientRect();
    const layoutY = Math.round(bubbleRect.top * 100) / 100;
    const deltaY =
      prevLayoutY == null
        ? 0
        : Math.round((layoutY - prevLayoutY) * 100) / 100;
    prevLayoutY = layoutY;
    const trace = readChatBubbleComposerTrace(options.el, {
      cameraTag: "pull-up-raf",
      prevScrollTop,
    });
    prevScrollTop = trace.scrollTop;
    // Co-travel scroll during lock is expected — don't flag as chop here.
    const scrollChop =
      typeof trace.deltaScrollTop === "number" &&
      Math.abs(trace.deltaScrollTop) > SCROLL_CHOP_PX &&
      !trace.scrollLock;
    // A delayed rAF after the bubble has already reached its final pose is a
    // scheduler delay, not a visible bubble chop. Only fail cadence while the
    // bubble is still perceptibly moving/fading.
    const motionStillVisible =
      Math.abs(y) > 0.5 ||
      (Number.isFinite(opacity) && opacity < 0.98) ||
      Math.abs(deltaY) > 0.5;
    const cadenceChop =
      !cadenceChopLatched &&
      motionStillVisible &&
      frameGapMs != null &&
      (frameGapMs > FRAME_GAP_CHOP_MS || slowFrameStreak >= SLOW_FRAME_STREAK);
    if (cadenceChop) cadenceChopLatched = true;
    const chop = scrollChop || cadenceChop;
    const chopReason = scrollChop
      ? `scrollTop Δ=${trace.deltaScrollTop}`
      : cadenceChop
        ? `dropped-frame cadence gap=${frameGapMs.toFixed(1)}ms streak=${slowFrameStreak}`
        : null;

    logChatBubbleMotion({
      id: options.id,
      phase: "frame",
      y: Math.round(y * 100) / 100,
      opacity: Number.isFinite(opacity) ? Math.round(opacity * 100) / 100 : null,
      layoutY,
      deltaY,
      scrollTop: trace.scrollTop,
      shouldAnimate: options.shouldAnimate,
      visibleCount: options.visibleCount ?? null,
      trace,
      chop,
      chopReason,
    });

    if (now - start < durationMs) {
      raf = requestAnimationFrame(tick);
    } else {
      releaseScroll();
    }
  };

  raf = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    releaseScroll();
  };
}
