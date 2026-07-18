/**
 * UX-agnostic retreat sync bus — shell dispatches after beat retreat; project wire
 * listens and resets React/local state that DOM-only playback cannot reach.
 */

export type ProtoRetreatChannel = "home" | "avail" | "book" | "tab" | "dwell";

export type ProtoRetreatSyncDetail = {
  beatId: string;
  channel: ProtoRetreatChannel;
  scriptId?: string;
  /** Project-defined intent key — wire handlers filter on this, not beat ids. */
  intent?: string;
  data?: Record<string, unknown>;
};

export const PROTO_RETREAT_SYNC_EVENT = "proto-retreat-sync";

export function dispatchProtoRetreatSync(detail: ProtoRetreatSyncDetail): void {
  window.dispatchEvent(
    new CustomEvent<ProtoRetreatSyncDetail>(PROTO_RETREAT_SYNC_EVENT, {
      detail,
    })
  );
}

export function onProtoRetreatSync(
  handler: (detail: ProtoRetreatSyncDetail) => void
): () => void {
  const listener = (event: Event) => {
    const custom = event as CustomEvent<ProtoRetreatSyncDetail>;
    if (custom.detail) handler(custom.detail);
  };
  window.addEventListener(PROTO_RETREAT_SYNC_EVENT, listener);
  return () => window.removeEventListener(PROTO_RETREAT_SYNC_EVENT, listener);
}
