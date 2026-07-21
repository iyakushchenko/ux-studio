/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  assertFirstBeatMatchesStartScreen,
  resolveRecordingStartScreenId,
} from "@/app/recording/recStartScreenAssert";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import {
  resetQaModalTrackForTests,
  getLastTrackedModalIdForTests,
  trackStudioModalForQa,
  trackStudioModalPickForQa,
} from "@/app/shell/qaModalTrack";

function session(partial: Partial<RecordingSession>): RecordingSession {
  return {
    id: "s1",
    version: 1,
    startedAt: new Date().toISOString(),
    projectId: "boots-pharmacy",
    events: [],
    ...partial,
  };
}

describe("assertFirstBeatMatchesStartScreen", () => {
  it("PASS when first beat id equals metadata.startScreenId", () => {
    const s = session({
      metadata: { startScreenId: "plp" },
      events: [{ kind: "screen", screenId: "plp", atMs: 1 }],
    });
    const r = assertFirstBeatMatchesStartScreen(s, {
      id: "rec-trad-x",
      label: "t",
      beats: [{ id: "plp", label: "PLP", kind: "tab-landing" }],
    });
    expect(r.ok).toBe(true);
    expect(r.startScreenId).toBe("plp");
  });

  it("FAIL when first beat is camera (plp-book-now-camera)", () => {
    const s = session({
      metadata: { startScreenId: "plp" },
      events: [{ kind: "screen", screenId: "plp", atMs: 1 }],
    });
    const r = assertFirstBeatMatchesStartScreen(s, {
      id: "rec-trad-x",
      label: "t",
      beats: [
        { id: "plp-book-now-camera", label: "Camera", kind: "tab-landing" },
        { id: "plp-book-now", label: "Book", kind: "tab-landing" },
      ],
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/plp-book-now-camera/);
  });

  it("resolveRecordingStartScreenId prefers metadata over later screens", () => {
    const s = session({
      metadata: { startScreenId: "plp" },
      events: [
        { kind: "screen", screenId: "plp", atMs: 1 },
        { kind: "screen", screenId: "pdp", atMs: 2 },
      ],
    });
    expect(resolveRecordingStartScreenId(s)).toBe("plp");
  });
});

describe("qaModalTrack", () => {
  beforeEach(() => {
    resetQaModalTrackForTests();
  });

  it("tracks open then close without spam on same id", () => {
    trackStudioModalForQa({ modalId: "choose-pharmacy", screenId: "book-step-1" });
    expect(getLastTrackedModalIdForTests()).toBe("choose-pharmacy");
    trackStudioModalForQa({ modalId: "choose-pharmacy", screenId: "book-step-1" });
    expect(getLastTrackedModalIdForTests()).toBe("choose-pharmacy");
    trackStudioModalForQa({ modalId: null, screenId: "book-step-1" });
    expect(getLastTrackedModalIdForTests()).toBe(null);
  });

  it("pick helper is hang-safe", () => {
    expect(() =>
      trackStudioModalPickForQa({
        modalId: "choose-pharmacy",
        storeId: "covent",
        detail: "Choose Location",
      })
    ).not.toThrow();
  });
});
