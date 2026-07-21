/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", () => ({
  removeDemoCursor: vi.fn(),
  cancelDemoCursorTravel: vi.fn(),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  cancelPlaybackScroll: vi.fn(),
}));

vi.mock("@/app/shell/playJourneySmoke", () => ({
  runPlayJourneyToStartSmoke: vi.fn(),
}));

import { runPlayJourneyToStartSmoke } from "@/app/shell/playJourneySmoke";
import {
  AGENTIC_FULL_PLAY_EXPECTED_PEAK,
  AGENTIC_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS,
  FULL_PLAY_PROVE_PRESETS,
  TRADITIONAL_FULL_PLAY_EXPECTED_PEAK,
  runAgenticFullPlayProve,
  runFullPlayProve,
  runTraditionalFullPlayProve,
} from "@/app/shell/fullPlayProve";
import {
  forceClearAgentTestingOverlay,
  installAgentTestingOverlayApi,
  isAgentTestingOverlayActive,
  isAgentTestingOverlayDomPresent,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";

describe("runFullPlayProve (universal)", () => {
  beforeEach(() => {
    installAgentTestingOverlayApi();
    window.history.replaceState(
      null,
      "",
      "/?project=boots-pharmacy&screen=site-pilot&cjm=on&experience=agentic"
    );
    (window as Window & { __protoEnsureCleanStudio?: () => void }).__protoEnsureCleanStudio =
      vi.fn();
    (window as Window & { __protoSetOrchestraMode?: (m: string) => void }).__protoSetOrchestraMode =
      vi.fn();
    (window as Window & { __protoSetJourneyMode?: (on: boolean) => boolean }).__protoSetJourneyMode =
      () => true;
    (window as Window & { __protoTriggerTransport?: (a: string) => boolean }).__protoTriggerTransport =
      () => true;
    (window as Window & { __protoStudioState?: () => unknown }).__protoStudioState = () => ({
      beatId: "agentic-home",
      counter: "1 / 21",
      isPlaying: false,
      isOnAir: false,
    });
  });

  afterEach(() => {
    forceClearAgentTestingOverlay();
    uninstallAgentTestingOverlayApi();
    vi.mocked(runPlayJourneyToStartSmoke).mockReset();
  });

  it("PASS agentic preset via universal API; keeps overlay", async () => {
    vi.mocked(runPlayJourneyToStartSmoke).mockResolvedValue({
      pass: true,
      peakVisible: 22,
      peakCounter: "STEPS: 22 / 22",
      assert: {
        pass: true,
        beatId: "agentic-home",
        screenId: "site-pilot",
      },
    });

    const result = await runFullPlayProve({
      experience: "agentic",
      delay: async () => undefined,
      timeoutMs: 1_000,
      preArmMs: 0,
    });

    expect(result.pass).toBe(true);
    expect(result.experience).toBe("agentic");
    expect(result.journeyId).toBe("agentic-cjm");
    expect(result.peak).toMatchObject({ visible: 22, total: 22 });
    expect(result.leave?.ok).toBe(true);
    expect(isAgentTestingOverlayActive()).toBe(true);
    expect(isAgentTestingOverlayDomPresent()).toBe(true);
    expect(vi.mocked(runPlayJourneyToStartSmoke).mock.calls[0]?.[0]).toMatchObject({
      orchestraMode: "agentic-cjm",
      startBeatId: "agentic-home",
    });
  });

  it("PASS traditional preset via journeyId; login-skip peak ok", async () => {
    vi.mocked(runPlayJourneyToStartSmoke).mockResolvedValue({
      pass: true,
      peakVisible: 12,
      peakCounter: "STEPS: 12 / 12",
      assert: {
        pass: true,
        beatId: "traditional-plp",
        screenId: "plp",
      },
    });

    const result = await runFullPlayProve({
      journeyId: "traditional-cjm",
      delay: async () => undefined,
      preArmMs: 0,
    });

    expect(result.pass).toBe(true);
    expect(result.experience).toBe("traditional");
    expect(result.peak.visible).toBe(12);
    expect(vi.mocked(runPlayJourneyToStartSmoke).mock.calls[0]?.[0]).toMatchObject({
      orchestraMode: "traditional-cjm",
      startScreenId: "plp",
    });
  });

  it("rec-* asserts that journey playlist — not built-in traditional 13", async () => {
    (
      window as Window & {
        __studioListJourneys?: () => Array<{
          id: string;
          beatCount: number;
          beatIds: string[];
        }>;
      }
    ).__studioListJourneys = () => [
      {
        id: "rec-trad-mrtzf6sz-xcs5",
        beatCount: 4,
        beatIds: ["plp", "scroll-stop-camera", "plp-book-now", "pdp"],
      },
    ];

    vi.mocked(runPlayJourneyToStartSmoke).mockResolvedValue({
      pass: true,
      peakVisible: 4,
      peakCounter: "STEPS: 4 / 4",
      assert: {
        pass: true,
        beatId: "plp",
        screenId: "plp",
      },
    });

    const result = await runFullPlayProve({
      journeyId: "rec-trad-mrtzf6sz-xcs5",
      delay: async () => undefined,
      preArmMs: 0,
    });

    expect(result.pass).toBe(true);
    expect(result.journeyId).toBe("rec-trad-mrtzf6sz-xcs5");
    expect(result.experience).toBe("traditional");
    expect(vi.mocked(runPlayJourneyToStartSmoke).mock.calls[0]?.[0]).toMatchObject({
      orchestraMode: "rec-trad-mrtzf6sz-xcs5",
      startBeatId: "plp",
      startScreenId: "plp",
    });
    // Must NOT demand traditional-plp / peak 13.
    expect(result.errors.some((e) => e.includes("peak-not-13"))).toBe(false);
    expect(result.peak.total).toBe(4);

    delete (
      window as Window & { __studioListJourneys?: unknown }
    ).__studioListJourneys;
  });

  it("thin aliases share the same core (no duplicated logic)", async () => {
    vi.mocked(runPlayJourneyToStartSmoke).mockResolvedValue({
      pass: true,
      peakVisible: 22,
      peakCounter: "STEPS: 22 / 22",
      assert: { pass: true, beatId: "agentic-home", screenId: "site-pilot" },
    });

    const a = await runAgenticFullPlayProve({
      delay: async () => undefined,
      preArmMs: 0,
    });
    expect(a.pass).toBe(true);
    expect(a.experience).toBe("agentic");

    vi.mocked(runPlayJourneyToStartSmoke).mockResolvedValue({
      pass: true,
      peakVisible: 13,
      peakCounter: "STEPS: 13 / 13",
      assert: { pass: true, beatId: "traditional-plp", screenId: "plp" },
    });
    const t = await runTraditionalFullPlayProve({
      delay: async () => undefined,
      preArmMs: 0,
    });
    expect(t.pass).toBe(true);
    expect(t.experience).toBe("traditional");

    expect(AGENTIC_FULL_PLAY_EXPECTED_PEAK).toBe(
      FULL_PLAY_PROVE_PRESETS.agentic.expectedPeak
    );
    expect(AGENTIC_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS).toBe(300_000);
    expect(TRADITIONAL_FULL_PLAY_EXPECTED_PEAK).toBe(13);
  });

  it("FAIL honestly when peak short — no invent green", async () => {
    vi.mocked(runPlayJourneyToStartSmoke).mockResolvedValue({
      pass: true,
      peakVisible: 12,
      peakCounter: "STEPS: 12 / 22",
      assert: {
        pass: true,
        beatId: "agentic-home",
        screenId: "site-pilot",
      },
    });

    const result = await runFullPlayProve({
      experience: "agentic",
      delay: async () => undefined,
      preArmMs: 0,
    });

    expect(result.pass).toBe(false);
    expect(result.errors.some((e) => e.startsWith("peak-not-22/22"))).toBe(
      true
    );
  });
});
