import { motion } from "@/uxds/motion";
import type { ChatThinkingBridgeMode } from "./chatThinkingBridge";
import { CHAT_PULL_UP, CHAT_THINKING_EXIT } from "./chatMotion";

export type ChatThinkingBubbleProps = {
  mode: Exclude<ChatThinkingBridgeMode, "none">;
  generation: number;
};

export function ChatThinkingBubble({ mode, generation }: ChatThinkingBubbleProps) {
  // Legacy: playback toggled --hint → align-items flex-start (LEFT agent rail).
  const hint = mode === "hint" || mode === "playback";
  // Playback thinking must be visibly LEFT immediately — opacity:0 pull-up
  // made r0 look like “no thinking” (PO). Send uses full CHAT_PULL_UP enter.
  const enter =
    mode === "playback"
      ? { opacity: 1, y: 8 }
      : CHAT_PULL_UP.initial;

  return (
    <motion.div
      className={`chat__thinking${hint ? " chat__thinking--hint" : ""}`}
      data-studio-chat-thinking="true"
      data-studio-chat-thinking-side="agent"
      data-studio-chat-thinking-gen={String(generation)}
      role="status"
      aria-live="polite"
      initial={enter}
      animate={CHAT_PULL_UP.animate}
      exit={CHAT_THINKING_EXIT}
      transition={CHAT_PULL_UP.transition}
    >
      <div className="chat__thinking-inner">
        {/* CSS pulse — avoid nested FM opacity fighting thinking exit. */}
        <span className="chat__thinking-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="chat__thinking-sr">SitePilot is thinking</span>
      </div>
    </motion.div>
  );
}
