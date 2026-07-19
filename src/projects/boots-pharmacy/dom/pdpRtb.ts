import {
  ensureCheckboxRow,
  markBoosterCheckboxRow,
} from "./inputControls";
import { wireProtoIconHitButtons } from "./iconHitWire";
import {
  applyWishlistHeartVisual,
  isInWishlist,
  PDP_WISHLIST_ID,
  toggleWishlist,
} from "@/projects/boots-pharmacy/chrome/headerMount";
import {
  PDP_PRICE_WITH_BOOSTER,
  PDP_PRICE_WITHOUT_BOOSTER,
} from "@/projects/boots-pharmacy/data/orderPricing";

const PDP_SCREEN_SELECTOR = ".studio-viewport > div > div:nth-child(8)";
const PDP_RTB_MODULE_SELECTOR = `${PDP_SCREEN_SELECTOR} [data-name="module.pdp.rtb"]`;

export function getPdpRtbStackSource(): HTMLElement | null {
  const module = document.querySelector<HTMLElement>(PDP_RTB_MODULE_SELECTOR);
  if (!module) return null;

  const stack = module.parentElement;
  if (stack?.querySelector('[data-name="component.gse.system.message"]')) {
    return stack;
  }
  return module;
}

/** Deep-clone PDP RTB card + promo bar for Quick View (same Figma DOM, not a rewrite). */
export function clonePdpRtbStack(): HTMLElement | null {
  const source = getPdpRtbStackSource();
  if (!source) return null;
  const clone = source.cloneNode(true) as HTMLElement;
  clone.dataset.studioQuickViewClone = "true";
  clone.classList.add("proto-quick-view-rtb-stack");
  return clone;
}

function isCheckAvailabilityBtn(btn: HTMLElement): boolean {
  return /^check availability$/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim());
}

function isViewDetailsBtn(btn: HTMLElement): boolean {
  return (
    btn.dataset.studioQuickViewDetails === "true" ||
    /^view details$/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())
  );
}

function isBookNowBtn(btn: HTMLElement): boolean {
  return /^book now/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim());
}

function prepareViewDetailsButton(root: HTMLElement): HTMLElement | null {
  const btn = Array.from(
    root.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
  ).find((candidate) => isCheckAvailabilityBtn(candidate) || isViewDetailsBtn(candidate));
  if (!btn) return null;

  const label = btn.querySelector("p");
  if (label) label.textContent = "View Details";
  btn.dataset.studioQuickViewDetails = "true";
  btn.hidden = false;
  btn.style.removeProperty("display");
  return btn;
}

function wireClickableButton(
  btn: HTMLElement,
  onClick: () => void,
  cleanups: Array<() => void>
): void {
  btn.setAttribute("role", "button");
  btn.tabIndex = 0;
  btn.style.cursor = "pointer";
  const handler = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };
  btn.addEventListener("click", handler);
  cleanups.push(() => btn.removeEventListener("click", handler));
}

function wireWishlistButton(root: HTMLElement, cleanups: Array<() => void>): void {
  const favIcon = root.querySelector<HTMLElement>("[data-name='icon=add to wishlist']");
  const favBtn = favIcon?.closest<HTMLElement>("[data-name='component.input.button']");
  if (!favBtn || !favIcon) return;

  applyWishlistHeartVisual(favIcon, isInWishlist(PDP_WISHLIST_ID));

  wireClickableButton(
    favBtn,
    () => {
      toggleWishlist(PDP_WISHLIST_ID);
    },
    cleanups
  );
}

function syncQuickViewLoginBlock(root: HTMLElement, loggedIn: boolean): void {
  const reqText = Array.from(root.querySelectorAll<HTMLParagraphElement>("p")).find((p) =>
    p.textContent?.includes("Boots Account will be required")
  );
  const loginBlock = reqText?.parentElement;
  if (loginBlock) {
    loginBlock.style.display = loggedIn ? "none" : "";
  }
}

function wireQuickViewLoginLinks(
  root: HTMLElement,
  onOpenLogin: (tab: "signin" | "create") => void,
  cleanups: Array<() => void>
): void {
  root.querySelectorAll<HTMLParagraphElement>("p").forEach((p) => {
    const text = (p.textContent ?? "").trim();
    if (text !== "Quick Sign In" && text !== "Create Boots Account") return;

    p.classList.add("proto-link");
    p.style.cursor = "pointer";
    const tab: "signin" | "create" = text === "Create Boots Account" ? "create" : "signin";
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      onOpenLogin(tab);
    };
    p.addEventListener("click", handler);
    cleanups.push(() => p.removeEventListener("click", handler));
  });
}

export function syncQuickViewBoosterState(
  root: HTMLElement,
  includeBoosterDose: boolean
): void {
  const checkboxRow = root.querySelector<HTMLElement>(
    "[data-name='component.input.checkbox']"
  );
  if (checkboxRow) {
    markBoosterCheckboxRow(checkboxRow);
    ensureCheckboxRow(checkboxRow);
    checkboxRow.dataset.checkboxChecked = String(includeBoosterDose);
    checkboxRow.style.cursor = "pointer";

    const checkboxSection = checkboxRow.closest<HTMLElement>("[data-name='units']");
    if (checkboxSection) {
      checkboxSection.style.setProperty("background", "white", "important");
      Array.from(checkboxSection.children).forEach((child) => {
        if (child !== checkboxRow) {
          (child as HTMLElement).style.setProperty("background", "transparent", "important");
        }
      });
    }
  }

  const bookBtn = Array.from(
    root.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
  ).find(isBookNowBtn);
  const priceSpan = bookBtn
    ? Array.from(bookBtn.querySelectorAll("span")).pop()
    : null;
  if (priceSpan) {
    priceSpan.textContent = String(
      includeBoosterDose ? PDP_PRICE_WITH_BOOSTER : PDP_PRICE_WITHOUT_BOOSTER
    );
  }
}

export type QuickViewRtbHandlers = {
  onBookNow: () => void;
  onViewDetails: () => void;
  onToggleBooster: () => void;
  onOpenLogin: (tab: "signin" | "create") => void;
  loggedIn: boolean;
};

export function wireQuickViewRtb(
  root: HTMLElement,
  handlers: QuickViewRtbHandlers
): () => void {
  if (root.dataset.studioQuickViewWired === "1") {
    return () => {};
  }
  root.dataset.studioQuickViewWired = "1";

  wireProtoIconHitButtons(root);
  syncQuickViewLoginBlock(root, handlers.loggedIn);

  const cleanups: Array<() => void> = [];

  const bookBtn = Array.from(
    root.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
  ).find(isBookNowBtn);
  if (bookBtn) {
    wireClickableButton(bookBtn, handlers.onBookNow, cleanups);
  }

  const viewDetailsBtn = prepareViewDetailsButton(root);
  if (viewDetailsBtn) {
    wireClickableButton(viewDetailsBtn, handlers.onViewDetails, cleanups);
  }

  const checkboxRow = root.querySelector<HTMLElement>(
    "[data-name='component.input.checkbox']"
  );
  if (checkboxRow) {
    markBoosterCheckboxRow(checkboxRow);
    ensureCheckboxRow(checkboxRow);
    wireClickableButton(checkboxRow, handlers.onToggleBooster, cleanups);
  }

  wireWishlistButton(root, cleanups);
  wireQuickViewLoginLinks(root, handlers.onOpenLogin, cleanups);

  const tabs = Array.from(
    root.querySelectorAll<HTMLElement>("[data-name='units']")
  ).filter((el) => !el.classList.contains("w-full"));
  tabs.forEach((tab, i) => {
    tab.dataset.toggleIndex = String(i);
    tab.style.cursor = "pointer";
    tab.style.userSelect = "none";
    tab.style.transition = "background 0.18s ease, box-shadow 0.18s ease";
  });

  const activate = (idx: number) => {
    tabs.forEach((tab, i) => {
      if (i === idx) tab.dataset.toggleActive = "true";
      else delete tab.dataset.toggleActive;
    });
  };
  activate(0);
  requestAnimationFrame(() => activate(0));

  tabs.forEach((tab, idx) => {
    const onClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      activate(idx);
    };
    tab.addEventListener("click", onClick);
    cleanups.push(() => tab.removeEventListener("click", onClick));
  });

  return () => {
    delete root.dataset.studioQuickViewWired;
    cleanups.forEach((fn) => fn());
  };
}
