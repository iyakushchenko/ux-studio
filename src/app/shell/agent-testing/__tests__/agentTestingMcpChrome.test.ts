/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import {
  deriveLiveMcpStatus,
  isMcpChromeLive,
  paintMcpChromeDom,
  clearNavMcpHintDom,
} from "@/app/shell/agent-testing/agentTestingMcpChrome";
import { resetMcpStatusForTests } from "@/app/shell/agent-testing/agentTestingMcpStatus";
import { resetQaSessionForTests } from "@/app/shell/agent-testing/agentTestingSession";

describe("agentTestingMcpChrome — no ghost OBS", () => {
  it("isMcpChromeLive requires active + gate + visible", () => {
    expect(
      isMcpChromeLive({
        active: true,
        settling: false,
        gateOpen: true,
        overlayDomVisible: true,
      })
    ).toBe(true);
    expect(
      isMcpChromeLive({
        active: false,
        settling: false,
        gateOpen: true,
        overlayDomVisible: true,
      })
    ).toBe(false);
    expect(
      isMcpChromeLive({
        active: true,
        settling: false,
        gateOpen: false,
        overlayDomVisible: true,
      })
    ).toBe(false);
    expect(
      isMcpChromeLive({
        active: true,
        settling: false,
        gateOpen: true,
        overlayDomVisible: false,
      })
    ).toBe(false);
  });

  it("closed overlay → idle status even if sessionKind was observe", () => {
    resetMcpStatusForTests();
    resetQaSessionForTests();
    const status = deriveLiveMcpStatus({
      active: false,
      settling: false,
      sessionKind: "observe",
      awaitingReply: false,
      gateOpen: false,
      overlayDomVisible: false,
      rootId: "agent-testing-overlay",
    });
    expect(status.phase).toBe("idle");
    expect(status.label).toBe("");
  });

  it("paint clears nav OBS when not live", () => {
    document.body.innerHTML =
      '<span class="studio-nav-version__mcp" data-phase="observe">OBS</span>' +
      '<div id="agent-testing-overlay"><div class="studio-agent-testing-overlay__mcp-status">' +
      '<span class="studio-agent-testing-overlay__mcp-diode" data-phase="observe"></span>' +
      '<span class="studio-agent-testing-overlay__mcp" data-phase="observe">MCP — OBSERVE</span>' +
      "</div></div>";
    document.documentElement.dataset.studioMcpStatus = "observe";
    const input = {
      active: false,
      settling: false,
      sessionKind: "observe" as const,
      awaitingReply: false,
      gateOpen: false,
      overlayDomVisible: false,
      rootId: "agent-testing-overlay",
    };
    paintMcpChromeDom(input, deriveLiveMcpStatus(input));
    const hint = document.querySelector<HTMLElement>(".studio-nav-version__mcp");
    expect(hint?.hidden).toBe(true);
    expect(hint?.textContent || "").toBe("");
    expect(document.documentElement.dataset.studioMcpStatus).toBeUndefined();
    clearNavMcpHintDom();
  });
});
