import { MOTION_EASE_IN_OUT } from "@/uxds/motion";

/**
 * Quality Motion pull-up for new bubbles / thinking → reply.
 * Stronger than Make’s 8px so progressive CJM reads as rise, not flat appear.
 */
export const CHAT_PULL_UP = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.48, ease: MOTION_EASE_IN_OUT },
} as const;
