/**
 * Platform Motion entry — import from here, not raw `framer-motion` / `motion`.
 * Policy: docs/product/MOTION.md
 */
export {
  animate,
  AnimatePresence,
  easeInOut,
  motion,
  useReducedMotion,
  type AnimationPlaybackControls,
  type Transition,
} from "framer-motion";

/** Default light-touch tween — ease-in-out, no spring / back / overshoot. */
export const MOTION_EASE_IN_OUT = "easeInOut" as const;

export const motionEaseInOutTransition = {
  ease: MOTION_EASE_IN_OUT,
} as const;
