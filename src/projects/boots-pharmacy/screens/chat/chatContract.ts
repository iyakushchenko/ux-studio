/** Studio / CJM contract for Agentic Site Pilot Chat React migration. */

export const CHAT_CHILD_INDEX = 10;

export const CHAT_REACT_SCREEN_ID = "chat";

export const CHAT_SCREEN_SELECTOR = `.studio-viewport > div > div:nth-child(${CHAT_CHILD_INDEX})`;

/**
 * Flip to `true` when React chat retires Make + playback hooks are ported.
 * While `false`, Make wire + composer dock remain authoritative (playback-safe).
 */
export const CHAT_REACT_MOUNT_ENABLED = false;

/** Shared composer action ids — see `screens/shared/sitePilotComposerContract.ts`. */
export const CHAT_QUERY_ACTION = "agentic-chat-query";
export const CHAT_MIC_ACTION = "agentic-chat-mic";
export const CHAT_SEND_ACTION = "agentic-chat-send";
