/**
 * Retire Legacy Frame chrome when a React screen host mounts.
 *
 * HARD: detach from the document (not only display:none) so querySelector /
 * REC play cannot hit ghost Legacy nodes with the same data-name as React.
 * Restore on unmount for tab flip / Strict Mode.
 */

export type RetireLegacyOptions = {
  /** Book-step style — only these `:scope > …` selectors. */
  hideSelectors?: readonly string[];
  /** PLP/PDP/home style — retire all direct children except these classes. */
  keepClassNames?: ReadonlySet<string>;
  /**
   * Erase-Legacy DONE screens only: delete Legacy nodes outright instead of
   * parking for restore. No `restoreLegacyUnderPage` call can bring them back
   * — use once a screen has no Legacy fallback path left (board NEXT_STEPS #8).
   */
  permanent?: boolean;
};

type ParkedNode = {
  parent: Node;
  next: ChildNode | null;
  el: HTMLElement;
};

const parkingByScreen = new Map<string, ParkedNode[]>();
const permanentlyRetiredScreens = new Set<string>();

function shouldKeepChild(
  el: HTMLElement,
  screenId: string,
  keepClassNames?: ReadonlySet<string>
): boolean {
  if (el.dataset.studioReactScreen === screenId) return true;
  if (el.classList.contains("studio-react-screen-host")) return true;
  if (!keepClassNames) return false;
  for (const cls of keepClassNames) {
    if (el.classList.contains(cls)) return true;
  }
  return false;
}

function collectRetireTargets(
  page: HTMLElement,
  screenId: string,
  options: RetireLegacyOptions
): HTMLElement[] {
  const out: HTMLElement[] = [];
  if (options.hideSelectors?.length) {
    for (const selector of options.hideSelectors) {
      page.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (shouldKeepChild(el, screenId, options.keepClassNames)) return;
        out.push(el);
      });
    }
    return out;
  }
  Array.from(page.children).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (shouldKeepChild(node, screenId, options.keepClassNames)) return;
    out.push(node);
  });
  return out;
}

/**
 * Detach Legacy nodes under `page` and stamp `data-studio-legacy-retired`.
 * Idempotent for the same screenId (re-parks any still-attached leftovers).
 *
 * `permanent: true` deletes outright — no park entry, no restore possible.
 */
export function retireLegacyUnderPage(
  page: HTMLElement,
  screenId: string,
  options: RetireLegacyOptions = {}
): void {
  const targets = collectRetireTargets(page, screenId, options);
  if (options.permanent) {
    for (const el of targets) {
      el.dataset.studioLegacyRetired = screenId;
      el.remove();
    }
    permanentlyRetiredScreens.add(screenId);
    page.dataset.studioReactScreen = screenId;
    return;
  }
  const prev = parkingByScreen.get(screenId) ?? [];
  for (const el of targets) {
    if (prev.some((p) => p.el === el)) continue;
    if (!el.parentNode) continue;
    prev.push({
      parent: el.parentNode,
      next: el.nextSibling,
      el,
    });
    el.dataset.studioLegacyRetired = screenId;
    el.style.display = "none";
    el.setAttribute("hidden", "");
    el.setAttribute("inert", "");
    el.remove();
  }
  parkingByScreen.set(screenId, prev);
  page.dataset.studioReactScreen = screenId;
}

/** Re-attach parked Legacy nodes (tab leave / unmount). */
export function restoreLegacyUnderPage(
  page: HTMLElement,
  screenId: string
): void {
  const parked = parkingByScreen.get(screenId) ?? [];
  // Reverse so nextSibling anchors stay stable.
  for (let i = parked.length - 1; i >= 0; i -= 1) {
    const slot = parked[i];
    if (!slot) continue;
    const { parent, next, el } = slot;
    try {
      if (next && next.parentNode === parent) {
        parent.insertBefore(el, next);
      } else {
        parent.appendChild(el);
      }
    } catch {
      try {
        page.appendChild(el);
      } catch {
        /* hang-safe */
      }
    }
    el.style.removeProperty("display");
    el.removeAttribute("hidden");
    el.removeAttribute("inert");
    delete el.dataset.studioLegacyRetired;
  }
  parkingByScreen.delete(screenId);
  delete page.dataset.studioReactScreen;
}

/** True when Legacy nodes for this screen are parked (detached) or still stamped in DOM. */
export function isLegacyParkedForScreen(screenId: string): boolean {
  if ((parkingByScreen.get(screenId)?.length ?? 0) > 0) return true;
  if (typeof document === "undefined") return false;
  return (
    document.querySelector(`[data-studio-legacy-retired="${screenId}"]`) != null
  );
}

/** True when Legacy is gone for this screen — parked (restorable) or permanently deleted. */
export function isLegacyRetiredForScreen(screenId: string): boolean {
  return (
    permanentlyRetiredScreens.has(screenId) || isLegacyParkedForScreen(screenId)
  );
}

/** Test helper. */
export function resetLegacyRetireParkingForTests(): void {
  parkingByScreen.clear();
  permanentlyRetiredScreens.clear();
}
