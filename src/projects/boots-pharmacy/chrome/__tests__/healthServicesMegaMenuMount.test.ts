/** @vitest-environment happy-dom */
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachHealthServicesMegaMenu,
  buildHealthServicesMegaMenuContent,
  HEALTH_SERVICES_MEGA_MENU_LABEL,
} from "../healthServicesMegaMenuMount";

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
  const mount = document.createElement("div");
  mount.className = "proto-header-mount";
  const header = document.createElement("div");
  header.setAttribute("data-name", "boots-pharmacy.module.header");
  const item = document.createElement("div");
  item.setAttribute("data-name", "component.mega.menu.item");
  const label = document.createElement("p");
  label.textContent = HEALTH_SERVICES_MEGA_MENU_LABEL;
  item.appendChild(label);
  header.appendChild(item);
  mount.appendChild(header);
  document.body.append(mount);
  return header;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("buildHealthServicesMegaMenuContent", () => {
  it("row 1 = real footer service columns (no invented categories)", () => {
    const { linkRows } = buildHealthServicesMegaMenuContent();
    expect(linkRows).toHaveLength(3);
    const [row1] = linkRows;
    expect(row1.map((g) => g.title)).toEqual([
      "Health Services",
      "Acne & Skin",
      "Patient services",
    ]);
    expect(row1[0].links.map((l) => l.label)).toEqual([
      "Vaccination",
      "NHS Stop Smoking Service",
      "Practice Plus",
      "Physiotherapist Online",
      "Online GP Appointment",
    ]);
    expect(row1[1].links.map((l) => l.label)).toEqual([
      "Skin Scanning",
      "Mole Scanning",
      "Help with problem skin",
    ]);
  });

  it("row 2 = the real PLP sidebar facets (By Age / By Disease / By Region)", () => {
    const { linkRows } = buildHealthServicesMegaMenuContent();
    const [, row2] = linkRows;
    expect(row2.map((g) => g.title)).toEqual([
      "By Age",
      "By Disease",
      "By Region",
    ]);
    expect(row2[0].links.map((l) => l.label)).toEqual([
      "Infants under 1 year",
      "Children 2–12 years",
      "Teens & adults 13–64 years",
      "Adults 65+ years",
    ]);
    // Curated glance list, not the full PLP facet list — capped to GROUP_LINK_MAX (5).
    expect(row2[1].links).toHaveLength(5);
    expect(row2[2].links.map((l) => l.label)[0]).toBe("Europe");
  });

  it("row 3 = the remaining footer column ('About us') + PLP By Country facet, capped like the PLP sidebar", () => {
    const { linkRows } = buildHealthServicesMegaMenuContent();
    const [, , row3] = linkRows;
    expect(row3.map((g) => g.title)).toEqual(["About us", "By Country"]);
    expect(row3[0].links.map((l) => l.label)).toEqual([
      "Careers",
      "Meet the team",
      "Patient guide",
      "Terms and conditions",
      "Privacy policy",
    ]);
    // PLP_COUNTRY_OPTIONS has more entries than the flyout can show — capped
    // to GROUP_LINK_MAX (5), a curated glance list, not the full sidebar.
    expect(row3[1].links).toHaveLength(5);
  });

  it("reuses the real PLP Vaccinations hero + Advantage Card promo copy (no invented marketing)", () => {
    const { hero, promoText } = buildHealthServicesMegaMenuContent();
    expect(hero?.title).toBe("Vaccinations");
    expect(hero?.image.src).toBeTruthy();
    expect(promoText).toBe(
      "Collect 3 points for every £1 you spend with Boots Advantage Card‡",
    );
  });

  it("wires the Vaccination link and the hero CTA to the PLP navigation handler", () => {
    const onNavigateToPlp = vi.fn();
    const { linkRows, hero } = buildHealthServicesMegaMenuContent({
      onNavigateToPlp,
    });
    const vaccination = linkRows[0][0].links.find(
      (l) => l.label === "Vaccination",
    );
    expect(vaccination?.onClick).toBe(onNavigateToPlp);
    expect(hero?.cta?.onClick).toBe(onNavigateToPlp);
  });

  it("wires facet links (By Age / By Disease / By Region / By Country) to the PLP navigation handler too", () => {
    const onNavigateToPlp = vi.fn();
    const { linkRows } = buildHealthServicesMegaMenuContent({
      onNavigateToPlp,
    });
    expect(linkRows[1][0].links[0].onClick).toBe(onNavigateToPlp);
    expect(linkRows[2][1].links[0].onClick).toBe(onNavigateToPlp);
  });
});

describe("attachHealthServicesMegaMenu", () => {
  it("mounts a closed flyout under the header when the Health Services item is found", () => {
    const headerClone = buildHeaderClone();
    act(() => {
      attachHealthServicesMegaMenu(headerClone);
    });
    const mount = headerClone.parentElement!;
    expect(
      mount.querySelector('[data-name="component.header.mega.menu.flyout.standard"]'),
    ).toBeNull();
    expect(mount.querySelector(".proto-header-mega-menu-flyout-host")).toBeTruthy();
  });

  it("opens on hover (after the show delay) and closes on mouseleave (after the hide delay + AnimatePresence exit transition)", async () => {
    const headerClone = buildHeaderClone();
    act(() => {
      attachHealthServicesMegaMenu(headerClone);
    });
    const item = headerClone.querySelector(
      '[data-name="component.mega.menu.item"]',
    ) as HTMLElement;
    const mount = headerClone.parentElement!;

    await act(async () => {
      item.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 120));
    });
    expect(
      mount.querySelector('[data-name="component.header.mega.menu.flyout.standard"]'),
    ).toBeTruthy();

    // Hide delay (200ms) flips `open=false`. React's act-queue only flushes
    // work at an `act()` boundary, so this needs two separate real-time
    // phases: (1) past the hide delay — flushes the AnimatePresence "start
    // exiting" update, panel still present mid-transition; (2) past the
    // exit transition itself (MegaMenuFlyout.tsx `MEGA_MENU_FLYOUT_TRANSITION`)
    // — flushes the actual DOM removal once the animation completes.
    await act(async () => {
      item.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 260));
    });
    expect(
      mount.querySelector('[data-name="component.header.mega.menu.flyout.standard"]'),
    ).toBeTruthy();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 350));
    });
    expect(
      mount.querySelector('[data-name="component.header.mega.menu.flyout.standard"]'),
    ).toBeNull();
  });

  it("is idempotent — calling twice does not duplicate the flyout host", () => {
    const headerClone = buildHeaderClone();
    act(() => {
      attachHealthServicesMegaMenu(headerClone);
      attachHealthServicesMegaMenu(headerClone);
    });
    const mount = headerClone.parentElement!;
    expect(
      mount.querySelectorAll(".proto-header-mega-menu-flyout-host").length,
    ).toBe(1);
  });

  it("no-ops when the Health Services item is absent", () => {
    const header = document.createElement("div");
    document.body.append(header);
    expect(() => attachHealthServicesMegaMenu(header)).not.toThrow();
    expect(header.querySelector(".proto-header-mega-menu-flyout-host")).toBeNull();
  });
});
