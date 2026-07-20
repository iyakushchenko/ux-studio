import { motion, MOTION_EASE_IN_OUT } from "@/uxds/motion";
import type { ChatThinkingBridgeMode } from "./chatThinkingBridge";
import { CHAT_PULL_UP } from "./chatMotion";

export type ChatThinkingBubbleProps = {
  mode: Exclude<ChatThinkingBridgeMode, "none">;
  generation: number;
};

export function ChatThinkingBubble({ mode, generation }: ChatThinkingBubbleProps) {
  // Make: playback toggled --hint → align-items flex-start (LEFT agent rail).
  const hint = mode === "hint" || mode === "playback";

  return (
    <motion.div
      key={`thinking-${generation}-${mode}`}
      className={`chat__thinking${hint ? " chat__thinking--hint" : ""}`}
      data-studio-chat-thinking="true"
      data-studio-chat-thinking-side="agent"
      role="status"
      aria-live="polite"
        // Enter pull-up OK; exit must not y-collapse — reply replaces in-slot.
      initial={CHAT_PULL_UP.initial}
      animate={CHAT_PULL_UP.animate}
      exit={{ opacity: 0, y: 0 }}
      transition={CHAT_PULL_UP.transition}
    >
      <div className="chat__thinking-inner">
        <span className="chat__thinking-dots" aria-hidden="true">
          <motion.span
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1, repeat: Infinity, ease: MOTION_EASE_IN_OUT }}
          />
          <motion.span
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: MOTION_EASE_IN_OUT,
              delay: 0.15,
            }}
          />
          <motion.span
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: MOTION_EASE_IN_OUT,
              delay: 0.3,
            }}
          />
        </span>
        <span className="chat__thinking-sr">SitePilot is thinking</span>
      </div>
    </motion.div>
  );
}
