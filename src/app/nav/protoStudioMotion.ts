/**
 * Shared framer-motion timings for Studio shell chrome.
 * Matches the former CSS touchpoint label resize: width 0.34s ease (+ 0.16s shrink delay).
 */
export const STUDIO_PANEL_EASE = "easeInOut" as const;

/** Crossfade / layout duration for Playback ↔ Rec panel swap and touchpoint width. */
export const STUDIO_PANEL_DURATION_S = 0.34;

/** Delay when the touchpoint label shrinks so menus don't jump early. */
export const STUDIO_LABEL_SHRINK_DELAY_S = 0.16;

export const studioPanelTransition = {
  duration: STUDIO_PANEL_DURATION_S,
  ease: STUDIO_PANEL_EASE,
} as const;
