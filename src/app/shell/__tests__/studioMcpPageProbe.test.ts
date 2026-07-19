import { afterEach, describe, expect, it, vi } from "vitest";
import { runMcpPageProbe } from "@/app/shell/studioMcpPageProbe";

const simulateDemoPointerClick = vi.fn(async () => true);
const simulateDemoPointerHover = vi.fn(async () => true);

vi.mock("@/app/scenario/demoCursor", () => ({
  simulateDemoPointerClick: (...args: unknown[]) =>
    simulateDemoPointerClick(...args),
  simulateDemoPointerHover: (...args: unknown[]) =>
    simulateDemoPointerHover(...args),
}));

vi.mock("@/app/shell/agentTestingOverlay", () => ({
  DEFAULT_PREARM_MS: 0,
  DEFAULT_SETTLE_MS: 9000,
  startAgentTestingOverlay: vi.fn(),
  stopAgentTestingOverlay: vi.fn(),
  forceClearAgentTestingOverlay: vi.fn(),
  scheduleAgentTestingOverlayEnsureClear: vi.fn(),
  preArmAgentTestingOverlay: vi.fn(async () => {}),
  logAgentTestingOverlay: vi.fn(),
  touchAgentTestingOverlay: vi.fn(),
  ensureAgentTestingOverlayDomArmed: vi.fn(() => true),
  isAgentTestingOverlayDomVisible: vi.fn(() => true),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  getPrototypeScrollRoot: vi.fn(() => null),
  isDemoTargetInPrototypeView: vi.fn(() => true),
  revealDemoTargetForAgent: vi.fn(async () => ({
    scrolled: true,
    inView: true,
  })),
}));

vi.mock("@/app/shell/playbackCursorDiagnostic", () => ({
  enableCursorQaEyes: vi.fn(),
  disableCursorQaEyes: vi.fn(),
}));

const isBlockingModalOpen = vi.fn(() => false);
const isElementBlockedByModal = vi.fn(() => false);

vi.mock("@/app/shell/studioModalGuard", async () => {
  const actual = await vi.importActual<
    typeof import("@/app/shell/studioModalGuard")
  >("@/app/shell/studioModalGuard");
  return {
    ...actual,
    isBlockingModalOpen: (...args: unknown[]) => isBlockingModalOpen(...args),
    isElementBlockedByModal: (...args: unknown[]) =>
      isElementBlockedByModal(...args),
  };
});

describe("runMcpPageProbe", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    simulateDemoPointerClick.mockReset();
    simulateDemoPointerClick.mockResolvedValue(true);
    simulateDemoPointerHover.mockReset();
    simulateDemoPointerHover.mockImplementation(async (_el, _ms, opts) => {
      opts?.onHoverStart?.(_el as HTMLElement);
      return true;
    });
    isBlockingModalOpen.mockReset();
    isBlockingModalOpen.mockReturnValue(false);
    isElementBlockedByModal.mockReset();
    isElementBlockedByModal.mockReturnValue(false);
  });

  it("site-pilot stub recipe fails until React host mounts", async () => {
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?project=boots-pharmacy&screen=site-pilot",
        search: "?project=boots-pharmacy&screen=site-pilot",
        pathname: "/",
        hash: "",
      },
      history: { state: null, replaceState: vi.fn(), pushState: vi.fn() },
      dispatchEvent: vi.fn(() => true),
    });
    vi.stubGlobal("document", {
      querySelector: () => null,
      querySelectorAll: () => [],
      styleSheets: [],
    });

    const result = await runMcpPageProbe({
      screenId: "site-pilot",
      reload: false,
      settleMs: 0,
    });

    expect(result.pass).toBe(false);
    expect(result.screenId).toBe("site-pilot");
    expect(result.checks.some((c) => c.id === "probe-recipe")).toBe(false);
    expect(result.checks.find((c) => c.id === "site-pilot-host")?.pass).toBe(
      false
    );
    expect(result.checks.find((c) => c.id === "url-screen")?.pass).toBe(true);
  });

  it("fails clearly when screen has no probe recipe", async () => {
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?project=boots-pharmacy&screen=hub",
        search: "?project=boots-pharmacy&screen=hub",
      },
    });
    vi.stubGlobal("document", {
      querySelector: () => null,
    });

    const result = await runMcpPageProbe({
      screenId: "hub",
      reload: false,
    });
    expect(result.pass).toBe(false);
    expect(result.checks.some((c) => c.id === "probe-recipe" && !c.pass)).toBe(
      true
    );
  });

  it("passes PLP recipe when React hosts and CTAs resolve", async () => {
    const host = { tagName: "DIV" };
    const checkbox = { tagName: "BUTTON" };
    const reset = { tagName: "BUTTON" };
    const quick = {
      tagName: "BUTTON",
      getBoundingClientRect: () => ({ width: 40, height: 24 }),
    };
    const belowFold = {
      tagName: "BUTTON",
      isConnected: true,
      getBoundingClientRect: () => ({ width: 40, height: 24 }),
    };
    const book = { tagName: "BUTTON" };
    const close = { tagName: "BUTTON" };
    const searchIcon = {
      tagName: "SPAN",
      getBoundingClientRect: () => ({ width: 24, height: 24 }),
      getAttribute: (name: string) =>
        name === "data-studio-search-icon-pos" ? "end" : null,
    };
    const searchIcon2 = {
      tagName: "SPAN",
      getBoundingClientRect: () => ({ width: 24, height: 24 }),
      getAttribute: (name: string) =>
        name === "data-studio-search-icon-pos" ? "end" : null,
    };
    const diseaseField = {
      querySelector: (sel: string) =>
        sel.includes("data-studio-search-icon") ? searchIcon : null,
      querySelectorAll: (sel: string) =>
        sel.includes("data-studio-search-clear") ? [] : [],
    };
    const countryField = {
      querySelector: (sel: string) =>
        sel.includes("data-studio-search-icon") ? searchIcon2 : null,
      querySelectorAll: (sel: string) =>
        sel.includes("data-studio-search-clear") ? [] : [],
    };
    const diseaseInput = {
      type: "text",
      closest: (sel: string) =>
        sel.includes("component.input.field") ? diseaseField : null,
    };
    const countryInput = {
      type: "text",
      closest: (sel: string) =>
        sel.includes("component.input.field") ? countryField : null,
    };
    const viewAll = { tagName: "A" };
    const viewAll2 = { tagName: "A" };
    const optionRow = {
      tagName: "BUTTON",
      getAttribute: (name: string) =>
        name === "data-studio-plp-option-count" ? "3" : null,
      querySelector: (sel: string) =>
        sel.includes("plp__option-count")
          ? { textContent: "3" }
          : null,
    };
    let modalOpen = false;
    let listingPhase = "idle";
    const listingHost = {
      tagName: "DIV",
      getAttribute: (name: string) =>
        name === "data-studio-plp-listing-phase" ? listingPhase : null,
    };
    const resultsCount: {
      tagName: string;
      textContent: string;
      getAttribute: (name: string) => string | null;
    } = {
      tagName: "P",
      get textContent() {
        return listingPhase === "loading" ? "" : "12 jabs available";
      },
      getAttribute(name: string) {
        if (name === "data-studio-plp-results-loading") {
          return listingPhase === "loading" ? "true" : null;
        }
        if (name === "data-studio-plp-results") {
          return listingPhase === "loading" ? "" : "12";
        }
        return null;
      },
    };
    const listingLoader = { tagName: "DIV" };

    simulateDemoPointerClick.mockImplementation(async (el: { tagName?: string }) => {
      if (el === reset) {
        listingPhase = "loading";
        // Mid-load window for reset assert; then reveal for count-ready.
        setTimeout(() => {
          listingPhase = "reveal";
        }, 120);
        return true;
      }
      if (el === quick) {
        modalOpen = true;
        isBlockingModalOpen.mockReturnValue(true);
        locationState.search =
          "?project=boots-pharmacy&screen=plp&modal=quick-view";
        locationState.href =
          "http://localhost:5173/?project=boots-pharmacy&screen=plp&modal=quick-view";
        return true;
      }
      if (el === book && modalOpen) {
        return false;
      }
      if (el === close) {
        modalOpen = false;
        isBlockingModalOpen.mockReturnValue(false);
        locationState.search = "?project=boots-pharmacy&screen=plp";
        locationState.href =
          "http://localhost:5173/?project=boots-pharmacy&screen=plp";
        return true;
      }
      return true;
    });
    isElementBlockedByModal.mockImplementation((el) => el === book && modalOpen);

    const locationState = {
      href: "http://localhost:5173/?project=boots-pharmacy&screen=plp",
      search: "?project=boots-pharmacy&screen=plp",
      pathname: "/",
      hash: "",
    };
    const replaceState = vi.fn(
      (_state: unknown, _title: string, url?: string) => {
        if (typeof url === "string") {
          const path = url.startsWith("http")
            ? new URL(url).pathname + new URL(url).search
            : url;
          const qs = path.includes("?") ? path.slice(path.indexOf("?")) : "";
          locationState.search = qs || "";
          locationState.href = `http://localhost:5173${path.startsWith("/") ? path : `/${path}`}`;
        }
      }
    );
    vi.stubGlobal("window", {
      location: locationState,
      history: { state: null, replaceState, pushState: vi.fn() },
      dispatchEvent: vi.fn(() => true),
    });
    vi.stubGlobal("document", {
      querySelector: (sel: string) => {
        if (sel === '[data-studio-react-screen="plp"]') return host;
        if (sel.includes('[data-studio-search-icon="true"]')) return searchIcon;
        if (sel.includes('placeholder="Search diseases"')) return diseaseInput;
        if (sel.includes('placeholder="Search countries"')) return countryInput;
        if (sel.includes("data-studio-plp-view-all")) return viewAll;
        if (sel.includes("data-studio-plp-option-count")) return optionRow;
        if (sel.includes('button[data-name="component.plp.filter.checkbox.item"]'))
          return checkbox;
        if (sel.includes("button[data-studio-plp-reset-filters")) return reset;
        if (sel.includes("data-studio-plp-listing-phase")) return listingHost;
        if (sel.includes("data-studio-plp-listing-loader")) return listingLoader;
        if (sel.includes("data-studio-plp-results")) return resultsCount;
        if (sel.includes("data-studio-probe-below-fold")) return belowFold;
        if (sel.includes("button[data-studio-quick-view")) return quick;
        if (sel.includes('button[data-studio-action="plp-book-now"]'))
          return book;
        if (sel.includes('data-studio-modal="quick-view"')) return close;
        return null;
      },
      querySelectorAll: (sel: string) => {
        if (sel.includes('[data-studio-search-icon="true"]')) {
          return [searchIcon, searchIcon2];
        }
        if (sel.includes("data-studio-plp-view-all")) {
          return [viewAll, viewAll2];
        }
        if (sel.includes("data-studio-plp-option-count")) {
          return [optionRow, optionRow, optionRow, optionRow];
        }
        return [];
      },
    });

    const result = await runMcpPageProbe({
      screenId: "plp",
      reload: false,
    });
    expect(result.screenId).toBe("plp");
    expect(result.checks.find((c) => c.id === "overlay-arm")?.pass).toBe(true);
    expect(result.checks.find((c) => c.id === "plp-host")?.pass).toBe(true);
    expect(result.checks.find((c) => c.id === "plp-search-icons")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "plp-filter-view-all")?.pass).toBe(
      true
    );
    expect(
      result.checks.find((c) => c.id === "plp-filter-option-counters")?.pass
    ).toBe(true);
    expect(result.checks.find((c) => c.id === "plp-reset-filters")?.pass).toBe(
      true
    );
    expect(
      result.checks.find((c) => c.id === "plp-reset-count-ready")?.pass
    ).toBe(true);
    expect(result.checks.find((c) => c.id === "plp-quick-view-ready")?.pass).toBe(
      true
    );
    expect(
      result.checks.find((c) => c.id === "plp-below-fold-scroll")?.pass
    ).toBe(true);
    expect(result.checks.find((c) => c.id === "plp-quick-view")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "plp-overlay-eyes")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "plp-quick-view-close")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "url-screen")?.pass).toBe(true);
    expect(result.pass).toBe(true);
    // HARD teardown: no sticky &modal= after probe finally
    expect(locationState.search).not.toContain("modal=");
    expect(new URLSearchParams(locationState.search).has("modal")).toBe(false);
  });

  it("fails overlay-eyes when probe can click through", async () => {
    const host = { tagName: "DIV" };
    const checkbox = { tagName: "BUTTON" };
    const reset = { tagName: "BUTTON" };
    const quick = {
      tagName: "BUTTON",
      getBoundingClientRect: () => ({ width: 40, height: 24 }),
    };
    const belowFold = {
      tagName: "BUTTON",
      isConnected: true,
      getBoundingClientRect: () => ({ width: 40, height: 24 }),
    };
    const book = { tagName: "BUTTON" };
    const close = { tagName: "BUTTON" };
    const searchIcon = {
      tagName: "SPAN",
      getBoundingClientRect: () => ({ width: 24, height: 24 }),
      getAttribute: (name: string) =>
        name === "data-studio-search-icon-pos" ? "end" : null,
    };
    const searchIcon2 = {
      tagName: "SPAN",
      getBoundingClientRect: () => ({ width: 24, height: 24 }),
      getAttribute: (name: string) =>
        name === "data-studio-search-icon-pos" ? "end" : null,
    };
    const diseaseField = {
      querySelector: (sel: string) =>
        sel.includes("data-studio-search-icon") ? searchIcon : null,
      querySelectorAll: () => [],
    };
    const countryField = {
      querySelector: (sel: string) =>
        sel.includes("data-studio-search-icon") ? searchIcon2 : null,
      querySelectorAll: () => [],
    };
    const diseaseInput = {
      type: "text",
      closest: (sel: string) =>
        sel.includes("component.input.field") ? diseaseField : null,
    };
    const countryInput = {
      type: "text",
      closest: (sel: string) =>
        sel.includes("component.input.field") ? countryField : null,
    };
    const viewAll = { tagName: "A" };
    const optionRow = {
      tagName: "BUTTON",
      getAttribute: () => "1",
      querySelector: () => ({ textContent: "1" }),
    };
    let listingPhase = "idle";
    const listingHost = {
      tagName: "DIV",
      getAttribute: (name: string) =>
        name === "data-studio-plp-listing-phase" ? listingPhase : null,
    };
    const resultsCount = {
      tagName: "P",
      get textContent() {
        return listingPhase === "loading" ? "" : "12 jabs available";
      },
      getAttribute(name: string) {
        if (name === "data-studio-plp-results-loading") {
          return listingPhase === "loading" ? "true" : null;
        }
        if (name === "data-studio-plp-results") {
          return listingPhase === "loading" ? "" : "12";
        }
        return null;
      },
    };
    const listingLoader = { tagName: "DIV" };

    isBlockingModalOpen.mockReturnValue(true);
    isElementBlockedByModal.mockReturnValue(true);
    // Felony path: under-click still "succeeds" (except we still advance reset phase)
    simulateDemoPointerClick.mockImplementation(async (el: { tagName?: string }) => {
      if (el === reset) {
        listingPhase = "loading";
        setTimeout(() => {
          listingPhase = "reveal";
        }, 120);
      }
      return true;
    });

    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?project=boots-pharmacy&screen=plp",
        search: "?project=boots-pharmacy&screen=plp",
      },
    });
    vi.stubGlobal("document", {
      querySelector: (sel: string) => {
        if (sel === '[data-studio-react-screen="plp"]') return host;
        if (sel.includes('[data-studio-search-icon="true"]')) return searchIcon;
        if (sel.includes('placeholder="Search diseases"')) return diseaseInput;
        if (sel.includes('placeholder="Search countries"')) return countryInput;
        if (sel.includes("data-studio-plp-view-all")) return viewAll;
        if (sel.includes("data-studio-plp-option-count")) return optionRow;
        if (sel.includes('button[data-name="component.plp.filter.checkbox.item"]'))
          return checkbox;
        if (sel.includes("button[data-studio-plp-reset-filters")) return reset;
        if (sel.includes("data-studio-plp-listing-phase")) return listingHost;
        if (sel.includes("data-studio-plp-listing-loader")) return listingLoader;
        if (sel.includes("data-studio-plp-results")) return resultsCount;
        if (sel.includes("data-studio-probe-below-fold")) return belowFold;
        if (sel.includes("button[data-studio-quick-view")) return quick;
        if (sel.includes('button[data-studio-action="plp-book-now"]'))
          return book;
        if (sel.includes('data-studio-modal="quick-view"')) return close;
        return null;
      },
      querySelectorAll: (sel: string) => {
        if (sel.includes('[data-studio-search-icon="true"]')) {
          return [searchIcon, searchIcon2];
        }
        if (sel.includes("data-studio-plp-view-all")) {
          return [viewAll, viewAll];
        }
        if (sel.includes("data-studio-plp-option-count")) {
          return [optionRow, optionRow, optionRow, optionRow];
        }
        return [];
      },
    });

    const result = await runMcpPageProbe({
      screenId: "plp",
      reload: false,
    });
    expect(result.checks.find((c) => c.id === "plp-overlay-eyes")?.pass).toBe(
      false
    );
    expect(result.pass).toBe(false);
  });

  it("passes PDP recipe with overlay eyes + below-fold reveal (L14–L20)", async () => {
    const belowFold = { tagName: "SECTION" };
    const pdpRoot = {
      tagName: "DIV",
      className: "pdp",
      textContent:
        "Chickenpox Collect 3 points for every £1 you spend with Boots Advantage Card‡",
      querySelector: (sel: string) => {
        if (sel === "header") return { tagName: "HEADER" };
        if (sel === "main") return { tagName: "MAIN" };
        if (sel.includes("data-studio-probe-below-fold")) return belowFold;
        return null;
      },
    };
    const retired = { tagName: "DIV" };
    const advantage = {
      tagName: "DIV",
      textContent:
        "Collect 3 points for every £1 you spend with Boots Advantage Card‡",
    };
    let boosterChecked = true;
    const checkbox = {
      tagName: "BUTTON",
      getAttribute: (name: string) =>
        name === "data-checkbox-checked" ? String(boosterChecked) : null,
    };
    const book = {
      tagName: "BUTTON",
      get textContent() {
        return boosterChecked ? "Book now - £150" : "Book now - £75";
      },
    };
    const checkAvail = { tagName: "BUTTON" };
    const heartBtn = { tagName: "BUTTON" };
    const heartIcon = {
      tagName: "SPAN",
      classList: { contains: () => false },
    };
    const crumb = { tagName: "BUTTON" };
    const plpHost = { tagName: "DIV" };
    const plpBook = { tagName: "BUTTON" };
    const loginClose = { tagName: "BUTTON" };
    const availClose = { tagName: "BUTTON" };
    const availCard = {
      tagName: "DIV",
      getAttribute: (name: string) =>
        name === "data-studio-avail-step" ? "start" : null,
    };
    const availTitle = { tagName: "H2", textContent: "Find Pharmacy" };
    let faqExpanded = true;
    let faqHelpExpanded = false;
    const faqTrigger = {
      tagName: "BUTTON",
      getAttribute: (name: string) =>
        name === "aria-expanded" ? String(faqExpanded) : null,
    };
    const faqHelpTrigger = {
      tagName: "BUTTON",
      getAttribute: (name: string) =>
        name === "aria-expanded" ? String(faqHelpExpanded) : null,
    };
    const faqNhsTrigger = {
      tagName: "BUTTON",
      getAttribute: (name: string) =>
        name === "aria-expanded" ? "false" : null,
    };
    const faqBody = {
      tagName: "DIV",
      className: "uxds-accordion-content",
      textContent:
        "Chickenpox can affect any age, but complications are more likely in adults, pregnant women, newborn babies and people with a weakened immune system.",
      getAttribute: (name: string) =>
        name === "data-state" ? (faqExpanded ? "open" : "closed") : null,
    };
    const faqHelpBody = {
      tagName: "DIV",
      className: "uxds-accordion-content",
      textContent:
        "Our private Chickenpox Vaccination Service is suitable for adults and children aged between one and 65 years. A full course consists of two doses given 4 to 6 weeks apart. Eligibility criteria apply and suitability will be checked before each vaccination is given.",
      getAttribute: (name: string) =>
        name === "data-state" ? (faqHelpExpanded ? "open" : "closed") : null,
    };
    const faqClosedShell = {
      tagName: "DIV",
      className: "uxds-accordion-content",
      getAttribute: (name: string) => (name === "data-state" ? "closed" : null),
    };
    const faqResiduals: unknown[] = [];
    const downloadGuide = {
      tagName: "BUTTON",
      className: "pdp__pill",
      classList: {
        contains: (c: string) => c === "pdp__pill",
      },
    };
    const downloadLeaflet = {
      tagName: "BUTTON",
      className: "pdp__pill",
      classList: {
        contains: (c: string) => c === "pdp__pill",
      },
    };

    let modalOpen = false;
    let modalKind: "login" | "choose-pharmacy" | null = null;
    const locationState = {
      href: "http://localhost:5173/?project=boots-pharmacy&screen=pdp",
      search: "?project=boots-pharmacy&screen=pdp",
      pathname: "/",
      hash: "",
    };
    const replaceState = vi.fn(
      (_state: unknown, _title: string, url?: string) => {
        if (typeof url === "string") {
          const path = url.startsWith("http")
            ? new URL(url).pathname + new URL(url).search
            : url;
          const qs = path.includes("?") ? path.slice(path.indexOf("?")) : "";
          locationState.search = qs || "";
          locationState.href = `http://localhost:5173${path.startsWith("/") ? path : `/${path}`}`;
        }
      }
    );

    const syncUrl = () => {
      const modalQ = modalKind ? `&modal=${modalKind}` : "";
      const screenId = /screen=([^&]+)/.exec(locationState.search)?.[1] ?? "pdp";
      locationState.search = `?project=boots-pharmacy&screen=${screenId}${modalQ}`;
      locationState.href = `http://localhost:5173/${locationState.search}`;
    };

    simulateDemoPointerClick.mockImplementation(async (el: { tagName?: string }) => {
      if (el === checkbox) {
        boosterChecked = !boosterChecked;
        return true;
      }
      if (el === book && !modalOpen) {
        modalOpen = true;
        modalKind = "login";
        isBlockingModalOpen.mockReturnValue(true);
        syncUrl();
        return true;
      }
      if (el === checkAvail && modalOpen) {
        return false;
      }
      if (el === checkAvail && !modalOpen) {
        modalOpen = true;
        modalKind = "choose-pharmacy";
        isBlockingModalOpen.mockReturnValue(true);
        syncUrl();
        return true;
      }
      if (el === book && modalOpen) {
        return false;
      }
      if (el === loginClose || el === availClose) {
        modalOpen = false;
        modalKind = null;
        isBlockingModalOpen.mockReturnValue(false);
        syncUrl();
        return true;
      }
      if (el === crumb) {
        locationState.search = "?project=boots-pharmacy&screen=plp";
        locationState.href =
          "http://localhost:5173/?project=boots-pharmacy&screen=plp";
        return true;
      }
      if (el === plpBook) {
        locationState.search = "?project=boots-pharmacy&screen=pdp";
        locationState.href =
          "http://localhost:5173/?project=boots-pharmacy&screen=pdp";
        return true;
      }
      if (el === faqTrigger) {
        faqExpanded = !faqExpanded;
        if (faqExpanded) faqHelpExpanded = false;
        return true;
      }
      if (el === faqHelpTrigger) {
        faqHelpExpanded = !faqHelpExpanded;
        if (faqHelpExpanded) faqExpanded = false;
        return true;
      }
      return true;
    });
    isElementBlockedByModal.mockImplementation(
      (el) => modalOpen && (el === checkAvail || el === book)
    );

    const hoverRule = {
      selectorText:
        ".pdp__icon-hit:hover .pdp__heart-icon:not(.is-active)",
      cssText:
        ".pdp__icon-hit:hover .pdp__heart-icon:not(.is-active){color:var(--uxds-text-link-link)}",
    };
    const washRule = {
      selectorText: ".pdp__icon-hit:hover::before",
      cssText: ".pdp__icon-hit:hover::before{background:#eef8f7}",
    };
    const checkboxHoverRule = {
      selectorText: ".pdp__checkbox-row:hover .pdp__checkbox-box",
      cssText:
        ".pdp__checkbox-row:hover .pdp__checkbox-box{background:var(--uxds-surface-accent-soft)}",
    };
    const pillHoverRule = {
      selectorText: ".pdp__pill:hover:not(:disabled)",
      cssText: ".pdp__pill:hover:not(:disabled){color:#000000}",
    };
    const pillIconHoverRule = {
      selectorText: ".pdp__pill:hover:not(:disabled) .pdp__pill-icon",
      cssText:
        ".pdp__pill:hover:not(:disabled) .pdp__pill-icon{color:var(--uxds-text-link-link)}",
    };
    const accordionFocusRule = {
      selectorText: ".pdp__accordion-header:focus-visible",
      cssText: ".pdp__accordion-header:focus-visible{outline:none}",
    };

    vi.stubGlobal("window", {
      location: locationState,
      history: { state: null, replaceState, pushState: vi.fn() },
      dispatchEvent: vi.fn(() => true),
      __studioIsLoggedIn: () => false,
    });
    vi.stubGlobal("document", {
      styleSheets: [
        {
          cssRules: [
            hoverRule,
            washRule,
            checkboxHoverRule,
            pillHoverRule,
            pillIconHoverRule,
            accordionFocusRule,
          ],
        },
      ],
      querySelector: (sel: string) => {
        if (sel === '.pdp[data-studio-react-screen="pdp"]') return pdpRoot;
        if (sel === '[data-studio-react-screen="pdp"]') return pdpRoot;
        if (sel.includes("data-studio-make-retired")) return retired;
        if (sel.includes(".pdp__advantage")) return advantage;
        if (sel.includes('data-name="component.input.checkbox"')) return checkbox;
        if (sel.includes('data-studio-action="pdp-book-now"')) return book;
        if (sel.includes('data-studio-action="pdp-check-availability"'))
          return checkAvail;
        if (sel.includes('aria-label="Add to wishlist"')) return heartBtn;
        if (sel.includes(".pdp__heart-icon:not(.is-active)")) return heartIcon;
        if (sel.includes('data-studio-crumb="vaccination"')) return crumb;
        if (sel === '[data-studio-react-screen="plp"]') return plpHost;
        if (sel.includes('data-studio-action="plp-book-now"')) return plpBook;
        if (sel.includes('data-studio-modal="login"')) return loginClose;
        if (
          sel.includes('data-studio-modal="choose-pharmacy"') &&
          sel.includes("data-studio-avail-step")
        ) {
          return availCard;
        }
        if (sel.includes('data-studio-modal="choose-pharmacy"')) return availClose;
        if (sel === "#proto-avail-title") return availTitle;
        if (sel.includes("data-studio-probe-below-fold")) return belowFold;
        if (sel.includes('data-studio-action="pdp-faq-who-is-at-risk"'))
          return faqTrigger;
        if (sel.includes('data-studio-action="pdp-faq-how-can-boots-help"'))
          return faqHelpTrigger;
        if (sel.includes('data-studio-action="pdp-faq-nhs-vaccination"'))
          return faqNhsTrigger;
        if (sel.includes('data-studio-accordion-open="who-is-at-risk"')) {
          return faqExpanded ? faqBody : null;
        }
        if (sel.includes('data-studio-accordion-open="how-can-boots-help"')) {
          return faqHelpExpanded ? faqHelpBody : null;
        }
        if (
          sel.includes('data-uxds-accordion-item="who-is-at-risk"') &&
          sel.includes("uxds-accordion-content")
        ) {
          return faqExpanded ? faqBody : faqClosedShell;
        }
        if (sel.includes('data-studio-action="pdp-download-guide"'))
          return downloadGuide;
        if (sel.includes('data-studio-action="pdp-download-leaflet"'))
          return downloadLeaflet;
        return null;
      },
      querySelectorAll: (sel: string) => {
        if (sel.includes("data-studio-faq-residual")) return faqResiduals;
        return [];
      },
    });
    vi.stubGlobal("getComputedStyle", () => ({ color: "rgb(175, 204, 202)" }));

    const result = await runMcpPageProbe({
      screenId: "pdp",
      reload: false,
    });

    expect(result.screenId).toBe("pdp");
    expect(result.checks.find((c) => c.id === "overlay-arm")?.pass).toBe(true);
    expect(result.checks.find((c) => c.id === "pdp-host")?.pass).toBe(true);
    expect(result.checks.find((c) => c.id === "pdp-landmarks")?.pass).toBe(true);
    expect(result.checks.find((c) => c.id === "pdp-advantage")?.pass).toBe(true);
    expect(result.checks.find((c) => c.id === "pdp-no-loader")?.pass).toBe(true);
    expect(result.checks.find((c) => c.id === "pdp-booster-price-on")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "pdp-booster-uncheck")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "pdp-booster-recheck")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "pdp-heart-hover")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "pdp-book-logged-out")?.pass).toBe(
      true
    );
    expect(
      result.checks.find((c) => c.id === "pdp-overlay-eyes-login")?.pass
    ).toBe(true);
    expect(result.checks.find((c) => c.id === "pdp-login-close")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "pdp-check-avail")?.pass).toBe(
      true
    );
    expect(
      result.checks.find((c) => c.id === "pdp-overlay-eyes-avail")?.pass
    ).toBe(true);
    expect(result.checks.find((c) => c.id === "pdp-avail-close")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "pdp-crumb-plp")?.pass).toBe(true);
    expect(result.checks.find((c) => c.id === "plp-to-pdp")?.pass).toBe(true);
    const below = result.checks.find((c) => c.id === "pdp-below-fold-scroll");
    expect(below?.pass).toBe(true);
    expect(below?.detail ?? "").not.toMatch(/soft-skip/);
    expect(
      result.checks.find((c) => c.id === "pdp-faq-accordion-toggle")?.pass
    ).toBe(true);
    expect(
      result.checks.find((c) => c.id === "pdp-faq-accordion-reopen")?.pass
    ).toBe(true);
    expect(result.checks.find((c) => c.id === "pdp-faq-help-body")?.pass).toBe(
      true
    );
    expect(
      result.checks.find((c) => c.id === "pdp-download-cta-hover")?.pass
    ).toBe(true);
    expect(result.checks.find((c) => c.id === "url-screen")?.pass).toBe(true);
    expect(result.pass).toBe(true);
    // HARD teardown: PDP avail probe must not leave &modal=choose-pharmacy
    expect(locationState.search).not.toContain("modal=");
    expect(new URLSearchParams(locationState.search).has("modal")).toBe(false);
  });

  it("teardown strips sticky choose-pharmacy even if probe left it open", async () => {
    const pdpRoot = {
      tagName: "DIV",
      querySelector: (sel: string) => {
        if (sel.includes('aria-label="Product"') || sel === "header") {
          return { tagName: "HEADER" };
        }
        if (sel === "main") return { tagName: "MAIN" };
        return null;
      },
    };
    const locationState = {
      href: "http://localhost:5173/?project=boots-pharmacy&screen=pdp&modal=choose-pharmacy",
      search: "?project=boots-pharmacy&screen=pdp&modal=choose-pharmacy",
      pathname: "/",
      hash: "",
    };
    const replaceState = vi.fn(
      (_state: unknown, _title: string, url?: string) => {
        if (typeof url === "string") {
          const path = url.startsWith("http")
            ? new URL(url).pathname + new URL(url).search
            : url;
          const qs = path.includes("?") ? path.slice(path.indexOf("?")) : "";
          locationState.search = qs || "";
          locationState.href = `http://localhost:5173${path.startsWith("/") ? path : `/${path}`}`;
        }
      }
    );
    vi.stubGlobal("window", {
      location: locationState,
      history: { state: null, replaceState, pushState: vi.fn() },
      dispatchEvent: vi.fn(() => true),
      __studioIsLoggedIn: () => false,
    });
    // Minimal document — force early exit via missing recipe targets is OK;
    // finally must still clear modal.
    vi.stubGlobal("document", {
      styleSheets: [],
      querySelector: (sel: string) => {
        if (sel === '.pdp[data-studio-react-screen="pdp"]') return pdpRoot;
        if (sel === '[data-studio-react-screen="pdp"]') return pdpRoot;
        return null;
      },
      querySelectorAll: () => [],
    });

    await runMcpPageProbe({ screenId: "pdp", reload: false, settleMs: 0 });

    expect(locationState.search).not.toContain("modal=");
    expect(new URLSearchParams(locationState.search).get("modal")).toBeNull();
    expect(locationState.search).toContain("screen=pdp");
  });
});
