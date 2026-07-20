/**
 * UX-agnostic retreat sync bus — shell dispatches after beat retreat; project wire
 * listens and resets React/local state that DOM-only playback cannot reach.
 */

export type RetreatChannel = "home" | "avail" | "book" | "tab" | "dwell" | "camera";

export type RetreatSyncDetail = {
  beatId: string;
  channel: RetreatChannel;
  scriptId?: string;
  /** Project-defined intent key — wire handlers filter on this, not beat ids. */
  intent?: string;
  data?: Record<string, unknown>;
};

export const RETREAT_SYNC_EVENT = "studio-retreat-sync";

export function dispatchRetreatSync(detail: RetreatSyncDetail): void {
  window.dispatchEvent(
    new CustomEvent<RetreatSyncDetail>(RETREAT_SYNC_EVENT, {
      detail,
    })
  );
}

export function onRetreatSync(
  handler: (detail: RetreatSyncDetail) => void
): () => void {
  const listener = (event: Event) => {
    const custom = event as CustomEvent<RetreatSyncDetail>;
    if (custom.detail) handler(custom.detail);
  };
  window.addEventListener(RETREAT_SYNC_EVENT, listener);
  return () => window.removeEventListener(RETREAT_SYNC_EVENT, listener);
}
