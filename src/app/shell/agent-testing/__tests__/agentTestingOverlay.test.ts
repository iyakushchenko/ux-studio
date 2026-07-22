import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", () => ({
  removeDemoCursor: vi.fn(),
  cancelDemoCursorTravel: vi.fn(),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  cancelPlaybackScroll: vi.fn(),
}));

import {
  DEFAULT_SETTLE_MS,
  forceClearAgentTestingOverlay,
  formatPreArmHint,
  formatSitrepHint,
  formatSitrepHeldHint,
  formatSitrepTitle,
  holdSettleOpen,
  IDLE_MS,
  installAgentTestingOverlayApi,
  isAgentTestingOverlayActive,
  isAgentTestingOverlaySettling,
  peekPoSignal,
  registerPoSignalPlaybackHalt,
  resolveAgentTestingOverlayTitle,
  ringAgentTestingAlarm,
  scheduleAgentTestingOverlayEnsureClear,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  touchAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
  appendAgentTestingUserMessage,
} from "@/app/shell/agent-testing";
import { formatActivityStatus } from "@/app/shell/agent-testing/agentTestingActivity";
import { peekQaAgentPresence } from "@/app/shell/agent-testing/agentTestingPresence";

describe("agentTestingOverlay", () => {
  afterEach(() => {
    uninstallAgentTestingOverlayApi();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("ringAlarm halts Play sync and latches ALARM_SEQUENCE_MISMATCH", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const halt = vi.fn();
    const listeners = new Map<string, Set<EventListener>>();
    vi.stubGlobal("window", {
      __studioAgentTestingTakeover: null as unknown,
      setTimeout: (fn: TimerHandler, ms?: number) =>
        globalThis.setTimeout(fn as () => void, ms),
      clearTimeout: (id: ReturnType<typeof setTimeout>) =>
        globalThis.clearTimeout(id),
      setInterval: (fn: TimerHandler, ms?: number) =>
        globalThis.setInterval(fn as () => void, ms),
      clearInterval: (id: ReturnType<typeof setInterval>) =>
        globalThis.clearInterval(id),
      addEventListener: (type: string, fn: EventListener) => {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(fn);
      },
      removeEventListener: (type: string, fn: EventListener) => {
        listeners.get(type)?.delete(fn);
      },
      dispatchEvent: (ev: Event) => {
        const set = listeners.get(ev.type);
        if (set) for (const fn of set) fn(ev);
        return true;
      },
      location: {
        href: "http://localhost:5173/?project=boots-pharmacy&screen=chat",
        pathname: "/",
        search: "?project=boots-pharmacy&screen=chat",
        hash: "",
      },
      history: { state: null, replaceState: vi.fn(), pushState: vi.fn() },
    });
    if (typeof globalThis.CustomEvent === "undefined") {
      vi.stubGlobal(
        "CustomEvent",
        class CustomEvent extends Event {
          detail: unknown;
          constructor(type: string, init?: CustomEventInit) {
            super(type, init);
            this.detail = init?.detail;
          }
        }
      );
    }
    installAgentTestingOverlayApi();
    registerPoSignalPlaybackHalt(halt);
    startAgentTestingOverlay("alarm-latch");
    ringAgentTestingAlarm("progressive bubbles broken");
    // FAIL handoff belt: pause halt + second fail-handoff-belt halt (zero-progress lock).
    expect(halt).toHaveBeenCalledTimes(2);
    expect(peekPoSignal()?.code).toBe("ALARM_SEQUENCE_MISMATCH");
    expect(window.__studioAgentTestingTakeover?.type).toBe("alarm");
    expect(
      warn.mock.calls.some(
        (c) =>
          String(c[0]).includes("[AGENT_TESTING]") &&
          String(c[1]).includes("ALARM_SEQUENCE_MISMATCH")
      )
    ).toBe(true);
    const consumed = window.__studioConsumePoSignal?.();
    expect(consumed?.code).toBe("ALARM_SEQUENCE_MISMATCH");
    expect(peekPoSignal()).toBeNull();
    registerPoSignalPlaybackHalt(null);
    stopAgentTestingOverlay({ force: true });
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

  it("Keep open holds settle open (Wrapping up… → Complete tip)", () => {
    startAgentTestingOverlay();
    stopAgentTestingOverlay({ result: "pass" });
    expect(isAgentTestingOverlaySettling()).toBe(true);
    expect(holdSettleOpen("unit")).toBe(true);
    // Still settling (held), not auto-cleared — Complete tip is formatActivityStatus.
    expect(isAgentTestingOverlaySettling()).toBe(true);
    expect(formatActivityStatus("settling", "complete-pass")).toBe(
      "Complete — PASS"
    );
    expect(holdSettleOpen("unit")).toBe(true); // idempotent when already held
    forceClearAgentTestingOverlay();
    expect(isAgentTestingOverlaySettling()).toBe(false);
  });

  it("scheduleEnsureClear force-clears stuck settle", () => {
    vi.useFakeTimers();
    startAgentTestingOverlay();
    stopAgentTestingOverlay({ result: "fail" });
    expect(isAgentTestingOverlaySettling()).toBe(true);
    scheduleAgentTestingOverlayEnsureClear(100);
    vi.advanceTimersByTime(100);
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(false);
  });

  it("forceClear during settle clears without leaving stuck state", () => {
    vi.useFakeTimers();
    startAgentTestingOverlay();
    stopAgentTestingOverlay({ result: "pass" });
    expect(isAgentTestingOverlaySettling()).toBe(true);
    forceClearAgentTestingOverlay();
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(false);
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS + 2000);
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
      setInterval: (fn: TimerHandler, ms?: number) =>
        globalThis.setInterval(fn as () => void, ms),
      clearInterval: (id: ReturnType<typeof setInterval>) =>
        globalThis.clearInterval(id),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent,
      location: {
        reload,
        href: "http://localhost:5173/?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy&proof=junk",
        pathname: "/",
        search:
          "?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy&proof=junk",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
    });

    startAgentTestingOverlay("reload-settle");
    stopAgentTestingOverlay({ reload: true });
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(true);
    expect(reload).not.toHaveBeenCalled();
    // Sitrep stays on current screen; strips ephemeral proof AND sticky modal.
    expect(replaceState).toHaveBeenCalled();
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toBe(
      "/?project=boots-pharmacy&screen=book-step-1"
    );
    expect(String(replaceState.mock.calls.at(-1)?.[2])).not.toContain("proof");
    expect(String(replaceState.mock.calls.at(-1)?.[2])).not.toContain("modal=");
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "studio-post-agent-reset",
        detail: {
          state: {
            projectId: "boots-pharmacy",
            screenId: "book-step-1",
          },
        },
      })
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
    // Pre-reload reset keeps screen (default stay-on-page) without modal.
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toBe(
      "/?project=boots-pharmacy&screen=book-step-1"
    );
  });

  it("stop({ resetToHub: true }) lands hub URL", () => {
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
        href: "http://localhost:5173/?project=boots-pharmacy&screen=plp",
        pathname: "/",
        search: "?project=boots-pharmacy&screen=plp",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
    });

    startAgentTestingOverlay("hub-reset");
    stopAgentTestingOverlay({ reload: true, resetToHub: true });
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toBe(
      "/?project=boots-pharmacy&screen=hub"
    );
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS + 120);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toBe(
      "/?project=boots-pharmacy&screen=hub"
    );
  });

  it("stop({ resetToJourneyStart: true }) lands site-pilot not hub", () => {
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
        href: "http://localhost:5173/?project=boots-pharmacy&screen=chat&cjm=on&experience=agentic&persona=sarah-jenkins",
        pathname: "/",
        search:
          "?project=boots-pharmacy&screen=chat&cjm=on&experience=agentic&persona=sarah-jenkins",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
    });

    startAgentTestingOverlay("journey-start-reset");
    stopAgentTestingOverlay({ reload: true, resetToJourneyStart: true });
    const afterStop = String(replaceState.mock.calls.at(-1)?.[2]);
    expect(afterStop).toContain("screen=site-pilot");
    expect(afterStop).not.toContain("screen=hub");
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS + 120);
    expect(reload).toHaveBeenCalledTimes(1);
    const afterReload = String(replaceState.mock.calls.at(-1)?.[2]);
    expect(afterReload).toContain("screen=site-pilot");
    expect(afterReload).not.toContain("screen=hub");
  });

  it("sitrep hint copy is Auto-closes countdown with PASS/FAIL flag", () => {
    expect(formatSitrepHint(9, false)).toBe("Auto-closes in 9s");
    expect(formatSitrepHint(9, true)).toBe(
      "Auto-closes in 9s (then reload)"
    );
    expect(formatSitrepHint(9, false, "pass")).toBe("PASS - Auto-closes in 9s");
    expect(formatSitrepHint(9, true, "fail")).toBe(
      "FAIL - Auto-closes in 9s (then reload)"
    );
    expect(formatSitrepHint(0, false)).toBe("Auto-closes in 0s");
    expect(formatSitrepHeldHint()).toBe("Held open — Close when done");
    expect(formatSitrepHeldHint("fail")).toBe(
      "FAIL - Held open — Close when done"
    );
    expect(formatSitrepTitle("pass")).toBe("AGENT DONE - PASS");
    expect(formatSitrepTitle("fail")).toBe("AGENT DONE - FAIL");
    expect(formatSitrepTitle("neutral")).toBe("AGENT DONE - SITREP");
    expect(formatPreArmHint(3)).toBe("Preparing - starting in 3s");
    expect(formatActivityStatus("preparing", "2s")).toBe("Getting ready — 2s");
    expect(formatActivityStatus("running")).toBe("Agent running");
    expect(formatActivityStatus("waiting")).toBe("Awaiting reply");
    expect(formatActivityStatus("settling", "pass")).toBe("Wrapping up…");
    expect(formatActivityStatus("settling")).toBe("Wrapping up…");
    expect(formatActivityStatus("settling", "complete")).toBe("Complete");
    expect(formatActivityStatus("settling", "complete-pass")).toBe(
      "Complete — PASS"
    );
    expect(formatActivityStatus("settling", "complete-fail")).toBe(
      "Complete — FAIL"
    );
    expect(formatActivityStatus("paused", undefined, "manual")).toBe("Paused");
    expect(formatActivityStatus("running", "logger", "manual")).toBe(
      "Capturing"
    );
    expect(formatActivityStatus("running", undefined, "observe")).toBe(
      "Observing"
    );
    expect(formatActivityStatus("paused", undefined, "agent")).toBe("Paused");
    expect(DEFAULT_SETTLE_MS).toBeGreaterThanOrEqual(8000);
  });

  it("manual stop defaults to settle without reload and stays on screen", () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    const replaceState = vi.fn();
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", {
      setTimeout: (fn: TimerHandler, ms?: number) =>
        globalThis.setTimeout(fn as () => void, ms),
      clearTimeout: (id: ReturnType<typeof setTimeout>) =>
        globalThis.clearTimeout(id),
      setInterval: (fn: TimerHandler, ms?: number) =>
        globalThis.setInterval(fn as () => void, ms),
      clearInterval: (id: ReturnType<typeof setInterval>) =>
        globalThis.clearInterval(id),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent,
      location: {
        reload,
        href: "http://localhost:5173/?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy&proof=x",
        pathname: "/",
        search:
          "?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy&proof=x",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
    });

    startAgentTestingOverlay();
    stopAgentTestingOverlay();
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isAgentTestingOverlaySettling()).toBe(true);
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toBe(
      "/?project=boots-pharmacy&screen=book-step-1"
    );
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          state: {
            projectId: "boots-pharmacy",
            screenId: "book-step-1",
          },
        },
      })
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

  it("re-arm during reload sitrep does not schedule that reload", () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    vi.stubGlobal("window", {
      setTimeout: (fn: TimerHandler, ms?: number) =>
        globalThis.setTimeout(fn as () => void, ms),
      clearTimeout: (id: ReturnType<typeof setTimeout>) =>
        globalThis.clearTimeout(id),
      setInterval: (fn: TimerHandler, ms?: number) =>
        globalThis.setInterval(fn as () => void, ms),
      clearInterval: (id: ReturnType<typeof setInterval>) =>
        globalThis.clearInterval(id),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: vi.fn(),
      location: {
        reload,
        href: "http://localhost:5173/?project=boots-pharmacy&screen=plp",
        pathname: "/",
        search: "?project=boots-pharmacy&screen=plp",
        hash: "",
      },
      history: { state: null, replaceState: vi.fn(), pushState: vi.fn() },
    });

    startAgentTestingOverlay("first");
    stopAgentTestingOverlay({ reload: true });
    expect(isAgentTestingOverlaySettling()).toBe(true);

    // New probe mid-sitrep must abandon settle without firing the pending reload.
    startAgentTestingOverlay("AGENT TESTING — plp probe");
    expect(isAgentTestingOverlayActive()).toBe(true);
    expect(isAgentTestingOverlaySettling()).toBe(false);

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS + 500);
    expect(reload).not.toHaveBeenCalled();
  });

  it("pauseForAgentLeave pauses capture and clears presence", () => {
    vi.stubGlobal("window", {
      __studioAgentTestingTakeover: null as unknown,
      setTimeout: (fn: TimerHandler, ms?: number) =>
        globalThis.setTimeout(fn as () => void, ms),
      clearTimeout: (id: ReturnType<typeof setTimeout>) =>
        globalThis.clearTimeout(id),
      setInterval: (fn: TimerHandler, ms?: number) =>
        globalThis.setInterval(fn as () => void, ms),
      clearInterval: (id: ReturnType<typeof setInterval>) =>
        globalThis.clearInterval(id),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
      location: {
        href: "http://localhost:5173/",
        pathname: "/",
        search: "",
        hash: "",
      },
      history: { state: null, replaceState: vi.fn(), pushState: vi.fn() },
    });
    installAgentTestingOverlayApi();
    startAgentTestingOverlay("leave-return");
    const api = window.__studioAgentTestingOverlay!;
    expect(api.isCapturePaused()).toBe(false);

    const left = api.pauseForAgentLeave();
    expect(left.ok).toBe(true);
    expect(left.capturePaused).toBe(true);
    expect(left.presenceOnline).toBe(false);
    expect(api.isCapturePaused()).toBe(true);
    expect(peekPoSignal()).toBeNull(); // leave does not latch QA_PAUSE_HALT

    const back = api.resumeForAgentReturn();
    expect(back.ok).toBe(true);
    expect(back.presenceOnline).toBe(true);
    expect(back.messagePendingWork).toBe(false);
    expect(back.captureResumed).toBe(true);
    expect(api.isCapturePaused()).toBe(false);
    stopAgentTestingOverlay({ force: true });
  });

  it("resumeForAgentReturn consumes Message and keeps pause", () => {
    vi.stubGlobal("window", {
      __studioAgentTestingTakeover: null as unknown,
      setTimeout: (fn: TimerHandler, ms?: number) =>
        globalThis.setTimeout(fn as () => void, ms),
      clearTimeout: (id: ReturnType<typeof setTimeout>) =>
        globalThis.clearTimeout(id),
      setInterval: (fn: TimerHandler, ms?: number) =>
        globalThis.setInterval(fn as () => void, ms),
      clearInterval: (id: ReturnType<typeof setInterval>) =>
        globalThis.clearInterval(id),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
      location: {
        href: "http://localhost:5173/",
        pathname: "/",
        search: "",
        hash: "",
      },
      history: { state: null, replaceState: vi.fn(), pushState: vi.fn() },
    });
    if (typeof globalThis.CustomEvent === "undefined") {
      vi.stubGlobal(
        "CustomEvent",
        class CustomEvent extends Event {
          detail: unknown;
          constructor(type: string, init?: CustomEventInit) {
            super(type, init);
            this.detail = init?.detail;
          }
        }
      );
    }
    installAgentTestingOverlayApi();
    startAgentTestingOverlay("message-on-return");
    const api = window.__studioAgentTestingOverlay!;
    api.pauseForAgentLeave();
    // PO Message while agent gone
    appendAgentTestingUserMessage("fix the composer type-in");
    expect(peekPoSignal()?.code).toBe("USER_MESSAGE_RECEIVED");

    const back = api.resumeForAgentReturn();
    expect(back.messagePendingWork).toBe(true);
    expect(back.captureResumed).toBe(false);
    expect(back.consumedSignal?.note).toContain("composer type-in");
    expect(api.isCapturePaused()).toBe(true);
    expect(peekPoSignal()).toBeNull();
    stopAgentTestingOverlay({ force: true });
  });

  it("stale presence auto-pauses capture without QA_PAUSE_HALT", () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", {
      __studioAgentTestingTakeover: null as unknown,
      setTimeout: (fn: TimerHandler, ms?: number) =>
        globalThis.setTimeout(fn as () => void, ms),
      clearTimeout: (id: ReturnType<typeof setTimeout>) =>
        globalThis.clearTimeout(id),
      setInterval: (fn: TimerHandler, ms?: number) =>
        globalThis.setInterval(fn as () => void, ms),
      clearInterval: (id: ReturnType<typeof setInterval>) =>
        globalThis.clearInterval(id),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
      location: {
        href: "http://localhost:5173/",
        pathname: "/",
        search: "",
        hash: "",
      },
      history: { state: null, replaceState: vi.fn(), pushState: vi.fn() },
      requestAnimationFrame: (cb: FrameRequestCallback) =>
        globalThis.setTimeout(() => cb(Date.now()), 16) as unknown as number,
      cancelAnimationFrame: (id: number) => globalThis.clearTimeout(id),
    });
    installAgentTestingOverlayApi();
    startAgentTestingOverlay("auto-pause");
    const api = window.__studioAgentTestingOverlay!;
    expect(api.isCapturePaused()).toBe(false);

    const mem = (
      window as Window & {
        __studioQaPresenceMemory?: { lastSeenAt: number; online: boolean };
      }
    ).__studioQaPresenceMemory;
    expect(mem).toBeTruthy();
    if (mem) mem.lastSeenAt = Date.now() - 12_000;

    vi.advanceTimersByTime(2_500);
    expect(api.isCapturePaused()).toBe(true);
    expect(peekPoSignal()).toBeNull();
    expect(peekQaAgentPresence().online).toBe(false);
    expect(peekQaAgentPresence().label).toMatch(/^Last seen/);

    const back = api.resumeForAgentReturn();
    expect(back.ok).toBe(true);
    expect(back.presenceOnline).toBe(true);
    expect(back.captureResumed).toBe(true);
    expect(api.isCapturePaused()).toBe(false);
    stopAgentTestingOverlay({ force: true });
    vi.useRealTimers();
  });
});
