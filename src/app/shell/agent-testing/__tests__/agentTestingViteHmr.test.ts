/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  installViteHmrListen,
  pauseCaptureAndHalt,
  resetViteHmrListenForTests,
  type QaListenDeps,
} from "@/app/shell/agent-testing/agentTestingQaListenBridge";

vi.mock("@/app/shell/agent-testing/agentTestingPlaybackHalt", () => ({
  haltPlaybackForPoSignal: vi.fn(),
}));

function makeDeps(overrides: Partial<QaListenDeps> = {}): QaListenDeps {
  let paused = false;
  const pushLogEntry = vi.fn();
  return {
    rootId: "test",
    isActive: () => true,
    isSettling: () => false,
    getCapturePaused: () => paused,
    setCapturePaused: (v) => {
      paused = v;
    },
    setSessionHadProgress: vi.fn(),
    getDiagnosticBlocking: () => false,
    setDiagnosticBlocking: vi.fn(),
    getLastSitrepLine: () => "",
    getTimelineKeys: () => [],
    pushLogEntry,
    pauseElapsedClock: vi.fn(),
    armElapsedTimer: vi.fn(),
    setActivityPhase: vi.fn(),
    syncCaptureWatch: vi.fn(),
    syncSessionChrome: vi.fn(),
    getLastUserTypingLogAt: () => 0,
    setLastUserTypingLogAt: vi.fn(),
    getLastBlockedPlayLogAt: () => 0,
    setLastBlockedPlayLogAt: vi.fn(),
    ...overrides,
  };
}

describe("installViteHmrListen", () => {
  afterEach(() => {
    resetViteHmrListenForTests();
    vi.restoreAllMocks();
  });

  it("binds vite:beforeUpdate only once across re-installs", () => {
    const handlers: Array<() => void> = [];
    const hot = {
      on: vi.fn((_event: string, cb: () => void) => {
        handlers.push(cb);
      }),
      dispose: vi.fn(),
    };

    const a = makeDeps();
    const b = makeDeps();
    installViteHmrListen(a, hot);
    installViteHmrListen(b, hot);
    expect(hot.on).toHaveBeenCalledTimes(1);
    expect(handlers).toHaveLength(1);

    handlers[0]!();
    expect(b.pushLogEntry).toHaveBeenCalled();
    expect(a.pushLogEntry).not.toHaveBeenCalled();
  });
});

describe("pauseCaptureAndHalt hmr", () => {
  it("still logs when already paused so coalesce can ×N", () => {
    const deps = makeDeps({
      getCapturePaused: () => true,
    });
    pauseCaptureAndHalt(
      deps,
      "vite-hmr",
      "vite-hmr · capture/play paused (hot invalidate)"
    );
    expect(deps.pushLogEntry).toHaveBeenCalledTimes(1);
    expect(deps.syncCaptureWatch).not.toHaveBeenCalled();
  });
});
