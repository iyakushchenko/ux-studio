import { afterEach, describe, expect, it, vi } from "vitest";
import { runMcpPageProbe } from "@/app/shell/studioMcpPageProbe";

const simulateDemoPointerClick = vi.fn(async () => true);

vi.mock("@/app/scenario/demoCursor", () => ({
  simulateDemoPointerClick: (...args: unknown[]) =>
    simulateDemoPointerClick(...args),
}));

vi.mock("@/app/shell/agentTestingOverlay", () => ({
  startAgentTestingOverlay: vi.fn(),
  stopAgentTestingOverlay: vi.fn(),
  logAgentTestingOverlay: vi.fn(),
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
    isBlockingModalOpen.mockReset();
    isBlockingModalOpen.mockReturnValue(false);
    isElementBlockedByModal.mockReset();
    isElementBlockedByModal.mockReturnValue(false);
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
    const book = { tagName: "BUTTON" };
    const close = { tagName: "BUTTON" };
    const searchIcon = {
      tagName: "SPAN",
      getBoundingClientRect: () => ({ width: 24, height: 24 }),
    };
    const searchIcon2 = {
      tagName: "SPAN",
      getBoundingClientRect: () => ({ width: 24, height: 24 }),
    };
    const diseaseField = {
      querySelector: (sel: string) =>
        sel.includes("data-studio-search-icon") ? searchIcon : null,
    };
    const countryField = {
      querySelector: (sel: string) =>
        sel.includes("data-studio-search-icon") ? searchIcon2 : null,
    };
    const diseaseInput = {
      closest: (sel: string) =>
        sel.includes("component.input.field") ? diseaseField : null,
    };
    const countryInput = {
      closest: (sel: string) =>
        sel.includes("component.input.field") ? countryField : null,
    };
    let modalOpen = false;

    simulateDemoPointerClick.mockImplementation(async (el: { tagName?: string }) => {
      if (el === quick) {
        modalOpen = true;
        isBlockingModalOpen.mockReturnValue(true);
        return true;
      }
      if (el === book && modalOpen) {
        return false;
      }
      if (el === close) {
        modalOpen = false;
        isBlockingModalOpen.mockReturnValue(false);
        return true;
      }
      return true;
    });
    isElementBlockedByModal.mockImplementation((el) => el === book && modalOpen);

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
        if (sel.includes('button[data-name="component.plp.filter.checkbox.item"]'))
          return checkbox;
        if (sel.includes("button[data-studio-plp-reset-filters")) return reset;
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
        return [];
      },
    });

    const result = await runMcpPageProbe({
      screenId: "plp",
      reload: false,
    });
    expect(result.screenId).toBe("plp");
    expect(result.checks.find((c) => c.id === "plp-host")?.pass).toBe(true);
    expect(result.checks.find((c) => c.id === "plp-search-icons")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "plp-quick-view-ready")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "plp-overlay-eyes")?.pass).toBe(
      true
    );
    expect(result.checks.find((c) => c.id === "url-screen")?.pass).toBe(true);
    expect(result.pass).toBe(true);
  });

  it("fails overlay-eyes when probe can click through", async () => {
    const host = { tagName: "DIV" };
    const checkbox = { tagName: "BUTTON" };
    const reset = { tagName: "BUTTON" };
    const quick = {
      tagName: "BUTTON",
      getBoundingClientRect: () => ({ width: 40, height: 24 }),
    };
    const book = { tagName: "BUTTON" };
    const close = { tagName: "BUTTON" };
    const searchIcon = {
      tagName: "SPAN",
      getBoundingClientRect: () => ({ width: 24, height: 24 }),
    };
    const searchIcon2 = {
      tagName: "SPAN",
      getBoundingClientRect: () => ({ width: 24, height: 24 }),
    };
    const diseaseField = {
      querySelector: (sel: string) =>
        sel.includes("data-studio-search-icon") ? searchIcon : null,
    };
    const countryField = {
      querySelector: (sel: string) =>
        sel.includes("data-studio-search-icon") ? searchIcon2 : null,
    };
    const diseaseInput = {
      closest: (sel: string) =>
        sel.includes("component.input.field") ? diseaseField : null,
    };
    const countryInput = {
      closest: (sel: string) =>
        sel.includes("component.input.field") ? countryField : null,
    };

    isBlockingModalOpen.mockReturnValue(true);
    isElementBlockedByModal.mockReturnValue(true);
    // Felony path: under-click still "succeeds"
    simulateDemoPointerClick.mockResolvedValue(true);

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
        if (sel.includes('button[data-name="component.plp.filter.checkbox.item"]'))
          return checkbox;
        if (sel.includes("button[data-studio-plp-reset-filters")) return reset;
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
});
