/** Studio / CJM contract for Agentic Site Pilot Chat React migration. */

export const CHAT_CHILD_INDEX = 10;

export const CHAT_REACT_SCREEN_ID = "chat";

export const CHAT_SCREEN_SELECTOR = `.studio-viewport > div > div:nth-child(${CHAT_CHILD_INDEX})`;

/**
 * React Chat host live — Legacy child 10 retired via `data-studio-legacy-retired`.
 * Shared composer = `SitePilotComposer` (Home + Chat). Flip off only if Quinn
 * playback P1–P10 regresses on tip.
 */
export const CHAT_REACT_MOUNT_ENABLED = true;

/** Shared composer action ids — see `screens/shared/sitePilotComposerContract.ts`. */
export const CHAT_QUERY_ACTION = "agentic-chat-query";
export const CHAT_MIC_ACTION = "agentic-chat-mic";
export const CHAT_SEND_ACTION = "agentic-chat-send";

/** True when Chat Legacy wire has been retired for the React migration (live DOM). */
export function isChatReactMounted(): boolean {
  const page = document.querySelector(CHAT_SCREEN_SELECTOR);
  return (
    page instanceof HTMLElement &&
    page.dataset.studioReactScreen === CHAT_REACT_SCREEN_ID
  );
}