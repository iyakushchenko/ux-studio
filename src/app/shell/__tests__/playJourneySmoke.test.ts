import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/shell/playbackDiag", () => ({
  assertPlaybackPlayEndedAtEnd: vi.fn(() => ({ pass: true })),
  assertPlaybackPlayEndedAtStart: vi.fn(() => ({ pass: true })),
  getPlaybackDiagBundle: vi.fn(() => ({ playEnd: { count: 0 } })),
  playbackDiagClear: vi.fn(),
  playbackDiagLog: vi.fn(),
}));

vi.mock("@/app/shell/smokePoSignalPoll", () => ({
  pollSmokePoSignal: vi.fn(() => ({ hit: false, abort: false, signal: null })),
}));

import { runPlayJourneyToEndSmoke } from "@/app/shell/playJourneySmoke";

describe("runPlayJourneyToEndSmoke arming", () => {
  it("waits for committed journey mode and a populated counter before transport", async () => {
    let reads = 0;
    const triggerTransport = vi.fn(() => false);
    const result = await runPlayJourneyToEndSmoke({
      orchestraMode: "agentic-cjm",
      startBeatId: "agentic-home",
      startScreenId: "site-pilot",
      delay: vi.fn(async () => undefined),
      ensureClean: vi.fn(),
      setOrchestraMode: vi.fn(),
      setJourneyMode: vi.fn(() => true),
      triggerTransport,
      getState: () => {
        reads += 1;
        return reads < 3
          ? { journeyMode: false, counter: "0 / 0" }
          : { journeyMode: true, orchestraMode: "agentic-cjm", counter: "0 / 22" };
      },
    });

    expect(triggerTransport).toHaveBeenCalledWith("jump-to-start");
    expect(result.reason).toBe("jump-to-start-unavailable");
  });

  it("refuses transport while the previous CJM is still mounted", async () => {
    let now = 0;
    const nowSpy = vi.spyOn(Date, "now").mockImplementation(() => (now += 1_000));
    const triggerTransport = vi.fn(() => true);
    const result = await runPlayJourneyToEndSmoke({
      orchestraMode: "rec-agentic-target",
      startBeatId: "plp",
      startScreenId: "plp",
      delay: vi.fn(async () => undefined),
      ensureClean: vi.fn(),
      setOrchestraMode: vi.fn(),
      setJourneyMode: vi.fn(() => true),
      triggerTransport,
      getState: () => ({
        journeyMode: true,
        orchestraMode: "agentic-cjm",
        counter: "1 / 22",
        beatId: "book-step2",
        screenId: "book-step-2",
      }),
    });

    nowSpy.mockRestore();
    expect(result.reason).toBe("journey-mode-did-not-arm");
    expect(triggerTransport).not.toHaveBeenCalled();
  });

  it("does not press Play until jump-to-start reaches the declared beat and screen", async () => {
    let now = 0;
    const nowSpy = vi.spyOn(Date, "now").mockImplementation(() => (now += 1_000));
    const triggerTransport = vi.fn(() => true);
    const result = await runPlayJourneyToEndSmoke({
      orchestraMode: "rec-agentic-target",
      startBeatId: "plp",
      startScreenId: "plp",
      delay: vi.fn(async () => undefined),
      ensureClean: vi.fn(),
      setOrchestraMode: vi.fn(),
      setJourneyMode: vi.fn(() => true),
      triggerTransport,
      getState: () => ({
        journeyMode: true,
        orchestraMode: "rec-agentic-target",
        counter: "1 / 26",
        beatId: "plp",
        screenId: "book-step-2",
      }),
    });

    nowSpy.mockRestore();
    expect(result.reason).toBe("journey-start-did-not-settle");
    expect(triggerTransport).toHaveBeenCalledTimes(1);
    expect(triggerTransport).toHaveBeenCalledWith("jump-to-start");
  });

  it("fails fast without touching transport when journey mode never commits", async () => {
    let now = 0;
    const nowSpy = vi.spyOn(Date, "now").mockImplementation(() => (now += 1_000));
    const triggerTransport = vi.fn(() => true);
    const result = await runPlayJourneyToEndSmoke({
      orchestraMode: "agentic-cjm",
      startBeatId: "agentic-home",
      startScreenId: "site-pilot",
      delay: vi.fn(async () => undefined),
      ensureClean: vi.fn(),
      setOrchestraMode: vi.fn(),
      setJourneyMode: vi.fn(() => true),
      triggerTransport,
      getState: () => ({ journeyMode: false, counter: "0 / 0" }),
    });

    nowSpy.mockRestore();
    expect(result.reason).toBe("journey-mode-did-not-arm");
    expect(triggerTransport).not.toHaveBeenCalled();
  });
});
