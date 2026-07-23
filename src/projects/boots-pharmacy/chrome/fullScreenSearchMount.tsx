/**
 * Attaches the UXDS `FullScreenSearch` kit to the cloned header's "Search"
 * aux nav item — click-to-open takeover (not hover, unlike the mega-menu
 * flyout), same overlay techniques (scrim, Escape/scrim-click dismiss,
 * AnimatePresence motion). Content = real Boots copy already in the app
 * (footer service links + the PLP vaccine catalog's own titles/search
 * terms), not invented — same discipline as `healthServicesMegaMenuMount.tsx`.
 */
import { createRoot, type Root } from "react-dom/client";
import {
  FullScreenSearch,
  type FullScreenSearchCategorySuggestion,
  type FullScreenSearchLinkGroup,
  type FullScreenSearchNotFound,
  type FullScreenSearchProductSuggestion,
} from "@/uxds/interactions/FullScreenSearch";
import type { UxdsTextLinkItem } from "@/uxds/interactions/UxdsTextLink";
import {
  FOOTER_LINK_COLUMNS,
  footerLinkLabel,
  footerLinkScreen,
} from "@/projects/boots-pharmacy/chrome/footerContent";
import {
  PLP_BUNDLE_CATALOG,
  PLP_JAB_ITEMS,
  type PlpCatalogItem,
} from "@/projects/boots-pharmacy/screens/plp/plpCatalog";

export type FullScreenSearchHandlers = {
  onNavigateToPlp?: () => void;
};

const SEARCH_RESULT_MAX = 6;
const FSC_HOST_CLASS = "proto-header-full-screen-search-host";

/** Slug for a stable per-link `data-studio-action` REC/CJM capture target. */
function slugifyLinkAction(groupTitle: string, label: string): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return `full-screen-search-${slug(groupTitle)}-${slug(label)}`;
}

/**
 * Real footer + PLP-vaccinations copy, curated to a short glance list — same
 * "not Wikipedia" discipline as the mega-menu flyout (PO 2026-07-23).
 */
export function buildFullScreenSearchQuickLinks(
  handlers: FullScreenSearchHandlers = {},
): UxdsTextLinkItem[] {
  const { onNavigateToPlp } = handlers;
  const healthServices = FOOTER_LINK_COLUMNS.find(
    (c) => c.title === "Health Services",
  );
  const labels = [
    "Vaccinations",
    ...(healthServices?.links ?? []).map((l) => footerLinkLabel(l)),
  ];
  const seen = new Set<string>();
  const links: UxdsTextLinkItem[] = [];
  for (const label of labels) {
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const sourceLink = healthServices?.links.find(
      (l) => footerLinkLabel(l) === label,
    );
    const goesToPlp =
      label === "Vaccinations" ||
      (sourceLink && footerLinkScreen(sourceLink) === "plp");
    links.push({
      label,
      onClick: goesToPlp ? onNavigateToPlp : undefined,
      actionId: slugifyLinkAction("Quick Links", label),
    });
    if (links.length >= 6) break;
  }
  return links;
}

function catalogMatches(item: PlpCatalogItem, query: string): boolean {
  const haystack = [
    item.title,
    item.subtitle,
    ...item.searchTerms,
    ...item.diseases,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

/** Live grouped matches for the typed query — real PLP catalog, not invented. */
export function buildFullScreenSearchResultGroups(
  query: string,
  handlers: FullScreenSearchHandlers = {},
): FullScreenSearchLinkGroup[] {
  const { onNavigateToPlp } = handlers;
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches = [...PLP_JAB_ITEMS, ...PLP_BUNDLE_CATALOG].filter((item) =>
    catalogMatches(item, q),
  );
  if (matches.length === 0) return [];

  return [
    {
      title: "Vaccinations",
      links: matches.slice(0, SEARCH_RESULT_MAX).map((item) => ({
        label: item.title,
        onClick: onNavigateToPlp,
        actionId: slugifyLinkAction("Vaccinations", item.title),
      })),
    },
  ];
}

/** Plain edit-distance — no dependency, small alphabets (search queries). */
function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Closest real catalog item to a typo'd query — only offered when the edit
 * distance is a small fraction of the term length, so a short unrelated
 * query never gets a wild "did you mean" guess (no invented correction).
 */
function findClosestCatalogItem(query: string): PlpCatalogItem | undefined {
  if (query.length < 3) return undefined;
  const catalog = [...PLP_JAB_ITEMS, ...PLP_BUNDLE_CATALOG];
  let best: { item: PlpCatalogItem; normalized: number } | undefined;
  for (const item of catalog) {
    for (const candidate of [item.title, ...item.searchTerms]) {
      const c = candidate.toLowerCase();
      const distance = levenshtein(query, c);
      const normalized = distance / Math.max(query.length, c.length);
      if (normalized > 0.4) continue;
      if (!best || normalized < best.normalized) best = { item, normalized };
    }
  }
  return best?.item;
}

/**
 * "Couldn't find" scenario (Figma node 21362:294522) — only built when the
 * query has zero direct catalog matches. Every field pulls from real Boots
 * data already curated elsewhere (PLP catalog, footer columns) — same
 * "not Wikipedia" / no-invent discipline as the other builders in this file.
 * A typo-tolerant "did you mean" is offered only above a confidence floor
 * (`findClosestCatalogItem`); category/content suggestions reuse the real
 * footer columns; product suggestions are real PLP items with real prices,
 * rendered without product photography (Boots' catalog has none — see
 * `FullScreenSearchNotFound.productSuggestions` JSDoc for why that's an
 * intentional under-match, not a gap).
 */
export function buildFullScreenSearchNotFound(
  query: string,
  handlers: FullScreenSearchHandlers = {},
): FullScreenSearchNotFound | undefined {
  const { onNavigateToPlp } = handlers;
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  const closest = findClosestCatalogItem(q);

  const healthServices = FOOTER_LINK_COLUMNS.find((c) => c.title === "Health Services");
  const patientServices = FOOTER_LINK_COLUMNS.find((c) => c.title === "Patient services");
  const aboutUs = FOOTER_LINK_COLUMNS.find((c) => c.title === "About us");

  const categorySuggestions: FullScreenSearchCategorySuggestion[] = [];
  if (closest) {
    categorySuggestions.push({
      label: closest.title,
      categoryLabel: "Vaccinations",
      onClick: onNavigateToPlp,
      actionId: slugifyLinkAction("Category Suggestions", closest.title),
    });
  }
  const otherHealthService = healthServices?.links.find(
    (l) => footerLinkScreen(l) !== "plp",
  );
  if (otherHealthService) {
    const label = footerLinkLabel(otherHealthService);
    categorySuggestions.push({
      label,
      categoryLabel: "Health Services",
      actionId: slugifyLinkAction("Category Suggestions", label),
    });
  }
  const firstPatientService = patientServices?.links[0];
  if (firstPatientService) {
    const label = footerLinkLabel(firstPatientService);
    categorySuggestions.push({
      label,
      categoryLabel: "Patient services",
      actionId: slugifyLinkAction("Category Suggestions", label),
    });
  }

  const contentSuggestions: UxdsTextLinkItem[] = (aboutUs?.links ?? [])
    .map((l) => footerLinkLabel(l))
    .filter((label) => label === "Patient guide" || label === "Terms and conditions")
    .map((label) => ({
      label,
      actionId: slugifyLinkAction("Content Suggestions", label),
    }));

  const productSuggestions: FullScreenSearchProductSuggestion[] = PLP_JAB_ITEMS.slice(
    0,
    4,
  ).map((item) => ({
    title: item.title,
    price: item.price,
    onClick: onNavigateToPlp,
    actionId: slugifyLinkAction("Product Suggestions", item.title),
  }));

  return {
    didYouMean: closest
      ? {
          label: closest.title,
          onClick: onNavigateToPlp,
          actionId: slugifyLinkAction("Did You Mean", closest.title),
        }
      : undefined,
    categorySuggestions: categorySuggestions.length ? categorySuggestions : undefined,
    contentSuggestions: contentSuggestions.length ? contentSuggestions : undefined,
    productSuggestions: productSuggestions.length ? productSuggestions : undefined,
    viewAllLabel: "View all results",
    onViewAll: onNavigateToPlp,
  };
}

function findSearchNavItem(headerClone: HTMLElement): HTMLElement | null {
  const auxItems = headerClone.querySelectorAll<HTMLElement>(
    '[data-name="component.header.aux.nav.item"]',
  );
  for (const item of auxItems) {
    const text = (item.textContent ?? "").trim();
    if (text.includes("Search")) return item;
  }
  return null;
}

const hostRoots = new WeakMap<HTMLElement, Root>();

/**
 * `--project-brand-*` remaps in `theme.css` are scoped to
 * `[data-studio-project="boots-pharmacy"]` (the `.studio-app-root` element) —
 * a CSS custom property only cascades to that element's own descendants. A
 * host mounted on `document.body` sits as a **sibling** of that element, so
 * every `.uxds-link` / themed token inside it silently falls back to the raw
 * UXDS baseline instead of Boots brand (regression 2026-07-23 — FSC links
 * rendered UXDS teal `#305854` instead of Boots navy `#012169`).
 *
 * `headerClone` itself is still **detached** at the point `setupHeader`
 * calls this (`headerMount.tsx` inserts it into `scrollEl` *after* this
 * function runs), so `headerClone.closest("[data-studio-project]")` always
 * returns `null` here — walking up is a dead end. Mounting the host as a
 * **descendant of `headerClone`** (same trick `MegaMenuFlyout` uses for its
 * positioning root) sidesteps the ordering problem entirely: the host
 * travels with the clone into the themed subtree once it's inserted.
 * `position: fixed` still covers the full viewport from any depth — no
 * ancestor in this subtree sets `transform`/`filter`/`contain`.
 */
function findFscMountParent(headerClone: HTMLElement): HTMLElement {
  return headerClone;
}

/** Idempotent — safe to call once per header clone (guarded like `setupHeader`). */
export function attachFullScreenSearch(
  headerClone: HTMLElement,
  handlers: FullScreenSearchHandlers = {},
): void {
  const searchItem = findSearchNavItem(headerClone);
  if (!searchItem) return;
  searchItem.style.cursor = "pointer";

  const mountParent = findFscMountParent(headerClone);
  let host = mountParent.querySelector<HTMLElement>(`.${FSC_HOST_CLASS}`);
  if (!host) {
    host = document.createElement("div");
    host.className = FSC_HOST_CLASS;
    mountParent.appendChild(host);
  }

  let root = hostRoots.get(host);
  if (!root) {
    root = createRoot(host);
    hostRoots.set(host, root);
  }

  const quickLinks = buildFullScreenSearchQuickLinks(handlers);
  let open = false;
  let value = "";
  let topOffset = 0;

  const render = () => {
    const resultGroups = buildFullScreenSearchResultGroups(value, handlers);
    root!.render(
      <FullScreenSearch
        open={open}
        value={value}
        onValueChange={(next) => {
          value = next;
          render();
        }}
        onDismiss={close}
        quickLinks={quickLinks}
        resultGroups={resultGroups}
        notFound={
          resultGroups.length === 0
            ? buildFullScreenSearchNotFound(value, handlers)
            : undefined
        }
        topOffset={topOffset}
      />,
    );
  };
  render();

  /** Studio chrome (`.studio-nav-panel-host`) is `position: relative`, not
   * removed from flow — a `position: fixed` overlay must start below its
   * live rendered height or its own top edge paints underneath the toolbar. */
  function measureStudioChromeHeight(): number {
    const chrome = document.querySelector(".studio-nav-panel-host");
    return chrome ? chrome.getBoundingClientRect().height : 0;
  }

  function openSearch(): void {
    if (open) return;
    open = true;
    value = "";
    topOffset = measureStudioChromeHeight();
    render();
  }
  function close(): void {
    if (!open) return;
    open = false;
    render();
  }

  searchItem.addEventListener("click", openSearch);
}
