/**
 * React ↔ Legacy thinking bridge.
 * When Chat React is mounted, `sitePilotChatThinking` publishes here instead of DOM surgery.
 */

export type ChatThinkingBridgeMode = "none" | "hint" | "playback" | "send";

export type ChatThinkingBridgeState = {
  mode: ChatThinkingBridgeMode;
  /** `data-studio-chat-frame` id to anchor playback/hint placement. */
  anchorFrameId: string | null;
  /** Bumps on each show so motion can remount dots. */
  generation: number;
};

let state: ChatThinkingBridgeState = {
  mode: "none",
  anchorFrameId: null,
  generation: 0,
};

const listeners = new Set<() => void>();

export function getChatThinkingBridgeState(): ChatThinkingBridgeState {
  return state;
}

export function subscribeChatThinkingBridge(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach((l) => l());
}

export function publishChatThinkingBridge(
  next: Omit<ChatThinkingBridgeState, "generation"> & { generation?: number }
): void {
  state = {
    mode: next.mode,
    anchorFrameId: next.anchorFrameId,
    generation:
      next.generation ??
      (next.mode === "none" ? state.generation : state.generation + 1),
  };
  notify();
}

export function clearChatThinkingBridge(): void {
  if (state.mode === "none") return;
  state = { mode: "none", anchorFrameId: null, generation: state.generation };
  notify();
}
