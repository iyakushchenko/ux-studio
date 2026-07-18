import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPlaybackCursorMonitor } from "@/app/shell/protoPlaybackCursorMonitor";

describe("protoPlaybackCursorMonitor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports stale cursor after manual step-forward when cursor remains", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackCursorMonitor({ countCursors: () => 1 });
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);
    monitor.setContext({
      isScripting: false,
      isOnAir: false,
      isPausingBeforeReveal: false,
      beatId: "book-location",
    });

    monitor.noteManualTransport("step-forward");
    vi.advanceTimersByTime(220);

    expect(anomalies).toEqual(["cursor-stale"]);
  });

  it("suppresses stale cursor while pausing before reveal", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackCursorMonitor({ countCursors: () => 1 });
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);
    monitor.setContext({
      isScripting: false,
      isOnAir: true,
      isPausingBeforeReveal: true,
    });

    monitor.noteManualTransport("step-forward");
    vi.advanceTimersByTime(220);

    expect(anomalies).toEqual([]);
  });

  it("reports orphaned cursor after beat change grace", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackCursorMonitor({ countCursors: () => 2 });
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);
    monitor.setContext({
      isScripting: false,
      isOnAir: false,
      isPausingBeforeReveal: false,
      beatId: "pdp",
      childIndex: 8,
    });

    monitor.noteBeatOrScreenChange();
    vi.advanceTimersByTime(480);

    expect(anomalies).toEqual(["cursor-orphaned"]);
  });

  it("reports stale cursor after scripting ends", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackCursorMonitor({ countCursors: () => 1 });
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);
    monitor.setContext({
      isScripting: false,
      isOnAir: false,
      isPausingBeforeReveal: false,
    });

    monitor.noteScriptingEnd();
    vi.advanceTimersByTime(180);

    expect(anomalies).toEqual(["cursor-stale"]);
  });
});
