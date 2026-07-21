/**
 * @vitest-environment happy-dom
 *
 * Wipe hygiene + session handoff via public overlay API (no full DOM chrome soup).
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
  handoffQaSession,
  installAgentTestingOverlayApi,
  isAgentTestingOverlayActive,
  openAgentTestingLogger,
  softCloseAgentTestingLogger,
  startAgentTestingOverlay,
  toggleAgentTestingLogger,
  touchAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";
import {
  getSessionKind,
  isAwaitingUserReply,
  resetQaSessionForTests,
  setAwaitingUserReply,
} from "@/app/shell/agent-testing/agentTestingSession";
import {
  armMcpPendingTimeout,
  deriveMcpConnectionStatus,
  registerMcpPendingTimeoutHandler,
  resetMcpStatusForTests,
} from "@/app/shell/agent-testing/agentTestingMcpStatus";
import {
  appendQaDiagRing,
  getQaDiagRing,
  hydrateQaDiagGate,
  isQaDiagGateOpen,
} from "@/app/shell/qaDiagGate";
import {
  latchPoSignal,
  peekPoSignal,
} from "@/app/shell/agent-testing/agentTestingPoSignal";
import { requireFreshQaSession } from "@/app/shell/requireFreshQaSession";
import { acknowledgePlaybackDiagnosticStop } from "@/app/shell/agent-testing/agentTestingPlaybackHalt";

describe("agentTesting wipe hygiene (forceClear / softClose)", () => {
  beforeEach(() => {
    resetQaSessionForTests();
    resetMcpStatusForTests();
    installAgentTestingOverlayApi();
    try {
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });

  afterEach(() => {
    forceClearAgentTestingOverlay();
    uninstallAgentTestingOverlayApi();
    resetQaSessionForTests();
    resetMcpStatusForTests();
    vi.useRealTimers();
  });

  it("forceClear wipes session latch, gate, ring, and MCP pending", () => {
    vi.useFakeTimers();
    const timeoutFn = vi.fn();
    registerMcpPendingTimeoutHandler(timeoutFn);
    (
      window as Window & { __studioQaPendingTimeoutMs?: number }
    ).__studioQaPendingTimeoutMs = 500;

    startAgentTestingOverlay("hygiene");
    expect(isAgentTestingOverlayActive()).toBe(true);
    expect(getSessionKind()).toBe("agent");
    setAwaitingUserReply(true);
    armMcpPendingTimeout();
    appendQaDiagRing({ kind: "user-message", text: "keep?" });
    expect(getQaDiagRing().length).toBeGreaterThan(0);

    forceClearAgentTestingOverlay();

    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(getSessionKind()).toBe("manual");
    expect(isAwaitingUserReply()).toBe(false);
    expect(isQaDiagGateOpen()).toBe(false);
    expect(getQaDiagRing()).toEqual([]);
    expect(
      deriveMcpConnectionStatus({
        overlayActive: false,
        sessionKind: "manual",
        awaitingReply: false,
        now: Date.now(),
      }).phase
    ).toBe("idle");

    vi.advanceTimersByTime(800);
    expect(timeoutFn).not.toHaveBeenCalled();
    delete (window as Window & { __studioQaPendingTimeoutMs?: number })
      .__studioQaPendingTimeoutMs;
  });

  it("forceClear wipes DIAGNOSTIC_ACK_STOP so next prove is not aborted", () => {
    acknowledgePlaybackDiagnosticStop("overlay-cancel");
    expect(peekPoSignal()?.code).toBe("DIAGNOSTIC_ACK_STOP");
    forceClearAgentTestingOverlay();
    expect(peekPoSignal()).toBeNull();
  });

  it("requireFreshQaSession ALWAYS CLEAR wipes stale DIAGNOSTIC_ACK_STOP", () => {
    latchPoSignal({
      type: "alarm",
      code: "DIAGNOSTIC_ACK_STOP",
      note: "stale from prior prove",
    });
    expect(peekPoSignal()?.code).toBe("DIAGNOSTIC_ACK_STOP");
    const qa = requireFreshQaSession("AGENT TESTING — prove latch wipe");
    expect(qa.ok).toBe(true);
    expect(peekPoSignal()).toBeNull();
  });

  it("soft touch keeps MANUAL title (no wipe → AGENT TESTING)", () => {
    openAgentTestingLogger({ kind: "manual" });
    expect(getSessionKind()).toBe("manual");
    touchAgentTestingOverlay();
    expect(getSessionKind()).toBe("manual");
    expect(isAgentTestingOverlayActive()).toBe(true);
  });

  it("bug toggle reclaims AGENT TESTING → MANUAL TEST", () => {
    openAgentTestingLogger({ kind: "agent" });
    expect(getSessionKind()).toBe("agent");
    toggleAgentTestingLogger();
    expect(getSessionKind()).toBe("manual");
    expect(isAgentTestingOverlayActive()).toBe(true);
  });

  it("clearQaPlaybackBlocksForReset lifts FAIL freeze (Play not stuck on Ack)", async () => {
    const { clearQaPlaybackBlocksForReset, beginQaFailHandoff } = await import(
      "@/app/shell/agent-testing/agentTestingOverlay"
    );
    const { isQaProgressFrozen } = await import(
      "@/app/shell/agent-testing/agentTestingProgressFreeze"
    );
    openAgentTestingLogger({ kind: "manual" });
    beginQaFailHandoff("unit-stale-diag");
    expect(isQaProgressFrozen()).toBe(true);
    clearQaPlaybackBlocksForReset("qa-session-reset");
    expect(isQaProgressFrozen()).toBe(false);
  });

  it("softClose on agent lock forceClears (no ghost CONTROL)", () => {
    openAgentTestingLogger({ kind: "agent" });
    expect(isAgentTestingOverlayActive()).toBe(true);
    expect(getSessionKind()).toBe("agent");
    softCloseAgentTestingLogger("unit-agent-close");
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(getSessionKind()).toBe("manual");
    expect(isQaDiagGateOpen()).toBe(false);
  });

  it("softClose wipes log ring + gate and returns to manual", () => {
    openAgentTestingLogger({ kind: "manual" });
    expect(isAgentTestingOverlayActive()).toBe(true);
    appendQaDiagRing({ kind: "user-message", text: "note" });
    softCloseAgentTestingLogger("unit");
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(getSessionKind()).toBe("manual");
    expect(isQaDiagGateOpen()).toBe(false);
    expect(getQaDiagRing()).toEqual([]);
  });

  it("no ghost OBS/CTRL in header when popup closed", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<span class="studio-nav-version__mcp" hidden data-studio-mcp-hint="true"></span>`
    );
    openAgentTestingLogger({ kind: "observe" });
    const hint = document.querySelector<HTMLElement>(".studio-nav-version__mcp");
    expect(hint).toBeTruthy();
    // Live observe may flash connecting first — settle via status API
    const live = (
      window as Window & {
        __studioMcpConnectionStatus?: () => { phase?: string };
      }
    ).__studioMcpConnectionStatus?.();
    expect(["observe", "connecting", "connected"]).toContain(live?.phase);
    if (hint && !hint.hidden) {
      expect(["OBS", "…", "OK"]).toContain(hint.textContent);
    }

    softCloseAgentTestingLogger("ghost-check");
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(isQaDiagGateOpen()).toBe(false);
    expect(hint?.hidden).toBe(true);
    expect(hint?.textContent || "").toBe("");
    expect(document.documentElement.dataset.studioMcpStatus).toBeUndefined();
    expect(document.documentElement.dataset.studioQaLock).toBeUndefined();
    const idle = (
      window as Window & {
        __studioMcpConnectionStatus?: () => { phase?: string; label?: string };
      }
    ).__studioMcpConnectionStatus?.();
    expect(idle?.phase).toBe("idle");
    expect(idle?.label || "").toBe("");
  });

  it("handoff wipe → agent; oversee keeps gate open path", () => {
    openAgentTestingLogger({ kind: "manual" });
    appendQaDiagRing({ kind: "user-message", text: "pre-handoff" });
    handoffQaSession({ oversee: false });
    expect(getSessionKind()).toBe("agent");
    // wipe clears prior user ring; fresh handoff may log one system echo
    expect(
      getQaDiagRing().every(
        (e) => e.kind === "system" || e.kind === "gate-open"
      )
    ).toBe(true);
    expect(
      getQaDiagRing().some((e) => /pre-handoff|keep\?/.test(e.text || e.label || ""))
    ).toBe(false);

    forceClearAgentTestingOverlay();
    openAgentTestingLogger({ kind: "manual" });
    appendQaDiagRing({ kind: "user-message", text: "keep-me" });
    const before = getQaDiagRing().length;
    handoffQaSession({ oversee: true, kind: "observe" });
    expect(getSessionKind()).toBe("observe");
    expect(getQaDiagRing().length).toBeGreaterThanOrEqual(before);
    expect(
      getQaDiagRing().some((e) => (e.text || e.label || "").includes("keep-me"))
    ).toBe(true);
  });

  it("hydrate restores gate persist keys shape", () => {
    openAgentTestingLogger({ kind: "agent" });
    expect(isQaDiagGateOpen()).toBe(true);
    const hydrated = hydrateQaDiagGate();
    expect(hydrated.open).toBe(true);
  });
});
