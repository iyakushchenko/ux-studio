/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", () => ({
  removeDemoCursor: vi.fn(),
  cancelDemoCursorTravel: vi.fn(),
  parkDemoCursorForTypeIn: vi.fn(),
  readDemoCursorDomState: () => ({
    visible: true,
    missing: false,
    parked: true,
    opacity: "1",
    display: "block",
  }),
  clearDemoCursorCarriageLatches: vi.fn(),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  cancelPlaybackScroll: vi.fn(),
}));

vi.mock("@/app/shell/studioUrl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/shell/studioUrl")>();
  return {
    ...actual,
    resetStudioAfterAgentTest: vi.fn(),
  };
});

import {
  forceClearAgentTestingOverlay,
  installAgentTestingOverlayApi,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";
import { isQaProveModeActive } from "@/app/shell/agent-testing/agentTestingPresence";
import { withMcpTestSession } from "@/app/shell/mcpTestSession";

describe("withMcpTestSession prove-mode", () => {
  beforeEach(() => {
    installAgentTestingOverlayApi();
    forceClearAgentTestingOverlay();
    window.history.replaceState(
      null,
      "",
      "/?project=boots-pharmacy&screen=site-pilot&cjm=on&experience=agentic"
    );
  });

  afterEach(() => {
    forceClearAgentTestingOverlay();
    uninstallAgentTestingOverlayApi();
  });

  it("arms prove-mode for the session body and clears it in finally", async () => {
    let sawProveMode = false;
    const out = await withMcpTestSession(
      "agentic-step-forward",
      async () => {
        sawProveMode = isQaProveModeActive();
        return { pass: true };
      },
      { resetToJourneyStart: true, reload: false, preArmMs: 0, settleMs: 0 }
    );
    expect(out).toEqual({ pass: true });
    expect(sawProveMode).toBe(true);
    expect(isQaProveModeActive()).toBe(false);
  });
});
