/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parkDemoCursorAtRest,
  removeDemoCursor,
  setDemoCursorJourneyMode,
} from "@/app/scenario/demoCursor";
import {
  clearPoSignal,
  installPoSignalWindowApis,
  peekPoSignal,
  uninstallPoSignalWindowApis,
} from "@/app/shell/agent-testing/agentTestingPoSignal";
import { getPlaybackDiagBundle, playbackDiagClear } from "@/app/shell/playbackDiag";
import {
  beginTypeInCursorGuard,
  endTypeInCursorGuard,
  isTypeInCursorGuardActive,
  reportTypeInCursorVisibility,
  resetTypeInCursorGuard,
  tickTypeInCursorGuard,
} from "@/app/shell/typeInCursorGuard";

describe("typeInCursorGuard", () => {
  afterEach(() => {
    resetTypeInCursorGuard();
    clearPoSignal();
    uninstallPoSignalWindowApis();
    setDemoCursorJourneyMode(false);
    removeDemoCursor({ immediate: true });
    playbackDiagClear();
    vi.restoreAllMocks();
  });

  it("holds ORIGINAL journey park rest during type-in (not field coords)", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    await parkDemoCursorAtRest({ force: true, reason: "test-seed" });
    const el = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    expect(el).not.toBeNull();
    const journeyLeft = el!.style.left;
    const journeyTop = el!.style.top;
    expect(journeyLeft).not.toBe("");

    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    Object.defineProperty(ta, "getBoundingClientRect", {
      value: () => ({
        left: 100,
        top: 200,
        right: 400,
        bottom: 260,
        width: 300,
        height: 60,
        x: 100,
        y: 200,
        toJSON: () => ({}),
      }),
    });

    beginTypeInCursorGuard(ta);
    expect(el!.classList.contains("proto-chat-demo-cursor--parked")).toBe(true);
    expect(el!.style.left).toBe(journeyLeft);
    expect(el!.style.top).toBe(journeyTop);
    // Must not sit on the field bbox.
    const left = Number.parseFloat(el!.style.left);
    const top = Number.parseFloat(el!.style.top);
    const onField =
      left >= 100 && left <= 400 && top >= 200 && top <= 260;
    expect(onField).toBe(false);

    tickTypeInCursorGuard(ta, 40);
    tickTypeInCursorGuard(ta, 80);
    expect(el!.style.left).toBe(journeyLeft);
    expect(el!.style.top).toBe(journeyTop);
    ta.remove();
  });

  it("latches CURSOR_HIDDEN_DURING_TYPEIN when cursor missing mid type-in", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    installPoSignalWindowApis();
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    removeDemoCursor({ immediate: true });

    const visible = reportTypeInCursorVisibility("progress");
    expect(visible).toBe(false);
    expect(peekPoSignal()?.code).toBe("CURSOR_HIDDEN_DURING_TYPEIN");
    expect(getPlaybackDiagBundle().cursor.hidden).toBe(1);
  });

  it("exposes active latch for stale-pause skip during type-in", async () => {
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    await parkDemoCursorAtRest({ force: true, reason: "test-seed" });
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    expect(isTypeInCursorGuardActive()).toBe(false);
    beginTypeInCursorGuard(ta);
    expect(isTypeInCursorGuardActive()).toBe(true);
    endTypeInCursorGuard();
    expect(isTypeInCursorGuardActive()).toBe(false);
    ta.remove();
  });
});
