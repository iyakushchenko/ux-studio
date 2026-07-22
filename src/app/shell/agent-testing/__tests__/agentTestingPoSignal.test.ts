import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/shell/playbackDiag", () => ({
  getPlaybackDiagBundle: () => ({
    events: [
      { kind: "beat", detail: "enter agentic-chat", beatId: "agentic-chat" },
      { kind: "click", detail: "cta", clickOk: true },
    ],
    typeIn: {
      starts: 1,
      ends: 1,
      skips: 0,
      lastStart: undefined,
      lastEnd: undefined,
      progressSamples: [1, 2, 3],
    },
    step: { forwards: 1, backs: 0, retreatSyncs: 0 },
    cursor: { events: 2, parks: 0, hidden: 0, lastParkReason: null },
    scroll: { events: 0, retreatIntoView: 0 },
    click: { ok: 1, fail: 0 },
    skip: { count: 0, reasons: [] },
    playEnd: { count: 0 },
    journeyReset: { count: 0 },
    typeInActive: null,
    chatBubbleMotion: {
      samples: [],
      count: 0,
      jumps: 0,
      chops: 0,
      maxAbsDeltaY: 0,
      maxAbsDeltaTransformY: 0,
      skippedPhaseNotes: [],
      ids: [],
    },
  }),
}));

vi.mock("@/app/shell/agent-testing/agentTestingSitrep", () => ({
  readAgentTestingSitrep: () => ({
    mode: "agentic-cjm",
    screenId: "chat",
    beat: "agentic-chat",
    counter: "2/13",
    touchpointKey: "beat:agentic-chat:frame:2",
    line: "mode agentic-cjm · screen chat · beat 2/13 · agentic-chat",
  }),
}));

import {
  clearPoSignal,
  consumePoSignal,
  installPoSignalWindowApis,
  latchPoSignal,
  peekPoSignal,
  uninstallPoSignalWindowApis,
} from "@/app/shell/agent-testing/agentTestingPoSignal";

function stubWindow(): void {
  const listeners = new Map<string, Set<EventListener>>();
  vi.stubGlobal("window", {
    __studioAgentTestingTakeover: null,
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
  });
  // CustomEvent for Node vitest
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
}

describe("agentTestingPoSignal", () => {
  afterEach(() => {
    uninstallPoSignalWindowApis();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("latches alarm signal and clears on consume", () => {
    stubWindow();
    installPoSignalWindowApis();
    expect(peekPoSignal()).toBeNull();
    expect(window.__studioAgentTestingTakeover).toBeNull();

    const signal = latchPoSignal({
      type: "alarm",
      code: "ALARM_SEQUENCE_MISMATCH",
      note: "bubbles stuck",
    });
    expect(signal.code).toBe("ALARM_SEQUENCE_MISMATCH");
    expect(signal.type).toBe("alarm");
    expect(signal.beat).toBe("agentic-chat");
    expect(signal.screen).toBe("chat");
    expect(signal.diagSnapshot?.typeIn?.samples).toBe(3);
    expect(peekPoSignal()?.code).toBe("ALARM_SEQUENCE_MISMATCH");
    expect(window.__studioAgentTestingTakeover?.code).toBe(
      "ALARM_SEQUENCE_MISMATCH"
    );
    expect(window.__studioPeekPoSignal?.()?.code).toBe(
      "ALARM_SEQUENCE_MISMATCH"
    );

    const consumed = window.__studioConsumePoSignal?.();
    expect(consumed?.code).toBe("ALARM_SEQUENCE_MISMATCH");
    expect(peekPoSignal()).toBeNull();
    expect(window.__studioAgentTestingTakeover).toBeNull();
    expect(consumePoSignal()).toBeNull();
  });

  it("dispatches studio-agent-testing-po-signal on latch", () => {
    stubWindow();
    installPoSignalWindowApis();
    const handler = vi.fn();
    window.addEventListener("studio-agent-testing-po-signal", handler);
    latchPoSignal({ type: "cursor", code: "CURSOR_WEIRD_FLAG" });
    expect(handler).toHaveBeenCalledTimes(1);
    const detail = (handler.mock.calls[0]?.[0] as CustomEvent)?.detail;
    expect(detail?.code).toBe("CURSOR_WEIRD_FLAG");
    window.removeEventListener("studio-agent-testing-po-signal", handler);
    clearPoSignal();
  });
});
