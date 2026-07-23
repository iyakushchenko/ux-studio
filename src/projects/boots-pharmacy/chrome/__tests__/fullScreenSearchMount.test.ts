/** @vitest-environment happy-dom */
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachFullScreenSearch,
  buildFullScreenSearchNotFound,
  buildFullScreenSearchQuickLinks,
  buildFullScreenSearchResultGroups,
} from "../fullScreenSearchMount";

(
  globalThis as typeof globalThis & {
    React: typeof React;
    IS_REACT_ACT_ENVIRONMENT: boolean;
  }
).React = React;
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function buildHeaderClone(): HTMLElement {
  const header = document.createElement("div");
  header.setAttribute("data-name", "boots-pharmacy.module.header");
  const item = document.createElement("div");
  item.setAttribute("data-name", "component.header.aux.nav.item");
  const label = document.createElement("p");
  label.textContent = "Search";
  item.appendChild(label);
  header.appendChild(item);
  document.body.append(header);
  return header;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("buildFullScreenSearchQuickLinks", () => {
  it("real footer + PLP copy — Vaccinations first, then Health Services footer links (no invented categories)", () => {
    const links = buildFullScreenSearchQuickLinks();
    expect(links[0].label).toBe("Vaccinations");
    expect(links.map((l) => l.label)).toContain("NHS Stop Smoking Service");
  });

  it("wires Vaccinations + PLP-bound links to the navigation handler", () => {
    const onNavigateToPlp = vi.fn();
    const links = buildFullScreenSearchQuickLinks({ onNavigateToPlp });
    const vaccinations = links.find((l) => l.label === "Vaccinations");
    expect(vaccinations?.onClick).toBe(onNavigateToPlp);
  });
});

describe("buildFullScreenSearchResultGroups", () => {
  it("empty query → no groups", () => {
    expect(buildFullScreenSearchResultGroups("")).toEqual([]);
    expect(buildFullScreenSearchResultGroups("   ")).toEqual([]);
  });

  it("matches the real PLP catalog by title/searchTerms (e.g. chickenpox)", () => {
    const groups = buildFullScreenSearchResultGroups("chickenpox");
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Vaccinations");
    expect(groups[0].links.length).toBeGreaterThan(0);
    expect(
      groups[0].links.some((l) => l.label.toLowerCase().includes("chickenpox")),
    ).toBe(true);
  });

  it("no matches → empty groups (honest no-results, not invented content)", () => {
    expect(buildFullScreenSearchResultGroups("zzz-nomatch-xyz")).toEqual([]);
  });

  it("wires matched links to the navigation handler", () => {
    const onNavigateToPlp = vi.fn();
    const groups = buildFullScreenSearchResultGroups("chickenpox", {
      onNavigateToPlp,
    });
    expect(groups[0].links[0].onClick).toBe(onNavigateToPlp);
  });
});

describe("buildFullScreenSearchNotFound", () => {
  it("empty query → undefined (no dead 'couldn't find' chrome)", () => {
    expect(buildFullScreenSearchNotFound("")).toBeUndefined();
    expect(buildFullScreenSearchNotFound("   ")).toBeUndefined();
  });

  it("typo close to a real catalog term → offers that real term, not an invented guess", () => {
    const notFound = buildFullScreenSearchNotFound("chickenpx");
    expect(notFound?.didYouMean?.label).toBe("Chickenpox");
  });

  it("unrelated query → no didYouMean (confidence floor prevents wild guesses)", () => {
    const notFound = buildFullScreenSearchNotFound("qzxjklw");
    expect(notFound?.didYouMean).toBeUndefined();
  });

  it("category suggestions reuse real footer columns with an honest 'in <categoryLabel>' hint", () => {
    const notFound = buildFullScreenSearchNotFound("chickenpx");
    const categories = notFound?.categorySuggestions ?? [];
    expect(categories.some((c) => c.categoryLabel === "Vaccinations")).toBe(true);
    expect(categories.some((c) => c.categoryLabel === "Health Services")).toBe(true);
    expect(categories.some((c) => c.categoryLabel === "Patient services")).toBe(true);
  });

  it("content suggestions are real footer 'About us' links (Patient guide, Terms and conditions)", () => {
    const notFound = buildFullScreenSearchNotFound("qzxjklw");
    const labels = (notFound?.contentSuggestions ?? []).map((l) => l.label);
    expect(labels).toContain("Patient guide");
    expect(labels).toContain("Terms and conditions");
    // No invented "Careers"/"Meet the team" content-suggestion rows.
    expect(labels).not.toContain("Careers");
  });

  it("product suggestions are real PLP catalog items with real prices (no invented discount/was-price)", () => {
    const notFound = buildFullScreenSearchNotFound("qzxjklw");
    const products = notFound?.productSuggestions ?? [];
    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(typeof p.title).toBe("string");
      expect(p.price).toMatch(/^\d+\.\d{2}$/);
    }
  });

  it("wires didYouMean, category, and product suggestions + 'View all results' to the navigation handler", () => {
    const onNavigateToPlp = vi.fn();
    const notFound = buildFullScreenSearchNotFound("chickenpx", { onNavigateToPlp });
    expect(notFound?.didYouMean?.onClick).toBe(onNavigateToPlp);
    expect(notFound?.categorySuggestions?.[0].onClick).toBe(onNavigateToPlp);
    expect(notFound?.productSuggestions?.[0].onClick).toBe(onNavigateToPlp);
    expect(notFound?.onViewAll).toBe(onNavigateToPlp);
  });
});

describe("attachFullScreenSearch", () => {
  it("mounts a closed overlay host as a descendant of headerClone (unthemed test DOM: headerClone itself lives at document.body)", () => {
    const headerClone = buildHeaderClone();
    act(() => {
      attachFullScreenSearch(headerClone);
    });
    expect(
      document.body.querySelector('[data-name="component.search.fullscreen"]'),
    ).toBeNull();
    expect(
      document.body.querySelector(".proto-header-full-screen-search-host"),
    ).toBeTruthy();
  });

  it("mounts the host INSIDE the themed [data-studio-project] subtree by nesting it inside headerClone itself, even while headerClone is still detached at call time (regression 2026-07-23 — setupHeader calls attachFullScreenSearch BEFORE inserting headerMount into scrollEl, so headerClone.closest('[data-studio-project]') always returned null; a document.body-level host then sat as a sibling of the themed root and every .uxds-link inside FSC silently fell back to raw UXDS teal #305854 instead of Boots navy #012169)", () => {
    const themedRoot = document.createElement("div");
    themedRoot.setAttribute("data-studio-project", "boots-pharmacy");
    document.body.appendChild(themedRoot);
    const headerClone = buildHeaderClone();
    // headerClone is DETACHED (not yet under themedRoot) at call time —
    // mirrors the real setupHeader ordering bug.
    headerClone.remove();

    act(() => {
      attachFullScreenSearch(headerClone);
    });

    // Simulate setupHeader's later `scrollEl.insertBefore(headerMount, ...)`.
    themedRoot.appendChild(headerClone);

    const host = themedRoot.querySelector(".proto-header-full-screen-search-host");
    expect(host).toBeTruthy();
    // Must NOT have escaped to a document.body-level sibling of the themed root.
    expect(
      Array.from(document.body.children).some(
        (child) => child.classList?.contains("proto-header-full-screen-search-host"),
      ),
    ).toBe(false);
  });

  it("opens below the studio toolbar (regression 2026-07-23 — .studio-nav-panel-host is position:relative, not removed from flow, and painted above this overlay's z-index, hiding the field row underneath an inset:0 root)", async () => {
    const chrome = document.createElement("div");
    chrome.className = "studio-nav-panel-host";
    Object.defineProperty(chrome, "getBoundingClientRect", {
      value: () => ({ height: 88, top: 0, bottom: 88, left: 0, right: 0, width: 0, x: 0, y: 0 }),
    });
    document.body.appendChild(chrome);

    const headerClone = buildHeaderClone();
    act(() => {
      attachFullScreenSearch(headerClone);
    });
    const searchItem = headerClone.querySelector(
      '[data-name="component.header.aux.nav.item"]',
    ) as HTMLElement;

    act(() => {
      searchItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const root = document.body.querySelector(
      '[data-name="module.full.screen.search"]',
    ) as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.style.top).toBe("88px");

    // Two-phase AnimatePresence exit (real timers under IS_REACT_ACT_ENVIRONMENT
    // only flush at act() boundaries) — same split as MegaMenuFlyout's tests.
    const scrim = document.body.querySelector(
      '[data-name="module.full.screen.search.scrim"]',
    );
    await act(async () => {
      scrim?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(
      document.body.querySelector('[data-name="component.search.fullscreen"]'),
    ).toBeTruthy();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(
      document.body.querySelector('[data-name="component.search.fullscreen"]'),
    ).toBeNull();
  });

  it("is idempotent — calling twice does not duplicate the search host", () => {
    const headerClone = buildHeaderClone();
    act(() => {
      attachFullScreenSearch(headerClone);
      attachFullScreenSearch(headerClone);
    });
    expect(
      document.body.querySelectorAll(".proto-header-full-screen-search-host")
        .length,
    ).toBe(1);
  });

  it("typing an unmatched query renders the 'couldn't find' scenario, not a bare no-results paragraph", () => {
    const headerClone = buildHeaderClone();
    act(() => {
      attachFullScreenSearch(headerClone);
    });
    const searchItem = headerClone.querySelector(
      '[data-name="component.header.aux.nav.item"]',
    ) as HTMLElement;
    act(() => {
      searchItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const input = document.body.querySelector(
      ".uxds-full-screen-search__input",
    ) as HTMLInputElement;
    // React tracks its own value setter — a plain `input.value =` write is
    // invisible to the controlled `onChange`, same jsdom/happy-dom quirk as
    // every other controlled-input test in this repo.
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    act(() => {
      nativeSetter?.call(input, "chickenpx");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(
      document.body.querySelector('[data-name="module.ss.couldnt.find.content.slot"]'),
    ).toBeTruthy();
    expect(document.body.textContent).toContain("Did you mean");
    expect(document.body.textContent).toContain("Chickenpox");
  });

  it("no-ops when the Search item is absent", () => {
    const header = document.createElement("div");
    document.body.append(header);
    expect(() => attachFullScreenSearch(header)).not.toThrow();
    expect(
      document.body.querySelector(".proto-header-full-screen-search-host"),
    ).toBeNull();
  });
});
