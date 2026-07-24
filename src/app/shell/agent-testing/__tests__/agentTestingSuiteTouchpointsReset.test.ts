/**
 * @vitest-environment happy-dom
 *
 * Bug: after Reset, or after switching the mode dropdown back to Free Mode
 * (no suite selected), the Touchpoints bar
 * (`.studio-agent-testing-overlay__timeline-wrap`) kept showing a stale
 * "CHECKS 1/1" pill with the last completed suite's chip (e.g.
 * "QA tool health"). Reset / Free Mode must show no leftover
 * touchpoint/checks state from a previous suite run.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", () => ({
  removeDemoCursor: vi.fn(),
  cancelDemoCursorTravel: vi.fn(),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  cancelPlaybackScroll: vi.fn(),
}));

import {
  forceClearAgentTestingOverlay,
  installAgentTestingOverlayApi,
  openAgentTestingLogger,
  touchAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";
import { resetQaSessionForTests } from "@/app/shell/agent-testing/agentTestingSession";
import {
  getAutonomousQaSuiteStatus,
  resetAutonomousQaSuiteStatus,
  startAutonomousQaSuite,
} from "@/app/shell/qaAutonomousSuite";

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

function timelineWrap(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__timeline-wrap"
  );
}

function suiteSelect(): HTMLSelectElement | null {
  return document.querySelector<HTMLSelectElement>(
    ".studio-agent-testing-overlay__suite-select"
  );
}

function fireSuiteSelection(value: string): void {
  const select = suiteSelect();
  if (!select) throw new Error("suite select not found in overlay DOM");
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("QA Touchpoints bar — no stale suite chip after Reset / Free Mode", () => {
  beforeEach(() => {
    resetQaSessionForTests();
    resetAutonomousQaSuiteStatus();
    installAgentTestingOverlayApi();
    window.__studioRunMcpSanityCheck = vi.fn(async () => ({ pass: true }));
  });

  afterEach(() => {
    forceClearAgentTestingOverlay();
    uninstallAgentTestingOverlayApi();
    resetQaSessionForTests();
    resetAutonomousQaSuiteStatus();
    delete (window as Window & { __studioRunMcpSanityCheck?: unknown })
      .__studioRunMcpSanityCheck;
  });

  it("switching back to Free Mode hides a completed suite's stale chip", async () => {
    openAgentTestingLogger({ kind: "manual" });
    fireSuiteSelection("tool-health");

    startAutonomousQaSuite([{ id: "mcp-sanity" }], { suiteId: "tool-health" });
    await settle();
    touchAgentTestingOverlay();

    // Baseline: a genuinely selected + completed suite still renders correctly.
    const wrap = timelineWrap();
    expect(wrap?.hidden).toBe(false);
    expect(wrap?.textContent).toContain("QA tool health");

    fireSuiteSelection("");

    const wrapAfter = timelineWrap();
    expect(wrapAfter?.hidden).toBe(true);
    expect(wrapAfter?.textContent ?? "").not.toContain("QA tool health");
  });

  it("Reset wipes the completed suite status so it cannot resurrect the bar", async () => {
    openAgentTestingLogger({ kind: "manual" });
    fireSuiteSelection("tool-health");

    startAutonomousQaSuite([{ id: "mcp-sanity" }], { suiteId: "tool-health" });
    await settle();
    touchAgentTestingOverlay();
    expect(timelineWrap()?.textContent).toContain("QA tool health");
    expect(getAutonomousQaSuiteStatus().phase).toBe("passed");

    // Dropdown selection is deliberately left on "tool-health" — Reset alone
    // (without touching Free Mode) must still kill the stale chip because the
    // suite *status* itself is wiped, not merely re-derived from selection.
    window.__studioAgentTestingOverlay?.logStep({
      kind: "system",
      label: "seed activity so Reset is armed",
      outcome: "ok",
    });
    window.__studioAgentTestingOverlay?.resetSession();

    expect(getAutonomousQaSuiteStatus().phase).toBe("idle");
    expect(getAutonomousQaSuiteStatus().suiteId).toBe("");
    const wrapAfterReset = timelineWrap();
    expect(wrapAfterReset?.hidden).toBe(true);
    expect(wrapAfterReset?.textContent ?? "").not.toContain("QA tool health");
  });

  it("agent-driven suite runs still show which suite is running in the dropdown, disabled not blank (PO, 2026-07-24)", async () => {
    openAgentTestingLogger({ kind: "agent" });
    startAutonomousQaSuite([{ id: "mcp-sanity" }], { suiteId: "tool-health" });
    touchAgentTestingOverlay();

    const select = suiteSelect();
    expect(select?.disabled).toBe(true);
    expect(select?.value).toBe("tool-health");

    await settle();
    touchAgentTestingOverlay();
    expect(suiteSelect()?.value).toBe("tool-health");
  });
});
