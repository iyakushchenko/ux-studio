/**
 * Whether beat-enter may call goToTab for the beat's protoTab.
 *
 * When CJM is off (`scenarioBrowseMode`), manual Studio tabs own the viewport.
 * Beat-index sync may fall back to the journey start beat for screens outside
 * the active CJM (e.g. Book Step 1 under agentic-cjm) — that must not redirect.
 */
export function shouldNavigateBeatTabOnEnter(
  scenarioBrowseMode: boolean,
  suppressInitialBeatTabNav: boolean
): boolean {
  return !suppressInitialBeatTabNav && !scenarioBrowseMode;
}
