/**
 * Engine → React chat progressive disclosure.
 *
 * `useScenarioPlayback` visibleCount is the control point (beat/frame steps).
 * React Chat mounts the full thread for `collectSitePilotChatScenarioFrames`
 * but paints only frames with index < visibleCount — Legacy-parity step reveal.
 */

export type ChatScenarioRevealState = {
  /** site-pilot-chat scenario active (CJM or browse on chat tab). */
  active: boolean;
  /** Content frames to paint (finale virtual beat clamped by consumers). */
  visibleCount: number;
};

let state: ChatScenarioRevealState = {
  active: false,
  visibleCount: 0,
};

const listeners = new Set<() => void>();

export function getChatScenarioRevealState(): ChatScenarioRevealState {
  return state;
}

export function subscribeChatScenarioReveal(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach((l) => l());
}

export function publishChatScenarioReveal(
  next: ChatScenarioRevealState
): void {
  if (
    state.active === next.active &&
    state.visibleCount === next.visibleCount
  ) {
    return;
  }
  state = {
    active: next.active,
    visibleCount: Math.max(0, next.visibleCount),
  };
  notify();
}

export function clearChatScenarioReveal(): void {
  if (!state.active && state.visibleCount === 0) return;
  state = { active: false, visibleCount: 0 };
  notify();
}

/**
 * CJM-on chat mount — kill stale inactive full-thread hold (CJM-off browse /
 * prior journey end) before first paint. Silent by default (no notify): call
 * from first render so useSyncExternalStore getSnapshot sees q0. Pass
 * `notify: true` from useLayoutEffect so sibling roots / diag catch up.
 * Overlay hold is unaffected — ChatScreen does not remount under avail.
 * Returns true when a stale hold was reset to progressive entry (q0).
 */
export function seedCjmOnProgressiveEntryFromStaleHold(options?: {
  notify?: boolean;
}): boolean {
  if (state.active || state.visibleCount <= 1) return false;
  state = { active: true, visibleCount: 1 };
  if (options?.notify) notify();
  return true;
}

/** Flush reveal listeners after a silent seed (same state — publish is no-op). */
export function flushChatScenarioRevealListeners(): void {
  notify();
}

/** Clamp engine count onto scripted content frames (never blank on CJM entry). */
export function resolveChatRevealedFrameCount(
  engineVisibleCount: number,
  contentFrameTotal: number,
  minVisible = 1
): number {
  if (contentFrameTotal <= 0) return 0;
  if (!Number.isFinite(engineVisibleCount) || engineVisibleCount <= 0) {
    return Math.min(minVisible, contentFrameTotal);
  }
  return Math.max(
    minVisible,
    Math.min(Math.floor(engineVisibleCount), contentFrameTotal)
  );
}

/**
 * Legacy order: thinking bubble → then agent reply.
 * Hold reply paint while playback thinking is anchored to that frame,
 * even if engine visibleCount already advanced (race / skipPrelude regress).
 * Null/missing anchor during playback = first agent turn (r0) — still hold.
 */
export function isChatReplyHeldForPlaybackThinking(
  frameId: string,
  thinking: { mode: string; anchorFrameId: string | null }
): boolean {
  if (thinking.mode !== "playback") return false;
  if (thinking.anchorFrameId) return thinking.anchorFrameId === frameId;
  // Handoff race: playback thinking latched before React frame ids resolved.
  return frameId === "r0";
}

/** Whether a thread frame should paint as revealed. */
export function resolveChatFrameRevealed(
  frameIndex: number,
  revealedFrameCount: number,
  frameId: string,
  thinking: { mode: string; anchorFrameId: string | null }
): boolean {
  if (frameIndex >= revealedFrameCount) return false;
  if (isChatReplyHeldForPlaybackThinking(frameId, thinking)) return false;
  return true;
}

/**
 * Frames that should Motion pull-up this paint — only when exactly one id
 * newly becomes revealed (progressive SF or thinking→reply release).
 * Batch paints (size≠1) return empty so later bubbles do not thrash.
 */
export function resolveChatPullUpAnimateIds(
  frameIds: readonly string[],
  revealedFrameCount: number,
  thinking: { mode: string; anchorFrameId: string | null },
  previouslyRevealedIds: ReadonlySet<string>,
  scenarioActive: boolean
): Set<string> {
  const animate = new Set<string>();
  if (!scenarioActive) return animate;

  const now = new Set<string>();
  frameIds.forEach((id, index) => {
    if (resolveChatFrameRevealed(index, revealedFrameCount, id, thinking)) {
      now.add(id);
    }
  });

  const fresh: string[] = [];
  now.forEach((id) => {
    if (!previouslyRevealedIds.has(id)) fresh.push(id);
  });
  if (fresh.length === 1) animate.add(fresh[0]!);
  return animate;
}

export type ChatRevealKind = "user" | "thinking" | "agent";

/**
 * One clear console line per paint transition — enough to spot wrong order
 * without guessing: user → (no think) → thinking → agent.
 */
export function logChatReveal(payload: {
  kind: ChatRevealKind;
  index: number;
  visibleCount: number;
  frameId?: string | null;
}): void {
  const body = {
    kind: payload.kind,
    index: payload.index,
    visibleCount: payload.visibleCount,
    frameId: payload.frameId ?? null,
  };
  console.info("[PLAYBACK_DIAG] chat-reveal", body);
}

/** Layout-order dump of summary children (q / r / thinking). */
export function dumpChatThreadDomOrder(visibleCount: number): Array<{
  kind: string;
  id: string | null;
  revealed: string | null;
  hidden: boolean;
}> {
  const summary = document.querySelector(
    '[data-studio-react-screen="chat"] [data-name="component.appointment.summary"], main.chat [data-name="component.appointment.summary"]'
  );
  if (!summary) {
    console.info("[PLAYBACK_DIAG] chat-dom-order", {
      visibleCount,
      order: [],
      note: "summary-missing",
    });
    return [];
  }
  const order = Array.from(summary.children)
    .filter((n): n is HTMLElement => n instanceof HTMLElement)
    .filter(
      (el) =>
        el.hasAttribute("data-studio-chat-frame") ||
        el.hasAttribute("data-studio-chat-thinking")
    )
    .map((el) => {
      if (el.hasAttribute("data-studio-chat-thinking")) {
        return {
          kind: "thinking",
          id: el.getAttribute("data-studio-chat-thinking"),
          revealed: "true",
          hidden: el.hidden,
        };
      }
      const name = el.getAttribute("data-name");
      return {
        kind: name === "query" ? "user" : name === "reply" ? "agent" : name ?? "?",
        id: el.getAttribute("data-studio-chat-frame"),
        revealed: el.getAttribute("data-studio-chat-revealed"),
        hidden: el.hidden,
      };
    });
  console.info("[PLAYBACK_DIAG] chat-dom-order", { visibleCount, order });
  return order;
}
