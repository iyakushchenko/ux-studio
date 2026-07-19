import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SETTLE_MS,
  forceClearAgentTestingOverlay,
  IDLE_MS,
  isAgentTestingOverlayActive,
  isAgentTestingOverlaySettling,
  resolveAgentTestingOverlayTitle,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  touchAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agentTestingOverlay";

describe("agentTestingOverlay", () => {
  afterEach(() => {
    uninstallAgentTestingOverlayApi();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("strips garbled helper names from titles", () => {
    expect(
      resolveAgentTestingOverlayTitle(
        "AGENT TESTING — __studioEnsureCleanStudio"
      )
    ).toBe("AGENT TESTING");
    expect(
      resolveAgentTestingOverlayTitle("__studioEnsureCleanStudio")
    ).toBe("AGENT TESTING");
    expect(resolveAgentTestingOverlayTitle("AGENT TESTING — mcp-sanity")).toBe(
      "AGENT TESTING — mcp-sanity"
    );
  });

  it("touch arms once without nesting", () => {
    touchAgentTestingOverlay("AGENT TESTING — touch");
    expect(isAgentTestingOverlayActive()).toBe(true);
    touchAgentTestingOverlay("still active");
    stopAgentTestingOverlay({ force: true });
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(false);
  });

  it("nests start/stop and force-clears", () => {
    // Node Vitest has no document — API still tracks active nest for MCP sessions.
    startAgentTestingOverlay("AGENT TESTING — unit");
    expect(isAgentTestingOverlayActive()).toBe(true);
    startAgentTestingOverlay("nested");
    stopAgentTestingOverlay();
    expect(isAgentTestingOverlayActive()).toBe(true);
    stopAgentTestingOverlay();
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(true);

    stopAgentTestingOverlay({ force: true });
    expect(isAgentTestingOverlaySettling()).toBe(false);

    startAgentTestingOverlay();
    startAgentTestingOverlay();
    stopAgentTestingOverlay({ force: true });
    expect(isAgentTestingOverlayActive()).toBe(false);
  });

  it("forceClear always clears active + settle", () => {
    startAgentTestingOverlay();
    stopAgentTestingOverlay();
    expect(isAgentTestingOverlaySettling()).toBe(true);
    forceClearAgentTestingOverlay();
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(false);
  });

  it("touch without stop auto-clears after idle", () => {
    vi.useFakeTimers();
    touchAgentTestingOverlay();
    expect(isAgentTestingOverlayActive()).toBe(true);
    vi.advanceTimersByTime(IDLE_MS);
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(true);
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(isAgentTestingOverlaySettling()).toBe(false);
  });

  it("stop() enters DONE settle then clears; reload waits until after settle", () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    const replaceState = vi.fn();
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", {
      setTimeout: (fn: TimerHandler, ms?: number) =>
        globalThis.setTimeout(fn as () => void, ms),
      clearTimeout: (id: ReturnType<typeof setTimeout>) =>
        globalThis.clearTimeout(id),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent,
      location: {
        reload,
        href: "http://localhost:5173/?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy",
        pathname: "/",
        search:
          "?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
    });

    startAgentTestingOverlay("reload-settle");
    stopAgentTestingOverlay({ reload: true });
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(true);
    expect(reload).not.toHaveBeenCalled();
    // Sitrep starts with clean-slate URL (hub, no modal).
    expect(replaceState).toHaveBeenCalled();
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toBe(
      "/?project=boots-pharmacy&screen=hub"
    );

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS - 1);
    expect(isAgentTestingOverlaySettling()).toBe(true);
    expect(reload).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(isAgentTestingOverlaySettling()).toBe(false);
    // scheduleReload defers another 120ms
    expect(reload).not.toHaveBeenCalled();
    vi.advanceTimersByTime(120);
    expect(reload).toHaveBeenCalledTimes(1);
    // Immediate pre-reload reset must not leave modal in the bar.
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toBe(
      "/?project=boots-pharmacy&screen=hub"
    );
    expect(String(replaceState.mock.calls.at(-1)?.[2])).not.toContain("modal");
  });

  it("manual stop defaults to settle without reload", () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      setTimeout: (fn: TimerHandler, ms?: number) =>
        globalThis.setTimeout(fn as () => void, ms),
      clearTimeout: (id: ReturnType<typeof setTimeout>) =>
        globalThis.clearTimeout(id),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: vi.fn(),
      location: {
        reload,
        href: "http://localhost:5173/?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy",
        pathname: "/",
        search:
          "?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
    });

    startAgentTestingOverlay();
    stopAgentTestingOverlay();
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(true);
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toBe(
      "/?project=boots-pharmacy&screen=hub"
    );
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(isAgentTestingOverlaySettling()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("force dismiss skips settle and clears instantly", () => {
    vi.useFakeTimers();
    startAgentTestingOverlay();
    stopAgentTestingOverlay({ force: true });
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(false);
  });
});
