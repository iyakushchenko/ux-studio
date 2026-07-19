/**
 * Popup / lightbox "eyes" for recording replay + agent testing.
 * Never click CTAs under a blocking dialog — resolve topmost modal first.
 */

export const STUDIO_MODAL = {
  choosePharmacy: "choose-pharmacy",
} as const;

export type StudioModalId = (typeof STUDIO_MODAL)[keyof typeof STUDIO_MODAL];

const MODAL_ALIASES: Record<string, StudioModalId> = {
  "choose-pharmacy": STUDIO_MODAL.choosePharmacy,
  choosepharmacy: STUDIO_MODAL.choosePharmacy,
  availability: STUDIO_MODAL.choosePharmacy,
  avail: STUDIO_MODAL.choosePharmacy,
};

/** Known Boots / Studio blocking surfaces (outermost first preference). */
export const BLOCKING_MODAL_SELECTOR = [
  '[data-studio-modal="choose-pharmacy"]',
  ".studio-avail-scrim:not(.studio-avail-scrim--closing)",
  '[role="dialog"][aria-modal="true"]',
  '[aria-modal="true"]',
].join(", ");

export function normalizeStudioModalId(
  raw: string | null | undefined
): StudioModalId | undefined {
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase();
  if (!key) return undefined;
  return MODAL_ALIASES[key] ?? (key as StudioModalId);
}

/**
 * Topmost blocking modal/lightbox in document order (last match wins —
 * later DOM = typically painted above among peers).
 */
export function findTopmostBlockingModal(
  root: ParentNode = typeof document !== "undefined" ? document : (null as unknown as ParentNode)
): HTMLElement | null {
  if (!root || typeof (root as Document).querySelectorAll !== "function") {
    return null;
  }
  const nodes = (root as Document | Element).querySelectorAll<HTMLElement>(
    BLOCKING_MODAL_SELECTOR
  );
  if (nodes.length === 0) return null;
  // Prefer an open avail scrim when present (canonical Boots lightbox).
  for (let i = nodes.length - 1; i >= 0; i--) {
    const el = nodes[i];
    if (
      el.classList.contains("studio-avail-scrim") &&
      !el.classList.contains("studio-avail-scrim--closing")
    ) {
      return el;
    }
  }
  return nodes[nodes.length - 1] ?? null;
}

/** True when a blocking lightbox is open. */
export function isBlockingModalOpen(
  root: ParentNode = typeof document !== "undefined" ? document : (null as unknown as ParentNode)
): boolean {
  return findTopmostBlockingModal(root) != null;
}

/**
 * True when `el` is outside the topmost modal (click-through risk).
 * Studio chrome (agent overlay / nav) is never "under" a concept modal.
 */
export function isElementBlockedByModal(
  el: Element | null,
  root: ParentNode = typeof document !== "undefined" ? document : (null as unknown as ParentNode)
): boolean {
  if (!el) return false;
  if (el.closest(".studio-agent-testing-overlay, .studio-nav-panel-host")) {
    return false;
  }
  const modal = findTopmostBlockingModal(root);
  if (!modal) return false;
  return !modal.contains(el);
}

/**
 * Resolve a replay/agent click target that respects the topmost dialog.
 * Returns null when the intended target sits under a modal (do not click through).
 */
export function resolveClickTargetRespectingModal(
  target: HTMLElement | null,
  options?: {
    root?: ParentNode;
    /** Prefer a hit inside the modal when the outer target is blocked. */
    resolveInModal?: (modal: HTMLElement) => HTMLElement | null;
  }
): HTMLElement | null {
  const root = options?.root ?? (typeof document !== "undefined" ? document : null);
  if (!root) return target;
  const modal = findTopmostBlockingModal(root);
  if (!modal) return target;
  if (target && modal.contains(target)) return target;
  if (options?.resolveInModal) {
    const inside = options.resolveInModal(modal);
    if (inside) return inside;
  }
  return null;
}
