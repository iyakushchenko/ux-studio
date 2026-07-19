import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SETTLE_MS,
  isAgentTestingOverlayActive,
  isAgentTestingOverlaySettling,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  touchAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/protoAgentTestingOverlay";

describe("protoAgentTestingOverlay", () => {
  afterEach(() => {
    uninstallAgentTestingOverlayApi();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
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

  it("stop() enters DONE settle then clears; reload waits until after settle", () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    vi.stubGlobal("window", {
      setTimeout: (fn: TimerHandler, ms?: number) =>
        globalThis.setTimeout(fn as () => void, ms),
      clearTimeout: (id: ReturnType<typeof setTimeout>) =>
        globalThis.clearTimeout(id),
      addEventListener: () => {},
      removeEventListener: () => {},
      location: { reload },
    });

    startAgentTestingOverlay("reload-settle");
    stopAgentTestingOverlay({ reload: true });
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(true);
    expect(reload).not.toHaveBeenCalled();

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS - 1);
    expect(isAgentTestingOverlaySettling()).toBe(true);
    expect(reload).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(isAgentTestingOverlaySettling()).toBe(false);
    // scheduleReload defers another 120ms
    expect(reload).not.toHaveBeenCalled();
    vi.advanceTimersByTime(120);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("manual stop defaults to settle without reload", () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    vi.stubGlobal("window", {
      setTimeout: (fn: TimerHandler, ms?: number) =>
        globalThis.setTimeout(fn as () => void, ms),
      clearTimeout: (id: ReturnType<typeof setTimeout>) =>
        globalThis.clearTimeout(id),
      addEventListener: () => {},
      removeEventListener: () => {},
      location: { reload },
    });

    startAgentTestingOverlay();
    stopAgentTestingOverlay();
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(true);
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
