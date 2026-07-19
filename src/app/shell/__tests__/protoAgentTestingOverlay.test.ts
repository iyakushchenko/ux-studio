import { afterEach, describe, expect, it } from "vitest";
import {
  isAgentTestingOverlayActive,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/protoAgentTestingOverlay";

describe("protoAgentTestingOverlay", () => {
  afterEach(() => {
    uninstallAgentTestingOverlayApi();
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

    startAgentTestingOverlay();
    startAgentTestingOverlay();
    stopAgentTestingOverlay({ force: true });
    expect(isAgentTestingOverlayActive()).toBe(false);
  });
});
