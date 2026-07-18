import { isPopupTouchpoint } from "@/app/nav/resolveStudioTouchpoint";
import { protoScreenAtTab } from "@/projects/boots-pharmacy/screens/protoScreens";

export type ViewportAnomalyKind = "viewport-stall" | "transport-retreat-mismatch";

export type ViewportAnomaly = {
  kind: ViewportAnomalyKind;
  message: string;
  detail?: string;
};

export type ViewportCheckContext = {
  scrollTop: number;
  baselineScrollTop: number;
  childIndex: number | null;
  baselineChildIndex: number | null;
  beatId?: string;
  baselineBeatId?: string;
  beatLabel?: string;
  baselineTouchpointKey?: string;
  touchpointKey?: string;
  isScripting: boolean;
  isPausingBeforeReveal: boolean;
  screenFramesBeat: boolean;
  anchorInView: boolean;
  anchorProminent: boolean;
  /** Derived from journey beat metadata — not hardcoded beat ids. */
  expectsViewportFollow: boolean;
  transportAction?: string;
};

export const VIEWPORT_MIN_SCROLL_DELTA_PX = 48;
export const VIEWPORT_POST_ADVANCE_CHECK_MS = 520;

export function isElementInScrollRootViewport(
  el: HTMLElement,
  scrollRoot: HTMLElement,
  marginPx = 32
): boolean {
  const rootRect = scrollRoot.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return (
    elRect.bottom > rootRect.top + marginPx &&
    elRect.top < rootRect.bottom - marginPx
  );
}

/** Anchor center must sit in the scroll root — peeks at the edge do not count. */
export function isAnchorCenterInScrollRoot(
  el: HTMLElement,
  scrollRoot: HTMLElement,
  marginPx = 48
): boolean {
  const rootRect = scrollRoot.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const centerY = elRect.top + elRect.height / 2;
  return (
    centerY >= rootRect.top + marginPx &&
    centerY <= rootRect.bottom - marginPx
  );
}

/** Focal element for same-screen viewport checks — project-agnostic selectors. */
export function findSameScreenViewportAnchor(
  root: ParentNode = document
): HTMLElement | null {
  const viewport = root.querySelector(".proto-viewport");
  if (!viewport) return null;

  const marked = viewport.querySelector<HTMLElement>("[data-proto-viewport-anchor]");
  if (marked) return marked;

  const selected = viewport.querySelector<HTMLElement>(
    '[data-proto-cal-selected="true"]'
  );
  if (selected) return selected;

  return (
    viewport.querySelector<HTMLElement>(
      '[data-proto-cal-kind="time"]:not([data-proto-cal-unavailable="true"])'
    ) ?? null
  );
}

function formatViewportDetail(ctx: ViewportCheckContext): string {
  return [
    `scrollTop=${Math.round(ctx.scrollTop)}`,
    `baselineScrollTop=${Math.round(ctx.baselineScrollTop)}`,
    `delta=${Math.round(Math.abs(ctx.scrollTop - ctx.baselineScrollTop))}px`,
    ctx.transportAction ? `transport=${ctx.transportAction}` : "",
    ctx.baselineBeatId ? `from=${ctx.baselineBeatId}` : "",
    ctx.beatId ? `to=${ctx.beatId}` : "",
    ctx.childIndex != null ? `childIndex=${ctx.childIndex}` : "",
    ctx.anchorInView ? "anchorInView=true" : "",
    ctx.anchorProminent ? "anchorProminent=true" : "",
    ctx.baselineTouchpointKey ? `fromTouchpoint=${ctx.baselineTouchpointKey}` : "",
    ctx.touchpointKey ? `toTouchpoint=${ctx.touchpointKey}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function detectViewportStallAfterAdvance(
  ctx: ViewportCheckContext
): ViewportAnomaly | null {
  if (ctx.screenFramesBeat) return null;
  if (ctx.isScripting || ctx.isPausingBeforeReveal) return null;
  if (ctx.childIndex == null || ctx.childIndex !== ctx.baselineChildIndex) {
    return null;
  }
  if (
    ctx.touchpointKey === ctx.baselineTouchpointKey &&
    ctx.beatId === ctx.baselineBeatId
  ) {
    return null;
  }
  if (!ctx.expectsViewportFollow) {
    return null;
  }
  if (
    isPopupTouchpoint(ctx.baselineTouchpointKey) ||
    isPopupTouchpoint(ctx.touchpointKey)
  ) {
    return null;
  }

  const scrollDelta = Math.abs(ctx.scrollTop - ctx.baselineScrollTop);
  if (scrollDelta >= VIEWPORT_MIN_SCROLL_DELTA_PX) return null;
  if (ctx.anchorProminent) return null;

  const label = ctx.beatLabel ?? ctx.beatId ?? "next touchpoint";
  const suffix = ctx.transportAction
    ? ` after ${ctx.transportAction}`
    : " after touchpoint advance";

  return {
    kind: "viewport-stall",
    message: `Touchpoint advanced to "${label}" but viewport scroll barely moved (${Math.round(scrollDelta)}px)${suffix}`,
    detail: formatViewportDetail(ctx),
  };
}

export type TransportRetreatCheckContext = {
  transportAction?: string;
  beatId?: string;
  beatLabel?: string;
  beatProtoTab?: number | null;
  childIndex: number | null;
  touchpointKey?: string;
  screenFramesBeat: boolean;
};

function formatTransportRetreatDetail(ctx: TransportRetreatCheckContext): string {
  const expectedChild =
    ctx.beatProtoTab != null
      ? protoScreenAtTab(ctx.beatProtoTab)?.childIndex
      : undefined;
  return [
    ctx.beatId ? `beat=${ctx.beatId}` : "",
    ctx.beatProtoTab != null ? `protoTab=${ctx.beatProtoTab}` : "",
    expectedChild != null ? `expectedChild=${expectedChild}` : "",
    ctx.childIndex != null ? `actualChild=${ctx.childIndex}` : "",
    ctx.touchpointKey ? `touchpoint=${ctx.touchpointKey}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Step back changed the journey beat but the prototype tab or touchpoint did not follow. */
export function detectTransportRetreatMismatch(
  ctx: TransportRetreatCheckContext
): ViewportAnomaly | null {
  if (ctx.transportAction !== "step-back") return null;
  if (ctx.screenFramesBeat) return null;
  if (!ctx.beatId) return null;

  const expectedChild =
    ctx.beatProtoTab != null
      ? protoScreenAtTab(ctx.beatProtoTab)?.childIndex
      : undefined;

  if (
    expectedChild != null &&
    ctx.childIndex != null &&
    ctx.childIndex !== expectedChild
  ) {
    const label = ctx.beatLabel ?? ctx.beatId;
    return {
      kind: "transport-retreat-mismatch",
      message: `Step back to "${label}" but prototype screen stayed on a different tab`,
      detail: formatTransportRetreatDetail(ctx),
    };
  }

  const beatTouchpoint = `beat:${ctx.beatId}`;
  if (
    ctx.touchpointKey &&
    ctx.touchpointKey !== beatTouchpoint &&
    !ctx.touchpointKey.startsWith(`${beatTouchpoint}:`) &&
    isPopupTouchpoint(ctx.touchpointKey)
  ) {
    const label = ctx.beatLabel ?? ctx.beatId;
    return {
      kind: "transport-retreat-mismatch",
      message: `Step back to "${label}" but studio touchpoint is still a popup overlay`,
      detail: formatTransportRetreatDetail(ctx),
    };
  }

  return null;
}
