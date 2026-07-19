/**
 * Shared Accordion expand/collapse timings — kept in sync with accordion.css
 * (grid-template-rows + opacity; no height:auto / framer measure).
 */

/** Premium ease-out (interactive kit pieces). */
export const ACCORDION_EASE = [0.22, 1, 0.36, 1] as const;

/** Matches `.uxds-accordion-content` grid-template-rows duration. */
export const ACCORDION_CONTENT_DURATION_S = 0.32;

/** Probe settle floor — duration + small buffer for paint. */
export const ACCORDION_PROBE_SETTLE_MS = Math.ceil(
  ACCORDION_CONTENT_DURATION_S * 1000 + 80
);

/** @deprecated Prefer CSS grid motion; kept for callers that still read transition objects. */
export const accordionContentTransition = {
  duration: ACCORDION_CONTENT_DURATION_S,
  ease: ACCORDION_EASE,
} as const;
