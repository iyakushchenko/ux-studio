/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QA_SUITE_COLLECTION, installAutonomousQaSuiteApi, validateAllJourneys } from "@/app/shell/qaAutonomousSuite";

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

describe("autonomous QA suite", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.__studioAgentTestingOverlay = {
      touch: vi.fn(), logStep: vi.fn(), ringAlarm: vi.fn(), appendFinale: vi.fn(),
      ackDiagnostic: vi.fn(), consumePoSignal: vi.fn(),
    } as unknown as typeof window.__studioAgentTestingOverlay;
    window.__studioConsumePoSignal = vi.fn(() => {
      window.__studioAgentTestingTakeover = null;
      return null;
    });
    installAutonomousQaSuiteApi();
    expect(window.__studioRunQaSuiteById).toBeTypeOf("function");
    expect(window.__studioRunGlobalCompatibilityTests).toBeTypeOf("function");
  });

  it("runs a declarative queue without agent polling", async () => {
    window.__studioRunMcpSanityCheck = vi.fn(async () => ({ pass: true }));
    window.__studioRunQaSelfTestSmoke = vi.fn(async () => ({ ok: true }));
    window.__studioStartQaSuite?.(["mcp-sanity", "qa-self-test"], { suiteId: "lean" });
    await settle();
    expect(window.__studioGetQaSuiteStatus?.()).toMatchObject({ phase: "passed", index: 2, total: 2 });
  });

  it("stops on failure and proceed reruns the failed test", async () => {
    let pass = false;
    window.__studioRunMcpSanityCheck = vi.fn(async () => ({ pass }));
    window.__studioStartQaSuite?.(["mcp-sanity"]);
    await settle();
    expect(window.__studioGetQaSuiteStatus?.().phase).toBe("paused-failure");
    pass = true;
    window.__studioProceedQaSuite?.();
    await settle();
    expect(window.__studioGetQaSuiteStatus?.().phase).toBe("passed");
    expect(window.__studioRunMcpSanityCheck).toHaveBeenCalledTimes(2);
  });

  it("promotes a nested playback alarm to terminal suite failure", async () => {
    window.__protoListJourneys = () => [
      { id: "alarm-journey", label: "Alarm", beatCount: 1, beatIds: ["one"] },
    ];
    let resolveRunner!: (value: { pass: false }) => void;
    window.__studioRunFullPlayProve = vi.fn(() => new Promise((resolve) => {
      resolveRunner = resolve;
    }));
    window.__protoAbortAll = vi.fn(() => resolveRunner({ pass: false }));
    window.__studioStartQaSuite?.(["play-all-cjms"]);
    setTimeout(() => {
      window.__studioAgentTestingTakeover = {
        type: "alarm",
        code: "ALARM_SEQUENCE_MISMATCH",
        note: "sequence mismatch",
      };
    }, 10);
    await new Promise((resolve) => setTimeout(resolve, 130));
    expect(window.__studioGetQaSuiteStatus?.()).toMatchObject({
      phase: "paused-failure",
      current: "play-all-cjms",
    });
    window.__studioAgentTestingTakeover = null;
  });

  it("keeps the visible collection project-agnostic", () => {
    expect(QA_SUITE_COLLECTION.map((suite) => suite.label)).toEqual([
      "QA tool health",
      "Test current page",
      "Map current page interactions",
      "Map all project interactions",
      "Fast test current CJM",
      "Fast test all CJMs",
      "Test current CJM",
      "Test all CJMs",
      "Current project core",
    ]);
  });

  it("enumerates all current-project CJMs and stops on the first failure", async () => {
    window.__protoListJourneys = () => [
      { id: "one", label: "One", beatCount: 1, beatIds: ["one"] },
      { id: "two", label: "Two", beatCount: 1, beatIds: ["two"] },
      { id: "three", label: "Three", beatCount: 1, beatIds: ["three"] },
    ];
    window.__studioRunFullPlayProve = vi.fn(async ({ journeyId }) => ({ pass: journeyId !== "two" }));
    window.__studioStartQaSuite?.(["play-all-cjms"]);
    await settle();
    expect(window.__studioGetQaSuiteStatus?.().phase).toBe("paused-failure");
    expect(window.__studioRunFullPlayProve).toHaveBeenCalledTimes(2);
  });

  it("retains every all-CJM result and reports the real journey count", async () => {
    window.__protoListJourneys = () => Array.from({ length: 13 }, (_, index) => ({
      id: `journey-${index + 1}`,
      label: `Journey ${index + 1}`,
      beatCount: 1,
      beatIds: [`beat-${index + 1}`],
    }));
    window.__studioRunFullPlayProve = vi.fn(async () => ({ pass: true }));
    window.__studioStartQaSuite?.(["play-all-cjms"]);
    await settle();
    const suiteStatus = window.__studioGetQaSuiteStatus?.();
    expect(suiteStatus?.phase).toBe("passed");
    expect(
      (suiteStatus?.completed[0]?.result as { results?: unknown[] }).results
    ).toHaveLength(13);
    expect(window.__studioAgentTestingOverlay?.appendFinale).toHaveBeenLastCalledWith(
      "pass",
      "13/13 CJMs passed"
    );
    expect(suiteStatus?.playbackProfile).toBe("normal");
    expect(suiteStatus?.completed[0]).toMatchObject({
      startedAtIso: expect.any(String),
      finishedAtIso: expect.any(String),
      elapsedMs: expect.any(Number),
    });
  });

  it("records fast proof profile and a current-CJM identity", async () => {
    window.__protoStudioState = () => ({ orchestraMode: "agentic-cjm" });
    window.__studioRunFullPlayProve = vi.fn(async ({ journeyId }) => ({
      pass: true,
      journeyId,
      experience: "agentic",
    }));
    window.__studioStartQaSuite?.([
      { id: "play-current-cjm", options: { playbackSpeed: "fast" } },
    ], { suiteId: "current-cjm-fast" });
    await settle();
    expect(window.__studioGetQaSuiteStatus?.()).toMatchObject({
      phase: "passed",
      playbackProfile: "fast",
      completed: [{ result: { journeyId: "agentic-cjm", playbackSpeed: "fast" } }],
    });
    expect(window.__studioAgentTestingOverlay?.appendFinale).toHaveBeenLastCalledWith(
      "pass",
      "CJM agentic-cjm passed"
    );
  });

  it("validates every CJM structurally without playing animations", () => {
    window.__protoListJourneys = () => [
      { id: "valid", label: "Valid", beatCount: 2, beatIds: ["one", "two"] },
      { id: "broken", label: "Broken", beatCount: 2, beatIds: ["same", "same"] },
    ];
    expect(validateAllJourneys()).toEqual({
      pass: false,
      results: [
        { journeyId: "valid", pass: true, issues: [] },
        { journeyId: "broken", pass: false, issues: ["duplicate-beat-id"] },
      ],
    });
  });

  it("keeps Current project core fast and reserves playback for Test all CJMs", () => {
    expect(QA_SUITE_COLLECTION.find((suite) => suite.id === "project-core")?.tests)
      .toContainEqual({ id: "validate-all-cjms" });
    expect(QA_SUITE_COLLECTION.find((suite) => suite.id === "project-core")?.tests)
      .not.toContainEqual({ id: "play-all-cjms" });
  });
});
