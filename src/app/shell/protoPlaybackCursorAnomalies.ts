export const PROTO_DEMO_CURSOR_SELECTOR = ".proto-chat-demo-cursor";
export const PROTO_DEMO_CURSOR_PARKED_CLASS = "proto-chat-demo-cursor--parked";

export type CursorAnomalyKind =
  | "cursor-stale"
  | "cursor-orphaned"
  | "selection-without-director"
  | "director-step-skipped"
  | "director-step-no-effect";

export type CursorAnomaly = {
  kind: CursorAnomalyKind;
  message: string;
  detail?: string;
};

export type CursorCheckContext = {
  cursorCount: number;
  isScripting: boolean;
  isOnAir: boolean;
  isPausingBeforeReveal: boolean;
  journeyMode?: boolean;
  transportAction?: string;
  beatId?: string;
  beatLabel?: string;
  childIndex?: number | null;
  touchpointLabel?: string;
};

export const CURSOR_POST_TRANSPORT_CHECK_MS = 220;
export const CURSOR_SCRIPTING_END_CHECK_MS = 180;
export const CURSOR_BEAT_CHANGE_GRACE_MS = 480;

export function countDemoCursors(root: ParentNode = document): number {
  return root.querySelectorAll(PROTO_DEMO_CURSOR_SELECTOR).length;
}

export function areAllDemoCursorsParked(root: ParentNode = document): boolean {
  const cursors = root.querySelectorAll<HTMLElement>(PROTO_DEMO_CURSOR_SELECTOR);
  if (cursors.length === 0) return false;
  return Array.from(cursors).every((cursor) =>
    cursor.classList.contains(PROTO_DEMO_CURSOR_PARKED_CLASS)
  );
}

/** CJM keeps one robo-cursor in the DOM between director steps — not a leak. */
function isJourneyCursorExpected(ctx: CursorCheckContext): boolean {
  return Boolean(ctx.journeyMode) && ctx.cursorCount === 1;
}

export function isCursorAllowedDuringPlayback(
  ctx: Pick<CursorCheckContext, "isScripting" | "isPausingBeforeReveal">
): boolean {
  return ctx.isScripting || ctx.isPausingBeforeReveal;
}

function formatCursorDetail(ctx: CursorCheckContext): string {
  return [
    `cursorCount=${ctx.cursorCount}`,
    ctx.transportAction ? `transport=${ctx.transportAction}` : "",
    ctx.isScripting ? "scripting=true" : "",
    ctx.isOnAir ? "onAir=true" : "",
    ctx.isPausingBeforeReveal ? "pausing=true" : "",
    ctx.beatId ? `beat=${ctx.beatId}` : "",
    ctx.childIndex != null ? `childIndex=${ctx.childIndex}` : "",
    ctx.touchpointLabel ? `touchpoint=${ctx.touchpointLabel}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function detectCursorStale(ctx: CursorCheckContext): CursorAnomaly | null {
  if (ctx.cursorCount <= 0) return null;
  if (isCursorAllowedDuringPlayback(ctx)) return null;
  if (isJourneyCursorExpected(ctx)) return null;

  const suffix = ctx.transportAction
    ? ` after ${ctx.transportAction}`
    : " while transport is idle";

  return {
    kind: "cursor-stale",
    message: `Demo cursor still visible (${ctx.cursorCount})${suffix}`,
    detail: formatCursorDetail(ctx),
  };
}

export function detectCursorOrphaned(ctx: CursorCheckContext): CursorAnomaly | null {
  if (ctx.cursorCount <= 0) return null;
  if (isCursorAllowedDuringPlayback(ctx)) return null;
  if (isJourneyCursorExpected(ctx)) return null;

  return {
    kind: "cursor-orphaned",
    message: `Demo cursor orphaned after beat or screen change (${ctx.cursorCount} visible)`,
    detail: formatCursorDetail(ctx),
  };
}
