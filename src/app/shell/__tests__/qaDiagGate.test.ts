import { afterEach, describe, expect, it, vi } from "vitest";
import {
  appendQaDiagRing,
  closeQaDiagGate,
  getQaDiagRing,
  hydrateQaDiagGate,
  isQaDiagGateOpen,
  openQaDiagGate,
  resetQaDiagGateForTests,
  setQaDiagSessionMeta,
} from "@/app/shell/qaDiagGate";
import { playbackDiagLog, playbackDiagClear } from "@/app/shell/playbackDiag";

describe("qaDiagGate", () => {
  afterEach(() => {
    resetQaDiagGateForTests();
    vi.restoreAllMocks();
  });

  it("opens and closes gate with persist hydrate", () => {
    expect(isQaDiagGateOpen()).toBe(false);
    openQaDiagGate({ reason: "test" });
    expect(isQaDiagGateOpen()).toBe(true);
    appendQaDiagRing({ kind: "po-note", text: "hello" });
    expect(getQaDiagRing().some((e) => e.kind === "po-note")).toBe(true);
    closeQaDiagGate();
    expect(isQaDiagGateOpen()).toBe(false);
    const again = hydrateQaDiagGate();
    expect(again.open).toBe(false);
    expect(again.ring.length).toBeGreaterThan(0);
  });

  it("persists sessionKind + awaitingReply for mid-CONTROL refresh", () => {
    openQaDiagGate({
      logger: false,
      reason: "agent",
      sessionKind: "agent",
    });
    setQaDiagSessionMeta({ awaitingReply: true });
    const raw = sessionStorage.getItem("studioQaDiagGate");
    expect(raw).toMatch(/"sessionKind":"agent"/);
    expect(raw).toMatch(/"awaitingReply":true/);

    // Simulate cold boot: clear memory, keep storage shape
    const gate = sessionStorage.getItem("studioQaDiagGate");
    resetQaDiagGateForTests();
    if (gate) sessionStorage.setItem("studioQaDiagGate", gate);
    sessionStorage.setItem("studioQaDiagRing", "[]");

    const hydrated = hydrateQaDiagGate();
    expect(hydrated.open).toBe(true);
    expect(hydrated.sessionKind).toBe("agent");
    expect(hydrated.awaitingReply).toBe(true);
    expect(hydrated.logger).toBe(false);
  });

  it("legacy gate-open without kind → agent when not logger", () => {
    sessionStorage.setItem(
      "studioQaDiagGate",
      JSON.stringify({ open: true, logger: false, updatedAt: Date.now() })
    );
    sessionStorage.setItem("studioQaDiagRing", "[]");
    const hydrated = hydrateQaDiagGate();
    expect(hydrated.sessionKind).toBe("agent");
  });

  it("PLAYBACK_DIAG console is quiet when gate closed", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagClear();
    playbackDiagLog("info", "silent-when-closed");
    expect(
      info.mock.calls.some((c) => String(c[0]).includes("[PLAYBACK_DIAG]"))
    ).toBe(false);
    openQaDiagGate();
    playbackDiagLog("info", "loud-when-open");
    expect(
      info.mock.calls.some((c) => String(c[0]).includes("[PLAYBACK_DIAG]"))
    ).toBe(true);
  });
});
