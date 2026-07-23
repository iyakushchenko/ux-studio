/** @vitest-environment happy-dom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FullScreenSearch } from "../FullScreenSearch";

(
  globalThis as typeof globalThis & {
    React: typeof React;
    IS_REACT_ACT_ENVIRONMENT: boolean;
  }
).React = React;
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const css = readFileSync(resolve(__dirname, "../full-screen-search.css"), "utf8");

const QUICK_LINKS = [{ label: "Vaccination" }, { label: "Skin Scanning" }];

function renderFsc(props: Partial<React.ComponentProps<typeof FullScreenSearch>> = {}) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const base: React.ComponentProps<typeof FullScreenSearch> = {
    open: true,
    value: "",
    onValueChange: vi.fn(),
    onDismiss: vi.fn(),
    quickLinks: QUICK_LINKS,
    ...props,
  };
  act(() => {
    root.render(React.createElement(FullScreenSearch, base));
  });
  return {
    host,
    props: base,
    rerender: (next: Partial<React.ComponentProps<typeof FullScreenSearch>>) => {
      act(() => {
        root.render(React.createElement(FullScreenSearch, { ...base, ...next }));
      });
    },
  };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("FullScreenSearch kit", () => {
  it("exports a reusable component", () => {
    expect(typeof FullScreenSearch).toBe("function");
  });

  it("stamps the UXDS component name + registers as a blocking overlay (data-studio-modal)", () => {
    const { host } = renderFsc();
    expect(host.querySelector('[data-name="component.search.fullscreen"]')).toBeTruthy();
    expect(host.querySelector('[data-studio-modal="full-screen-search"]')).toBeTruthy();
  });

  it("empty query → renders Quick Links (Figma node 2544:589387), no result groups", () => {
    const { host } = renderFsc();
    expect(host.querySelector('[data-name="component.ss.initial.suggestions"]')).toBeTruthy();
    expect(host.textContent).toContain("Quick Links");
    expect(host.textContent).toContain("Vaccination");
    expect(host.querySelector('[data-name="component.ss.query.suggestions"]')).toBeNull();
  });

  it("non-empty query with resultGroups → renders grouped matches, not Quick Links", () => {
    const { host } = renderFsc({
      value: "vacc",
      resultGroups: [{ title: "Vaccinations", links: [{ label: "Chickenpox" }] }],
    });
    expect(host.querySelector('[data-name="component.ss.query.suggestions"]')).toBeTruthy();
    expect(host.textContent).toContain("Chickenpox");
    expect(host.querySelector('[data-name="component.ss.initial.suggestions"]')).toBeNull();
  });

  it("non-empty query with no matches → honest no-results message, not empty dead chrome", () => {
    const { host } = renderFsc({ value: "zzz-nomatch", resultGroups: [] });
    const noResults = host.querySelector('[data-name="search.no-results"]');
    expect(noResults).toBeTruthy();
    expect(noResults?.textContent).toContain("zzz-nomatch");
  });

  it("notFound (Figma node 21362:294522) takes priority over noResultsText when both given", () => {
    const { host } = renderFsc({
      value: "lptops",
      resultGroups: [],
      noResultsText: "should not render",
      notFound: { didYouMean: { label: "Laptops" } },
    });
    expect(host.querySelector('[data-name="module.ss.couldnt.find.content.slot"]')).toBeTruthy();
    expect(host.querySelector('[data-name="search.no-results"]')).toBeNull();
    expect(host.textContent).not.toContain("should not render");
    expect(host.textContent).toContain('Sorry, we couldn\'t find "lptops"');
    expect(host.textContent).toContain("Did you mean");
    expect(host.textContent).toContain("Laptops");
  });

  it("notFound with no fields set falls back to noResultsText (kit never renders empty dead chrome)", () => {
    const { host } = renderFsc({
      value: "zzz",
      resultGroups: [],
      notFound: {},
    });
    expect(host.querySelector('[data-name="module.ss.couldnt.find.content.slot"]')).toBeNull();
    expect(host.querySelector('[data-name="search.no-results"]')).toBeTruthy();
  });

  it("notFound renders category suggestions with their 'in <categoryLabel>' hint", () => {
    const { host } = renderFsc({
      value: "lptops",
      resultGroups: [],
      notFound: {
        categorySuggestions: [
          { label: "Ultra-Thin Series", categoryLabel: "Products" },
        ],
      },
    });
    const group = host.querySelector('[data-name="Category Suggestions"]');
    expect(group).toBeTruthy();
    expect(group?.textContent).toContain("Ultra-Thin Series");
    expect(group?.textContent).toContain("in");
    expect(group?.textContent).toContain("Products");
  });

  it("notFound renders content suggestions as plain shared-pattern links (no 'in' hint)", () => {
    const { host } = renderFsc({
      value: "lptops",
      resultGroups: [],
      notFound: {
        contentSuggestions: [{ label: "Patient guide" }],
      },
    });
    const group = host.querySelector('[data-name="Content Suggestions"]');
    expect(group).toBeTruthy();
    const link = group?.querySelector(".uxds-link");
    expect(link?.textContent).toBe("Patient guide");
  });

  it("notFound renders product suggestion tiles with price, and each tile click fires onClick", () => {
    const onClick = vi.fn();
    const { host } = renderFsc({
      value: "lptops",
      resultGroups: [],
      notFound: {
        productSuggestions: [{ title: "Chickenpox", price: "75.00", onClick }],
      },
    });
    const tile = host.querySelector('[data-name="component.search.results.suggestions.product.tile"]');
    expect(tile).toBeTruthy();
    expect(tile?.textContent).toContain("Chickenpox");
    expect(tile?.textContent).toContain("75.00");
    act(() => {
      tile?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("notFound renders a 'View all results' CTA only when onViewAll is given", () => {
    const onViewAll = vi.fn();
    const { host, rerender } = renderFsc({
      value: "lptops",
      resultGroups: [],
      notFound: { didYouMean: { label: "x" }, onViewAll },
    });
    const cta = Array.from(host.querySelectorAll("button")).find(
      (b) => b.textContent === "View all results",
    );
    expect(cta).toBeTruthy();
    act(() => {
      cta?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onViewAll).toHaveBeenCalledTimes(1);

    rerender({ notFound: { didYouMean: { label: "x" } } });
    expect(
      Array.from(host.querySelectorAll("button")).some((b) => b.textContent === "View all results"),
    ).toBe(false);
  });

  it("Escape calls onDismiss (useOverlayEscapeDismiss)", () => {
    const onDismiss = vi.fn();
    renderFsc({ onDismiss });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("clicking the scrim calls onDismiss — same lightbox contract as MegaMenuFlyout", () => {
    const onDismiss = vi.fn();
    const { host } = renderFsc({ onDismiss });
    const scrim = host.querySelector('[data-name="module.full.screen.search.scrim"]');
    act(() => {
      scrim?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("Exit pill calls onDismiss", () => {
    const onDismiss = vi.fn();
    const { host } = renderFsc({ onDismiss });
    const exitBtn = Array.from(host.querySelectorAll("button")).find(
      (b) => b.textContent === "Exit",
    );
    expect(exitBtn).toBeTruthy();
    act(() => {
      exitBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("clear pill calls onValueChange('')", () => {
    const onValueChange = vi.fn();
    const { host } = renderFsc({ value: "chick", onValueChange, resultGroups: [] });
    const clearBtn = host.querySelector('[aria-label="Clear search"]');
    act(() => {
      clearBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("clear pill is hidden while the field is empty (not dirty)", () => {
    const { host } = renderFsc({ value: "" });
    expect(host.querySelector('[aria-label="Clear search"]')).toBeNull();
  });

  it("clear pill appears once the field has any typed value", () => {
    const { host } = renderFsc({ value: "a", resultGroups: [] });
    expect(host.querySelector('[aria-label="Clear search"]')).toBeTruthy();
  });

  it("Enter key calls onSubmit with the current value", () => {
    const onSubmit = vi.fn();
    const { host } = renderFsc({ value: "flu", onSubmit });
    const input = host.querySelector("input");
    act(() => {
      input?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(onSubmit).toHaveBeenCalledWith("flu");
  });

  it("topOffset pushes the root below persistent chrome instead of covering it (regression: field row hidden under studio toolbar)", () => {
    const { host } = renderFsc({ topOffset: 88 });
    const root = host.querySelector('[data-name="module.full.screen.search"]') as HTMLElement;
    expect(root.style.top).toBe("88px");
  });

  it("topOffset=0 (default) leaves no inline top override", () => {
    const { host } = renderFsc();
    const root = host.querySelector('[data-name="module.full.screen.search"]') as HTMLElement;
    expect(root.style.top).toBe("");
  });

  it("open=false never mounts anything", () => {
    const { host } = renderFsc({ open: false });
    expect(host.querySelector('[data-name="component.search.fullscreen"]')).toBeNull();
  });

  it("show/hide animates via AnimatePresence — exit transition before DOM removal, not an instant unmount", async () => {
    const { host, rerender } = renderFsc({ open: true });
    const selector = '[data-name="component.search.fullscreen"]';
    expect(host.querySelector(selector)).toBeTruthy();

    rerender({ open: false });
    expect(host.querySelector(selector)).toBeTruthy();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(host.querySelector(selector)).toBeNull();
  });

  it("group links reuse the one .uxds-link pattern via the shared UxdsTextLink renderer", () => {
    const { host } = renderFsc();
    const link = host.querySelector(".uxds-full-screen-search__link");
    expect(link).toBeTruthy();
    expect(link?.classList.contains("uxds-link")).toBe(true);
  });

  it("does not fork a competing .uxds-link rest-underline override (one text-link pattern, no dup CSS)", () => {
    // check-text-link-contract.mjs doesn't scan src/uxds/interactions — this
    // is the kit-local backstop so FSC can't quietly re-underline at rest.
    expect(css).not.toMatch(
      /\.uxds-full-screen-search__link\.uxds-link[^{]*\{[^}]*text-decoration(?:-line)?\s*:\s*underline\b/,
    );
  });

  it("the 'did you mean' term is a real UxdsTextLink, not a hand-rolled colored span (no dup link CSS)", () => {
    const { host } = renderFsc({
      value: "lptops",
      resultGroups: [],
      notFound: { didYouMean: { label: "Laptops" } },
    });
    const term = host.querySelector(".uxds-full-screen-search__did-you-mean-term");
    expect(term?.classList.contains("uxds-link")).toBe(true);
    // Layout-only rule — no color/text-decoration override on the kit class itself.
    const rule = /\.uxds-full-screen-search__did-you-mean-term\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(rule).not.toMatch(/color\s*:/);
    expect(rule).not.toMatch(/text-decoration/);
  });

  it("uses shared UXDS tokens for the field band + pills (no anonymous hex chrome roles)", () => {
    expect(css).toMatch(/background:\s*var\(--uxds-surface-primary-light\)/);
    expect(css).toMatch(/background:\s*var\(--uxds-input-button-surface-surface-primary-tonal\)/);
    expect(css).not.toMatch(/color:\s*#[0-9a-fA-F]{3,6}/);
  });

  it("scrim is pointer-events:auto (click-to-dismiss) and anchored inset:0 within a real positioned root", () => {
    expect(css).toMatch(/\.uxds-full-screen-search__root\s*\{[^}]*position:\s*fixed/);
    expect(css).toMatch(/\.uxds-full-screen-search__scrim\s*\{[^}]*position:\s*absolute/);
    expect(css).toMatch(/\.uxds-full-screen-search__scrim\s*\{[^}]*pointer-events:\s*auto/);
    const scrimZ = /\.uxds-full-screen-search__scrim\s*\{[^}]*z-index:\s*(-?\d+)/.exec(css)?.[1];
    const panelZ = /\n\.uxds-full-screen-search\s*\{[^}]*z-index:\s*(-?\d+)/.exec(css)?.[1];
    expect(scrimZ).toBeDefined();
    expect(panelZ).toBeDefined();
    expect(Number(panelZ)).toBeGreaterThan(Number(scrimZ));
  });

  it("panel background spans the whole viewport width (header grid: full-bleed bg, 1312px content)", () => {
    const panelRule = /\n\.uxds-full-screen-search\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(panelRule).toMatch(/width:\s*100%/);
    expect(panelRule).not.toMatch(/max-width/);
    // content columns still cap at 1312px, same as the header's own content grid
    expect(css).toMatch(/\.uxds-full-screen-search__field\s*\{[^}]*max-width:\s*1312px/);
    expect(css).toMatch(/\.uxds-full-screen-search__body\s*\{[^}]*max-width:\s*1312px/);
  });
});
