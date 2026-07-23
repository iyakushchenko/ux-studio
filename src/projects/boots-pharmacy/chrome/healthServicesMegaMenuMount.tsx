/**
 * Attaches the UXDS `MegaMenuFlyout` kit to the cloned header's
 * "Health Services" mega-menu nav item — hover-open, same show/hide pacing
 * as the login flyout in `headerMount.tsx`. Content = real Boots copy already
 * in the app (footer link columns + the PLP Vaccinations hero + the Boots
 * Advantage Card promo line) — reshaped to fill the kit's 3-column-grid +
 * hero + promo layout (Figma: node 7650:86049), not invented.
 */
import { createRoot, type Root } from "react-dom/client";
import {
  MegaMenuFlyout,
  type MegaMenuFlyoutProps,
} from "@/uxds/interactions/MegaMenuFlyout";
import {
  FOOTER_LINK_COLUMNS,
  footerLinkLabel,
  footerLinkScreen,
} from "@/projects/boots-pharmacy/chrome/footerContent";
import {
  capPlpFilterOptionList,
  PLP_AGE_OPTIONS,
  PLP_COUNTRY_OPTIONS,
  PLP_DISEASE_OPTIONS,
  PLP_REGION_OPTIONS,
} from "@/projects/boots-pharmacy/screens/plp/plpCatalog";
import plpHeroImage from "@/projects/boots-pharmacy/frame/5b75d20d7a0df34031ca23477a68cf97cac4938d.png";

export const HEALTH_SERVICES_MEGA_MENU_LABEL = "Health Services";
const FLYOUT_HOST_CLASS = "proto-header-mega-menu-flyout-host";
const SHOW_DELAY_MS = 100;
const HIDE_DELAY_MS = 200;

/** Real footer columns to surface in row 1 (services). */
const FOOTER_ROW_TITLES = ["Health Services", "Acne & Skin", "Patient services"];
/** Row 3 pairs the remaining footer column with the PLP country facet. */
const FOOTER_ABOUT_TITLE = "About us";

/** Same promo line already shown on PLP/PDP (`plp__advantage-text`). */
const ADVANTAGE_CARD_PROMO =
  "Collect 3 points for every £1 you spend with Boots Advantage Card‡";

/**
 * Flyout is a scan-and-go glance panel, not the full PLP sidebar/footer —
 * cap each group to a curated top-N rather than dumping every facet option
 * ("we do not want wikipedia there" — PO 2026-07-23).
 */
const GROUP_LINK_MAX = 5;

export type HealthServicesMegaMenuHandlers = {
  onNavigateToPlp?: () => void;
};

/** Slug for a stable per-link `data-studio-action` REC/CJM capture target. */
function slugifyLinkAction(groupTitle: string, label: string): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return `mega-menu-flyout-${slug(groupTitle)}-${slug(label)}`;
}

function footerGroup(title: string, onNavigateToPlp?: () => void) {
  const column = FOOTER_LINK_COLUMNS.find((c) => c.title === title);
  return {
    title,
    links: (column?.links ?? []).slice(0, GROUP_LINK_MAX).map((link) => {
      const label = footerLinkLabel(link);
      return {
        label,
        onClick: footerLinkScreen(link) === "plp" ? onNavigateToPlp : undefined,
        actionId: slugifyLinkAction(title, label),
      };
    }),
  };
}

/** PLP sidebar facet options → a flyout group (same real facet labels/titles as the PLP filter panel, curated to a top-N glance list). */
function facetGroup(
  title: string,
  options: readonly string[],
  onNavigateToPlp?: () => void,
) {
  return {
    title,
    links: options.slice(0, GROUP_LINK_MAX).map((label) => ({
      label,
      onClick: onNavigateToPlp,
      actionId: slugifyLinkAction(title, label),
    })),
  };
}

/**
 * Real Boots content reshaped into the flyout's 3-row grid + hero + promo
 * (Figma: node 7650:86049) — no invented categories, marketing copy, or
 * imagery. Row 1 = footer service columns. Rows 2–3 = the same PLP sidebar
 * facets (`By Age` / `By Disease` / `By Region` / `By Country`) shown on the
 * Vaccinations listing, plus the remaining footer "About us" column.
 */
export function buildHealthServicesMegaMenuContent(
  handlers: HealthServicesMegaMenuHandlers = {},
): Pick<MegaMenuFlyoutProps, "linkRows" | "hero" | "promoText"> {
  const { onNavigateToPlp } = handlers;

  const servicesRow = FOOTER_ROW_TITLES.map((title) =>
    footerGroup(title, onNavigateToPlp),
  );
  const facetsRow = [
    facetGroup("By Age", PLP_AGE_OPTIONS, onNavigateToPlp),
    facetGroup("By Disease", PLP_DISEASE_OPTIONS, onNavigateToPlp),
    facetGroup("By Region", PLP_REGION_OPTIONS, onNavigateToPlp),
  ];
  const moreRow = [
    footerGroup(FOOTER_ABOUT_TITLE, onNavigateToPlp),
    // Same PLP_FILTER_LIST_MAX cap the PLP sidebar itself applies before "View all".
    facetGroup(
      "By Country",
      capPlpFilterOptionList(PLP_COUNTRY_OPTIONS),
      onNavigateToPlp,
    ),
  ];

  return {
    linkRows: [servicesRow, facetsRow, moreRow],
    hero: {
      image: { src: plpHeroImage, alt: "Vaccinations" },
      title: "Vaccinations",
      cta: { label: "Explore Vaccinations", onClick: onNavigateToPlp },
    },
    promoText: ADVANTAGE_CARD_PROMO,
  };
}

function findMegaMenuItem(
  headerClone: HTMLElement,
  label: string,
): HTMLElement | null {
  const items = headerClone.querySelectorAll<HTMLElement>(
    '[data-name="component.mega.menu.item"]',
  );
  for (const item of items) {
    const text = (
      item.querySelector("p")?.textContent ??
      item.textContent ??
      ""
    ).trim();
    if (text.toLowerCase() === label.toLowerCase()) return item;
  }
  return null;
}

const hostRoots = new WeakMap<HTMLElement, Root>();

/** Idempotent — safe to call once per header clone (guarded like `setupHeader`). */
export function attachHealthServicesMegaMenu(
  headerClone: HTMLElement,
  handlers: HealthServicesMegaMenuHandlers = {},
): void {
  const anchorItem = findMegaMenuItem(
    headerClone,
    HEALTH_SERVICES_MEGA_MENU_LABEL,
  );
  if (!anchorItem) return;

  // Mount into the sticky header container (headerClone's parent), not the
  // narrow nav item, so the wide flyout panel can center under the full
  // header width instead of being clipped/offset by the item's own bounds.
  const positioningRoot = headerClone.parentElement ?? headerClone;
  if (positioningRoot === headerClone) {
    headerClone.style.position = "relative";
  }
  anchorItem.style.cursor = "pointer";

  let host = positioningRoot.querySelector<HTMLElement>(
    `.${FLYOUT_HOST_CLASS}`,
  );
  if (!host) {
    host = document.createElement("div");
    host.className = FLYOUT_HOST_CLASS;
    host.style.cssText =
      "position: absolute; top: 100%; left: 0; width: 100%; display: flex; justify-content: center; z-index: 998; pointer-events: none;";
    positioningRoot.appendChild(host);
  }

  let root = hostRoots.get(host);
  if (!root) {
    root = createRoot(host);
    hostRoots.set(host, root);
  }

  const content = buildHealthServicesMegaMenuContent(handlers);
  let open = false;
  let showTimeout: ReturnType<typeof setTimeout> | null = null;
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;

  const render = () => {
    host!.style.pointerEvents = open ? "auto" : "none";
    root!.render(<MegaMenuFlyout {...content} open={open} onDismiss={forceClose} />);
  };
  render();

  /** Escape / scrim click — close now, no 200ms hover hide delay. */
  function forceClose(): void {
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    if (!open) return;
    open = false;
    render();
  }

  const scheduleShow = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    if (open) return;
    showTimeout = setTimeout(() => {
      open = true;
      render();
    }, SHOW_DELAY_MS);
  };
  const scheduleHide = () => {
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }
    hideTimeout = setTimeout(() => {
      open = false;
      render();
    }, HIDE_DELAY_MS);
  };

  anchorItem.addEventListener("mouseenter", scheduleShow);
  anchorItem.addEventListener("mouseleave", scheduleHide);
  host.addEventListener("mouseenter", scheduleShow);
  host.addEventListener("mouseleave", scheduleHide);
}
