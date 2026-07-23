/** @vitest-environment happy-dom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MegaMenuFlyout,
  type MegaMenuLinkGroup,
} from "../MegaMenuFlyout";

(
  globalThis as typeof globalThis & {
    React: typeof React;
    IS_REACT_ACT_ENVIRONMENT: boolean;
  }
).React = React;
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const css = readFileSync(resolve(__dirname, "../mega-menu-flyout.css"), "utf8");

const ROWS: MegaMenuLinkGroup[][] = [
  [{ title: "Ultra-Thin Series", links: [{ label: "Link Name" }] }],
  [{ title: "Group Name", links: [{ label: "Link Name" }] }],
];

function renderFlyout(props: Partial<React.ComponentProps<typeof MegaMenuFlyout>> = {}) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => {
    root.render(React.createElement(MegaMenuFlyout, { linkRows: ROWS, ...props }));
  });
  return {
    host,
    rerender: (nextProps: Partial<React.ComponentProps<typeof MegaMenuFlyout>>) => {
      act(() => {
        root.render(
          React.createElement(MegaMenuFlyout, { linkRows: ROWS, ...props, ...nextProps })
        );
      });
    },
  };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("MegaMenuFlyout kit", () => {
  it("exports a reusable flyout component", () => {
    expect(typeof MegaMenuFlyout).toBe("function");
  });

  it("stamps the UXDS component name and renders one delimiter between rows", () => {
    const { host } = renderFlyout();
    const root = host.querySelector(
      '[data-name="component.header.mega.menu.flyout.standard"]'
    );
    expect(root).toBeTruthy();
    expect(
      host.querySelectorAll('[data-name="component.gse.delimiter"]').length
    ).toBe(1);
    expect(
      host.querySelectorAll('[data-name^="flyout.links.row."]').length
    ).toBe(2);
  });

  it("group links reuse the one .uxds-link pattern (no invented link chrome)", () => {
    const { host } = renderFlyout();
    const link = host.querySelector(".uxds-mega-menu-flyout__link");
    expect(link).toBeTruthy();
    expect(link?.classList.contains("uxds-link")).toBe(true);
  });

  it("stamps a stable data-studio-action per link when supplied — REC/CJM capture target", () => {
    const { host } = renderFlyout({
      linkRows: [
        [
          {
            title: "Group Name",
            links: [{ label: "Link Name", actionId: "mega-menu-flyout-group-name-link-name" }],
          },
        ],
      ],
    });
    const link = host.querySelector('[data-studio-action="mega-menu-flyout-group-name-link-name"]');
    expect(link).toBeTruthy();
  });

  it("renders the hero asset + CTA and the promo band only when provided", () => {
    const onCta = vi.fn();
    const { host } = renderFlyout({
      hero: {
        image: { src: "https://example.com/hero.png", alt: "" },
        title: "New Arrivals",
        cta: { label: "Explore now", onClick: onCta },
      },
      promoText: "Elevate your business",
    });

    const cta = host.querySelector<HTMLButtonElement>(
      '[data-name="component.input.button"]'
    );
    expect(cta).toBeTruthy();
    act(() => {
      cta?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onCta).toHaveBeenCalledTimes(1);
    expect(host.querySelector('[data-name="flyout.promo"]')?.textContent).toBe(
      "Elevate your business"
    );
  });

  it("renders module.mega.menu's full-viewport separation scrim (aria-hidden — Escape stays the accessible dismiss path)", () => {
    const { host } = renderFlyout();
    const scrim = host.querySelector('[data-name="module.mega.menu.scrim"]');
    expect(scrim).toBeTruthy();
    expect(scrim?.getAttribute("aria-hidden")).toBe("true");
  });

  it("Escape calls onDismiss while open (useOverlayEscapeDismiss — shared with FullScreenSearch)", () => {
    const onDismiss = vi.fn();
    renderFlyout({ onDismiss });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("Escape does nothing while closed", () => {
    const onDismiss = vi.fn();
    renderFlyout({ open: false, onDismiss });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("clicking the scrim calls onDismiss — flyout previously had no dismiss action at all (PO 2026-07-23)", () => {
    const onDismiss = vi.fn();
    const { host } = renderFlyout({ onDismiss });
    const scrim = host.querySelector('[data-name="module.mega.menu.scrim"]');
    act(() => {
      scrim?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("no hero/promo → no dead chrome mounted", () => {
    const { host } = renderFlyout();
    expect(host.querySelector('[data-name="flyout.content.asset"]')).toBeNull();
    expect(host.querySelector('[data-name="flyout.promo"]')).toBeNull();
  });

  it("open=false never mounts anything (nothing to animate out of a cold start)", () => {
    const { host } = renderFlyout({ open: false });
    expect(
      host.querySelector('[data-name="component.header.mega.menu.flyout.standard"]')
    ).toBeNull();
    expect(host.querySelector('[data-name="module.mega.menu.scrim"]')).toBeNull();
  });

  it("show/hide animates via AnimatePresence (opacity + tiny y, MOTION.md) — flipping open=false plays an exit transition before DOM removal, not an instant unmount", async () => {
    const { host, rerender } = renderFlyout({ open: true });
    const panelSelector = '[data-name="component.header.mega.menu.flyout.standard"]';
    expect(host.querySelector(panelSelector)).toBeTruthy();

    rerender({ open: false });
    // AnimatePresence keeps the exiting node mounted for its `exit` transition
    // — immediately after flipping `open` the panel must still be present
    // (this is the whole point of using AnimatePresence over a bare
    // `if (!open) return null`, which the kit used before this change).
    expect(host.querySelector(panelSelector)).toBeTruthy();

    // Exit transition (`MEGA_MENU_FLYOUT_TRANSITION`, 0.2s) completes and
    // AnimatePresence removes the node — real-time wait, same convention as
    // the existing hover show/hide test in healthServicesMegaMenuMount.test.ts.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(host.querySelector(panelSelector)).toBeNull();
    expect(host.querySelector('[data-name="module.mega.menu.scrim"]')).toBeNull();
  });

  it("uses shared UXDS tokens (no anonymous hex chrome roles)", () => {
    expect(css).toMatch(/background:\s*var\(--uxds-surface-neutral\)/);
    expect(css).toMatch(/background:\s*var\(--uxds-surface-neutral-10\)/);
    expect(css).toMatch(/background:\s*var\(--uxds-surface-neutral-3\)/);
    expect(css).not.toMatch(/color:\s*#[0-9a-fA-F]{3,6}/);
  });

  it("scrim is a documented literal (Figma fill style citation), click-to-dismiss, and blends with the page beneath", () => {
    expect(css).toMatch(/fills\/mega menu flyout gradient/i);
    expect(css).toMatch(/\.uxds-mega-menu-flyout__scrim\s*\{[^}]*mix-blend-mode:\s*multiply/);
    // Lightbox contract: clicking the dimmed backdrop dismisses the flyout
    // (2026-07-23 — "we dont have dismiss actions" PO fix), same as FullScreenSearch.
    expect(css).toMatch(/\.uxds-mega-menu-flyout__scrim\s*\{[^}]*pointer-events:\s*auto/);
  });

  it("regression: scrim must stack BELOW the panel and never reach above the flyout's own top edge (2026-07-23 — scrim washed over the header/breadcrumb AND the panel itself)", () => {
    // Root wrapper is a real positioned container, not a bare Fragment — a
    // non-positioned sibling always paints below a `position: fixed`/`absolute`
    // sibling regardless of DOM order, which is exactly how the scrim ended up
    // rendering on top of the (then `position: static`) panel.
    expect(css).toMatch(/\.uxds-mega-menu-flyout__root\s*\{[^}]*position:\s*relative/);
    // `position: fixed` measures from the real viewport (y:0) and would reach
    // up over the header/breadcrumb above the flyout — must be `absolute`,
    // anchored to `__root`'s own top (flush with the flyout, not the page).
    expect(css).toMatch(/\.uxds-mega-menu-flyout__scrim\s*\{[^}]*position:\s*absolute/);
    expect(css).not.toMatch(/\.uxds-mega-menu-flyout__scrim\s*\{[^}]*position:\s*fixed/);
    expect(css).toMatch(/\.uxds-mega-menu-flyout__scrim\s*\{[^}]*top:\s*0/);
    // Explicit, comparable z-index on both — panel strictly above scrim.
    const scrimZ = /\.uxds-mega-menu-flyout__scrim\s*\{[^}]*z-index:\s*(-?\d+)/.exec(css)?.[1];
    const panelZ = /\n\.uxds-mega-menu-flyout\s*\{[^}]*z-index:\s*(-?\d+)/.exec(css)?.[1];
    expect(scrimZ).toBeDefined();
    expect(panelZ).toBeDefined();
    expect(Number(panelZ)).toBeGreaterThan(Number(scrimZ));
  });

  it("regression: root wrapper is a real DOM node (module.mega.menu), not a bare Fragment, so the scrim has a positioned containing block", () => {
    const { host } = renderFlyout();
    const root = host.querySelector('[data-name="module.mega.menu"]');
    expect(root).toBeTruthy();
    expect(root?.contains(host.querySelector('[data-name="module.mega.menu.scrim"]')!)).toBe(true);
    expect(root?.contains(host.querySelector('[data-name="component.header.mega.menu.flyout.standard"]')!)).toBe(true);
  });
});
