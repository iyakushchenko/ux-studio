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
  runPlayJourneyToEndSmoke: vi.fn(),
  runPlayJourneyToStartSmoke: vi.fn(),
}));

import { runPlayJourneyToEndSmoke } from "@/app/shell/playJourneySmoke";
import {
  AGENTIC_FULL_PLAY_EXPECTED_PEAK,
  AGENTIC_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS,
  runAgenticFullPlayProve,
} from "@/app/shell/agenticFullPlayProve";
import {
  forceClearAgentTestingOverlay,
  installAgentTestingOverlayApi,
  isAgentTestingOverlayActive,
  isAgentTestingOverlayDomPresent,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";

describe("runAgenticFullPlayProve", () => {
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
    vi.mocked(runPlayJourneyToEndSmoke).mockReset();
  });

  it("PASS when smoke peak 22/22 + play-end assert; keeps overlay; pauses leave", async () => {
    vi.mocked(runPlayJourneyToEndSmoke).mockResolvedValue({
      pass: true,
      peakVisible: 22,
      peakCounter: "STEPS: 22 / 22",
      assert: {
        pass: true,
        beatId: "appointment-details",
        screenId: "appointment-details",
      },
    });

    const result = await runAgenticFullPlayProve({
      delay: async () => undefined,
      timeoutMs: 1_000,
      preArmMs: 0,
    });

    expect(result.pass).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.peak).toMatchObject({
      visible: 22,
      total: 22,
    });
    expect(result.end?.pass).toBe(true);
    expect(result.leave?.ok).toBe(true);
    expect(result.leave?.capturePaused).toBe(true);
    expect(isAgentTestingOverlayActive()).toBe(true);
    expect(isAgentTestingOverlayDomPresent()).toBe(true);
    expect(AGENTIC_FULL_PLAY_EXPECTED_PEAK).toBe(22);
    expect(AGENTIC_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS).toBe(300_000);
  });

  it("passes default timeoutMs 300_000 into play smoke when omitted", async () => {
    vi.mocked(runPlayJourneyToEndSmoke).mockResolvedValue({
      pass: true,
      peakVisible: 22,
      peakCounter: "STEPS: 22 / 22",
      assert: {
        pass: true,
        beatId: "appointment-details",
        screenId: "appointment-details",
      },
    });

    await runAgenticFullPlayProve({
      delay: async () => undefined,
      preArmMs: 0,
    });

    expect(vi.mocked(runPlayJourneyToEndSmoke).mock.calls[0]?.[0]).toMatchObject({
      timeoutMs: 300_000,
    });
  });

  it("FAIL honestly when peak short of 22/22 — no invent green", async () => {
    vi.mocked(runPlayJourneyToEndSmoke).mockResolvedValue({
      pass: true,
      peakVisible: 12,
      peakCounter: "STEPS: 12 / 22",
      assert: {
        pass: true,
        beatId: "appointment-details",
        screenId: "appointment-details",
      },
    });

    const result = await runAgenticFullPlayProve({
      delay: async () => undefined,
      preArmMs: 0,
    });

    expect(result.pass).toBe(false);
    expect(result.errors.some((e) => e.startsWith("peak-not-22/22"))).toBe(
      true
    );
    expect(isAgentTestingOverlayActive()).toBe(true);
  });

  it("FAIL when smoke fails — surfaces reason in errors", async () => {
    vi.mocked(runPlayJourneyToEndSmoke).mockResolvedValue({
      pass: false,
      reason: "playback-diagnostic",
      peakVisible: 8,
      peakCounter: "STEPS: 8 / 22",
      assert: { pass: false, reason: "not-at-end" },
    });

    const result = await runAgenticFullPlayProve({
      delay: async () => undefined,
      preArmMs: 0,
    });

    expect(result.pass).toBe(false);
    expect(result.errors).toContain("playback-diagnostic");
    expect(result.errors.some((e) => e.includes("not-at-end") || e.includes("play-end"))).toBe(
      true
    );
  });
});
