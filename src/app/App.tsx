import { useState, useRef, useEffect } from "react";
import Frame219 from "@/imports/Frame1000007317/index";

/**
 * DOM child order inside Frame219's root div (JSX order = DOM order):
 *   child 1  → left-16282  Order Details
 *   child 2  → left-14747  Order History
 *   child 3  → left-12860  Step 6  Book Appointment
 *   child 4  → left-11325  Step 5  Book Appointment
 *   child 5  → left-9790   FrameForUx  Guide / Chat
 *   child 6  → left-8255   Product Specs modal
 *   child 7  → left-6880   Step 4  Hire Equipment
 *   child 8  → left-5345   Deal Details
 *   child 9  → left-3810   Vaccination Listing
 *   child 10 → left-1535   Account Overview
 *   child 11 → left-0      Account Login
 */
const SCREENS = [
  { label: "Agentic. Site Pilot. Home", childIndex: 11 },
  { label: "Agentic. Site Pilot. Chat", childIndex: 10 },
  { label: "PLP. Vaccinations",         childIndex: 9  },
  { label: "PDP. Vaccine Details Page", childIndex: 8  },
  { label: "Book Appointment. Step 1",  childIndex: 7  },
  // childIndex 6 = Product Specs — shown as lightbox, not in nav
  { label: "Guide / Chat",              childIndex: 5  },
  { label: "Book Appointment – Step 5", childIndex: 4  },
  { label: "Book Appointment – Step 6", childIndex: 3  },
  { label: "Order History",             childIndex: 2  },
  { label: "Order Details",             childIndex: 1  },
];

export default function App() {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [current]);

  // Measure the total sticky header height after each screen switch so breadcrumbs
  // can dock precisely below it. On screen 2 the sticky group wraps both the nav
  // and the Site Pilot bar, so we measure that wrapper instead.
  useEffect(() => {
    const measure = () => {
      const group = document.querySelector("[data-proto-sticky-group]") as HTMLElement | null;
      const header = document.querySelector("[data-name='boots-pharmacy.module.header']") as HTMLElement | null;
      const el = group ?? header;
      const h = el ? el.getBoundingClientRect().height : 64;
      document.documentElement.style.setProperty("--sticky-top", `${h}px`);
    };
    requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [current]);

  // Screen 2 (Account Overview, child 10) has a Site Pilot microheader (Frame337)
  // that must stick together with the main nav as one unit.
  // Two separate sticky elements with offset `top` values scroll independently, so
  // we physically wrap both in a single sticky container via the DOM.
  // React won't touch Frame219's internals (no vDOM change), so this is safe.
  useEffect(() => {
    const SCREEN2_CHILD = 10;
    const screenDiv = document.querySelector(
      `.proto-viewport > div > div:nth-child(${SCREEN2_CHILD})`
    ) as HTMLElement | null;
    if (!screenDiv) return;

    const header = screenDiv.children[0] as HTMLElement;
    const microHeader = screenDiv.children[1] as HTMLElement;
    if (!header || !microHeader) return;

    const wrapper = document.createElement("div");
    wrapper.dataset.protoStickyGroup = "true";
    Object.assign(wrapper.style, {
      position: "sticky",
      top: "0",
      zIndex: "50",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    });

    screenDiv.insertBefore(wrapper, header);
    wrapper.appendChild(header);
    wrapper.appendChild(microHeader);

    return () => {
      if (wrapper.parentNode === screenDiv) {
        screenDiv.insertBefore(header, wrapper);
        screenDiv.insertBefore(microHeader, wrapper);
        wrapper.remove();
      }
    };
  }, []);

  // Screen 5 (Book Appointment Step 1, child 7): clicking the search field opens the
  // Product Specs lightbox. We wire to the whole "chosen location" row so the user
  // doesn't have to hit the tiny icon precisely.
  useEffect(() => {
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(7)"
    ) as HTMLElement | null;
    if (!screen) return;

    // "chosen location" wraps both the text field and GPS button on this screen.
    // component.input.field wraps Label + TextField3 — prefer that as the click area.
    const searchField =
      screen.querySelector<HTMLElement>("[data-name='component.input.field']") ??
      screen.querySelector<HTMLElement>("[data-name='Text Field']") ??
      screen.querySelector<HTMLElement>("[data-name='icon=search']");

    if (!searchField) return;

    searchField.style.cursor = "pointer";

    // Use a ref-stable setter via functional update so the closure stays fresh.
    const open = () => setLightboxOpen(true);
    searchField.addEventListener("click", open);
    return () => searchField.removeEventListener("click", open);
  }, []);

  // Escape key closes the lightbox
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Screen 4 (Deal Details, child 8): wire up the Myself / Someone else toggle.
  // We tag each tab with data-toggle-index so CSS can apply the correct 3-sided
  // border (no shared inner edge) to whichever tab is inactive.
  useEffect(() => {
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(8)"
    ) as HTMLElement | null;
    if (!screen) return;

    // Filter to only the two toggle pills (Units5 / Units6) — they are shrink-0
    // without w-full. Units7 (the checkbox container) has w-full and must be
    // excluded so it doesn't get data-toggle-index and interfere with bg rules.
    const tabs = Array.from(
      screen.querySelectorAll<HTMLElement>("[data-name='units']")
    ).filter((el) => !el.classList.contains("w-full"));
    if (tabs.length < 2) return;

    // Tag with stable index so CSS selectors can target each half independently
    tabs.forEach((tab, i) => {
      tab.dataset.toggleIndex = String(i);
      tab.style.cursor = "pointer";
      tab.style.transition = "background 0.18s ease, box-shadow 0.18s ease";
      tab.style.userSelect = "none";
    });

    const activate = (idx: number) => {
      tabs.forEach((t, i) => {
        if (i === idx) t.dataset.toggleActive = "true";
        else delete t.dataset.toggleActive;
      });
    };

    // Default: Myself (index 0) always active on mount/refresh.
    // rAF ensures the attribute is set after the browser's first paint so
    // the CSS transition fires cleanly and the state is never missed.
    activate(0);
    requestAnimationFrame(() => activate(0));

    const cleanup: (() => void)[] = [];
    tabs.forEach((tab, idx) => {
      const onClick = () => activate(idx);
      tab.addEventListener("click", onClick);
      cleanup.push(() => tab.removeEventListener("click", onClick));
    });

    return () => cleanup.forEach((fn) => fn());
  }, []);

  // Screen 4 (Deal Details, child 8): second dose checkbox.
  // Starts checked (£150 = £75 base + £75 addon). Unchecking drops price to £75.
  useEffect(() => {
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(8)"
    ) as HTMLElement | null;
    if (!screen) return;

    const checkboxRow = screen.querySelector<HTMLElement>(
      "[data-name='component.input.checkbox']"
    );
    if (!checkboxRow) return;

    // Forcibly strip teal background from the checkbox section (Units7) and
    // every ancestor up to component.pdp.rtb via inline style — CSS alone has
    // not been able to override the source of the teal.
    const checkboxSection = checkboxRow.parentElement;
    if (checkboxSection) {
      checkboxSection.style.setProperty("background", "white", "important");
      checkboxSection.style.setProperty("background-color", "white", "important");
    }
    // Clear bg on the description sibling only — leave checkboxRow unstyled
    // so CSS :hover can apply the teal tint freely.
    Array.from(checkboxSection?.children ?? []).forEach((child) => {
      if (child !== checkboxRow) {
        (child as HTMLElement).style?.setProperty("background", "transparent", "important");
      }
    });

    // The navy "Book now" button is the first component.input.button in the RTB.
    // Its price is the last <span> inside: "Book now - " | "£" | "150"
    const navyButton = screen.querySelector<HTMLElement>(
      "[data-name='component.input.button']"
    );
    const allSpans = navyButton ? Array.from(navyButton.querySelectorAll("span")) : [];
    const priceSpan = allSpans.length ? allSpans[allSpans.length - 1] : null;

    let checked = true;
    checkboxRow.dataset.checkboxChecked = "true";
    // Sync price to initial state immediately
    if (priceSpan) priceSpan.textContent = "150";

    const toggle = () => {
      checked = !checked;
      checkboxRow.dataset.checkboxChecked = String(checked);
      if (priceSpan) priceSpan.textContent = checked ? "150" : "75";
    };

    checkboxRow.addEventListener("click", toggle);
    return () => checkboxRow.removeEventListener("click", toggle);
  }, []);

  // Screen 4: favourite heart toggle
  useEffect(() => {
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(8)"
    ) as HTMLElement | null;
    if (!screen) return;

    const favIcon = screen.querySelector<HTMLElement>("[data-name='icon=add to wishlist']");
    const favBtn = favIcon?.closest<HTMLElement>("[data-name='component.input.button']");
    if (!favBtn || !favIcon) return;

    const path = favIcon.querySelector<SVGPathElement>("path");
    const originalD = path?.getAttribute("d") ?? "";

    // Solid filled heart for viewBox 0 0 16 14
    const filledHeartD =
      "M8 13.5C7.6 13.2 1 8.8 1 4.5C1 2.3 2.7 1 4.5 1C6 1 7.3 1.9 8 3C8.7 1.9 10 1 11.5 1C13.3 1 15 2.3 15 4.5C15 8.8 8.4 13.2 8 13.5Z";

    let active = false;
    const toggle = () => {
      active = !active;
      favIcon.dataset.favActive = String(active);
      if (path) {
        path.setAttribute("d", active ? filledHeartD : originalD);
        path.style.fill = active ? "#e91e8c" : "";
        path.style.stroke = "none";
      }
    };

    favBtn.addEventListener("click", toggle);
    return () => favBtn.removeEventListener("click", toggle);
  }, []);

  const go = (i: number) => setCurrent(Math.max(0, Math.min(SCREENS.length - 1, i)));

  const { label, childIndex } = SCREENS[current];
  const isScreen1 = childIndex === 11;

  /**
   * Screen 1 uses a height:100% chain so the body fills exactly the available
   * viewport space without adding a scrollbar. Other screens use height:auto
   * so they scroll naturally when their content is taller than the viewport.
   */
  const dynamicCSS = `
    /* Frame219 root height depends on active screen */
    .proto-viewport > div {
      height: ${isScreen1 ? "100%" : "auto"} !important;
      width: 100% !important;
    }

    /* Hide all screens */
    .proto-viewport > div > div {
      display: none !important;
    }

    /* Active screen: pull into normal flow, full-width */
    .proto-viewport > div > div:nth-child(${childIndex}) {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      position: static !important;
      width: 100% !important;
      min-width: 1200px !important;
      max-width: unset !important;
      left: auto !important;
      top: auto !important;
      height: ${isScreen1 ? "100%" : "auto"} !important;
      min-height: unset !important;
      overflow: visible !important;
      animation: proto-fade 0.25s ease;
    }

    /*
     * Some screens hardcode w-[1440px] on the header/footer instead of w-full.
     * Override all of them to stretch full-width for the active screen.
     */
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="boots-pharmacy.module.header"],
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="boots.phm.module.footer"],
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="boots-pharmacy.module.footer"],
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="module.footer"],
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="module.breadcrumbs"],
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="boots.phm.module.footer.copyright"] {
      width: 100% !important;
      min-width: 1200px !important;
    }

    /*
     * Screen 1 height chain:
     * viewportRef (flex-1, computed height H)
     *   .proto-viewport (height: 100% = H)
     *     Frame219 root (height: 100% = H)
     *       screen-1 div (height: 100% = H)
     *         header (sticky, ~66px)
     *         body (flex: 1, fills remaining H - 66px)
     *           inner wrappers (height: 100% of body)
     *             gradient image (position: absolute, inset: 0, fills inner)
     *
     * No min-height: 100vh — that would exceed the viewport and add a scrollbar.
     * overflow-y: auto on viewportRef means a scrollbar only appears if the
     * viewport is shrunk until the content no longer fits.
     */
    .proto-viewport > div > div:nth-child(11) > [data-name="body"] {
      flex: 1 0 0 !important;
      width: 100% !important;
      min-height: 0 !important;
    }
    .proto-viewport > div > div:nth-child(11) > [data-name="body"] > div {
      height: 100% !important;
      flex: 1 !important;
      overflow: visible !important;
    }
    .proto-viewport > div > div:nth-child(11) > [data-name="body"] > div > div {
      height: 100% !important;
    }

    /*
     * Screen 7 (child 5, FrameForUx) has a doubly-nested absolute wrapper:
     *   FrameForUx (absolute, h-[1909px]) → GuideStep (absolute, left-0, overflow-clip)
     * The outer override above flattens FrameForUx; this flattens GuideStep too.
     */
    .proto-viewport > div > div:nth-child(5) > [data-name="Guide. Step 8"] {
      position: static !important;
      width: 100% !important;
      height: auto !important;
      left: auto !important;
      top: auto !important;
      overflow: visible !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
    }

    /*
     * Lightbox: when .proto-lb-open is on the root, pull child 6 out of the hidden
     * flow and pin it as a fixed centered modal. The backdrop is a sibling div.
     * Specificity (.proto-lb-open + 3 combinators) beats the plain hide rule above.
     */
    .proto-lb-open .proto-viewport > div > div:nth-child(6) {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      position: fixed !important;
      z-index: 10000 !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: min(90vw, 1100px) !important;
      max-height: 88vh !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      border-radius: 16px !important;
      box-shadow: 0 32px 80px rgba(0,0,0,0.45) !important;
      max-width: unset !important;
      min-width: unset !important;
      min-height: unset !important;
      animation: lightbox-slide 0.28s cubic-bezier(0.22,1,0.36,1) !important;
    }

    /* Search field on screen 5 gets a hover ring so the click affordance is clear */
    .proto-viewport > div > div:nth-child(7) [data-name='component.input.field']:hover [data-name='Text Field'] {
      box-shadow: 0 0 0 2px #012169 !important;
    }

    /* GPS button beside the search field — scope the ::before circle so it doesn't
       bleed outside the button bounds (it's already correct; this prevents z-index
       stacking issues with the search row). */
    .proto-viewport > div > div:nth-child(7) [data-name="component.input.button"] {
      overflow: visible !important;
    }

    @keyframes proto-fade {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes lightbox-slide {
      from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)); }
      to   { opacity: 1; transform: translate(-50%, -50%); }
    }
  `;

  return (
    <div className={`flex flex-col h-screen${lightboxOpen ? " proto-lb-open" : ""}`} style={{ fontFamily: "'Open Sans', sans-serif" }}>
      <style>{dynamicCSS}</style>

      {/* Top prototype nav */}
      <div className="shrink-0 bg-[#012169] shadow-lg" style={{ zIndex: 100 }}>
        {/* Screen tabs */}
        <div className="flex items-center overflow-x-auto px-2 pt-2" style={{ scrollbarWidth: "none" }}>
          {SCREENS.map((s, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold whitespace-nowrap rounded-t transition-all select-none ${
                i === current
                  ? "bg-white text-[#012169]"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0 ${
                  i === current ? "bg-[#012169] text-white" : "bg-white/20 text-white"
                }`}
              >
                {i + 1}
              </span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Prev / next bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-t border-white/10">
          <button
            onClick={() => go(current - 1)}
            disabled={current === 0}
            className="flex items-center gap-1 text-[11px] text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-3">
            <span className="text-white/50 text-[10px]">{current + 1} / {SCREENS.length}</span>
            <span className="text-white text-[11px] font-semibold">{label}</span>
            <div className="flex gap-1">
              {SCREENS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`rounded-full transition-all ${
                    i === current ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => go(current + 1)}
            disabled={current === SCREENS.length - 1}
            className="flex items-center gap-1 text-[11px] text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            Next
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable viewport — height:100% on screen 1 so children can inherit it */}
      <div ref={viewportRef} className="flex-1 overflow-y-auto overflow-x-hidden w-full bg-white">
        <div className="proto-viewport w-full" style={{ height: isScreen1 ? "100%" : "auto" }}>
          <Frame219 />
        </div>
      </div>

      {/* Lightbox backdrop — child 6 is lifted to fixed via CSS when .proto-lb-open is set */}
      {lightboxOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
            onClick={() => setLightboxOpen(false)}
          />
          {/* Close button — sits above child 6 which is at z-index 10000 */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="fixed flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-all"
            style={{
              zIndex: 10001,
              top: "calc(50% - 44vh - 16px)",
              right: "calc(50% - min(45vw, 550px) - 16px)",
              color: "#012169",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}

    </div>
  );
}
