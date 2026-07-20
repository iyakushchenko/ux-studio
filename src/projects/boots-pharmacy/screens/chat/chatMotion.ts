import { MOTION_EASE_IN_OUT } from "@/uxds/motion";

/**
 * Make / sitePilotChat pull-up for progressive bubbles.
 * User: slot height 0→auto + bubble pull-up (same tween as agent).
 * Agent: in-slot thinking→reply; thinking exits opacity-only (no y collapse).
 */
export const CHAT_PULL_UP = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
  transition: { duration: 0.34, ease: MOTION_EASE_IN_OUT },
} as const;

/** Thinking leave — opacity only so in-slot reply pull-up isn’t undercut by height collapse. */
export const CHAT_THINKING_EXIT = {
  opacity: 0,
  y: 0,
  transition: { duration: 0.22, ease: MOTION_EASE_IN_OUT },
} as const;

/** Match sitePilotChat pull-up settle window (ms). */
export const CHAT_PULL_UP_MS = Math.round(CHAT_PULL_UP.transition.duration * 1000);

export type ChatBubbleMotionPhase =
  | "mount"
  | "animate-start"
  | "frame"
  | "animate-end"
  | "thinking-handoff"
  | "exit";

export type ChatBubbleMotionPayload = {
  id: string;
  phase: ChatBubbleMotionPhase;
  y?: number | null;
  opacity?: number | null;
  layoutY?: number | null;
  deltaY?: number | null;
  shouldAnimate: boolean;
  visibleCount?: number | null;
  note?: string;
};

/**
 * Per-bubble motion diag — phase + rAF frame samples.
 * Filter DevTools: `[PLAYBACK_DIAG] chat-bubble-motion`
 */
export function logChatBubbleMotion(payload: ChatBubbleMotionPayload): void {
  console.info("[PLAYBACK_DIAG] chat-bubble-motion", {
    id: payload.id,
    phase: payload.phase,
    y: payload.y ?? null,
    opacity: payload.opacity ?? null,
    layoutY: payload.layoutY ?? null,
    deltaY: payload.deltaY ?? null,
    shouldAnimate: payload.shouldAnimate,
    visibleCount: payload.visibleCount ?? null,
    note: payload.note ?? null,
  });
}

function readTransformY(el: HTMLElement): number {
  const transform = getComputedStyle(el).transform;
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
 * Sample a bubble across animation frames (transform y + layout top).
 * Returns cancel fn. Proves continuous ease vs abrupt jumps.
 */
export function startChatBubbleMotionSample(options: {
  id: string;
  el: HTMLElement | null;
  shouldAnimate: boolean;
  visibleCount?: number;
  durationMs?: number;
}): () => void {
  if (!options.el || !options.shouldAnimate) return () => {};
  const start = performance.now();
  const durationMs = options.durationMs ?? CHAT_PULL_UP_MS + 80;
  let prevLayoutY: number | null = null;
  let raf = 0;
  let stopped = false;

  const tick = () => {
    if (stopped || !options.el) return;
    const now = performance.now();
    const style = getComputedStyle(options.el);
    const y = readTransformY(options.el);
    const opacity = Number.parseFloat(style.opacity);
    const layoutY =
      Math.round(options.el.getBoundingClientRect().top * 100) / 100;
    const deltaY =
      prevLayoutY == null
        ? 0
        : Math.round((layoutY - prevLayoutY) * 100) / 100;
    prevLayoutY = layoutY;

    logChatBubbleMotion({
      id: options.id,
      phase: "frame",
      y: Math.round(y * 100) / 100,
      opacity: Number.isFinite(opacity) ? Math.round(opacity * 100) / 100 : null,
      layoutY,
      deltaY,
      shouldAnimate: options.shouldAnimate,
      visibleCount: options.visibleCount ?? null,
    });

    if (now - start < durationMs) {
      raf = requestAnimationFrame(tick);
    }
  };

  raf = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}
