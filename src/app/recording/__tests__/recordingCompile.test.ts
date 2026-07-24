import { afterEach, describe, expect, it } from "vitest";
import {
  compileRecordingToJourney,
  saveRecordingAsJourney,
} from "@/app/recording/recordingCompile";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import {
  clearImportedJourneys,
  resetImportedJourneysForTests,
  resolveRuntimeJourneys,
} from "@/app/journey/journeyRuntimeStore";
import {
  AGENTIC_CJM_JOURNEY,
  TRADITIONAL_CJM_JOURNEY,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";

function sessionWithTouchpoints(): RecordingSession {
  return {
    id: "compile-session",
    version: 1,
    startedAt: "2026-07-19T12:00:00.000Z",
    projectId: "boots-pharmacy",
    personaId: "sarah-jenkins",
    journeyId: "agentic-cjm",
    orchestraMode: "agentic-cjm",
    events: [
      {
        kind: "touchpoint",
        touchpointKey: "beat:agentic-home",
        beatId: "agentic-home",
        label: "Agentic home",
        atMs: 10,
      },
      {
        kind: "director-script",
        scriptId: "sarah-query-submit",
        scriptKind: "home",
        atMs: 20,
        snapshot: { protoTab: 1, currentTabIndex: 0 },
      },
      {
        kind: "dwell",
        durationMs: 1200,
        atMs: 30,
      },
      {
        kind: "touchpoint",
        touchpointKey: "beat:avail-location",
        beatId: "avail-location",
        label: "Choose pharmacy",
        atMs: 40,
      },
      {
        kind: "director-script",
        scriptId: "select-location",
        scriptKind: "avail",
        atMs: 50,
      },
      {
        kind: "wire-intent",
        intentId: "open-availability-date-chat",
        atMs: 60,
      },
      {
        kind: "touchpoint",
        touchpointKey: "beat:book-step2",
        beatId: "book-step2",
        label: "Book - Step 2",
        atMs: 70,
      },
      {
        kind: "wire-intent",
        intentId: "apply-demo-location",
        atMs: 80,
        snapshot: { protoTab: 6, currentTabIndex: 5 },
      },
      {
        kind: "director-script",
        scriptId: "select-book-date",
        scriptKind: "book",
        atMs: 90,
      },
      {
        kind: "scroll",
        scrollTop: 120,
        atMs: 100,
      },
      {
        kind: "typed-text",
        value: "London",
        selectorChain: ['[data-studio-action="avail-search-query"]'],
        atMs: 110,
      },
    ],
  };
}

describe("compileRecordingToJourney", () => {
  afterEach(() => {
    resetImportedJourneysForTests();
  });

  it("maps touchpoint segments to playable beats", () => {
    const { journey, gaps, warnings } = compileRecordingToJourney(
      sessionWithTouchpoints()
    );

    expect(warnings).toEqual([]);
    expect(journey.id).toMatch(/^rec-agentic-/);
    expect(journey.label).toMatch(/Recorded Agentic/i);
    expect(journey.beats).toHaveLength(3);

    expect(journey.beats[0]).toMatchObject({
      id: "agentic-home",
      homeScript: "sarah-query-submit",
      protoTab: 1,
      dwellMs: 1200,
      kind: "tab-landing",
    });
    expect(journey.beats[1]).toMatchObject({
      id: "avail-location",
      availScript: "select-location",
      onEnter: "open-availability-date-chat",
      kind: "overlay",
    });
    expect(journey.beats[2]).toMatchObject({
      id: "book-step2",
      onEnter: "apply-demo-location",
      bookScript: "select-book-date",
      protoTab: 6,
      kind: "tab-landing",
    });
    expect(gaps).toContain("scroll");
    expect(gaps).toContain("typed-text");
  });

  it("falls back to screen/director markers without touchpoints", () => {
    const session: RecordingSession = {
      id: "fallback",
      version: 1,
      startedAt: "2026-07-19T12:00:00.000Z",
      journeyId: "traditional-cjm",
      projectId: "boots-pharmacy",
      events: [
        {
          kind: "screen",
          screenId: "plp",
          atMs: 1,
          // Stale beat protoTab must NOT win over screenId / currentTabIndex.
          snapshot: { protoTab: 1, currentTabIndex: 2 },
        },
        {
          kind: "director-script",
          scriptId: "plp-open-pdp",
          scriptKind: "tab",
          atMs: 2,
        },
        {
          kind: "screen",
          screenId: "pdp",
          atMs: 3,
          snapshot: { protoTab: 1 },
        },
        {
          kind: "director-script",
          scriptId: "pdp-book-now",
          atMs: 4,
        },
      ],
    };

    const { journey, warnings } = compileRecordingToJourney(session);
    expect(warnings).toContain("no-touchpoint-markers");
    expect(journey.id).toMatch(/^rec-trad-/);
    expect(journey.beats).toHaveLength(2);
    expect(journey.beats[0]).toMatchObject({
      tabScript: "plp-open-pdp",
      protoTab: 3,
    });
    expect(journey.beats[1]).toMatchObject({
      tabScript: "pdp-book-now",
      protoTab: 4,
    });
  });

  it("maps screen ids to protoTab when snapshots are missing or stale", () => {
    const session: RecordingSession = {
      id: "screen-map",
      version: 1,
      startedAt: "2026-07-20T12:00:00.000Z",
      projectId: "boots-pharmacy",
      orchestraMode: "agentic-cjm",
      events: [
        { kind: "screen", screenId: "site-pilot", atMs: 1 },
        { kind: "screen", screenId: "chat", atMs: 2, snapshot: { protoTab: 1 } },
        { kind: "screen", screenId: "book-step-2", atMs: 3 },
        { kind: "screen", screenId: "plp", atMs: 4 },
      ],
    };

    const { journey, warnings } = compileRecordingToJourney(session);
    expect(warnings).toContain("no-touchpoint-markers");
    expect(journey.beats.map((b) => [b.id, b.protoTab])).toEqual([
      ["site-pilot", 1],
      ["chat", 2],
      ["book-step-2", 6],
      ["plp", 3],
    ]);
  });

  it("coalesces consecutive duplicate screen ids into one beat", () => {
    const session: RecordingSession = {
      id: "chat-churn",
      version: 1,
      startedAt: "2026-07-20T12:00:00.000Z",
      projectId: "boots-pharmacy",
      orchestraMode: "agentic-cjm",
      events: [
        { kind: "screen", screenId: "site-pilot", atMs: 1 },
        {
          kind: "screen",
          screenId: "chat",
          atMs: 2,
          studioUrl: "?screen=chat&cjm=off",
        },
        {
          kind: "screen",
          screenId: "chat",
          atMs: 3,
          studioUrl: "?screen=chat&cjm=off&experience=agentic",
        },
        {
          kind: "screen",
          screenId: "chat",
          atMs: 4,
          studioUrl: "?screen=chat&modal=x",
        },
        { kind: "screen", screenId: "plp", atMs: 5 },
      ],
    };

    const { journey } = compileRecordingToJourney(session);
    expect(journey.beats.map((b) => b.id)).toEqual([
      "site-pilot",
      "chat",
      "plp",
    ]);
  });

  it("prepends start screen when first compiled beat would be a camera CTA", () => {
    const session: RecordingSession = {
      id: "start-screen-prepend",
      version: 1,
      startedAt: "2026-07-21T12:00:00.000Z",
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
      orchestraMode: "traditional-cjm",
      metadata: { startScreenId: "plp", recordedFrom: "ui" },
      events: [
        // No screen seed — only scroll-stop + click (the bug class from long REC).
        {
          kind: "scroll-stop",
          dwellMs: 2400,
          atMs: 50,
        },
        {
          kind: "demo-click",
          element: "Book now",
          selectorChain: ['[data-studio-action="plp-book-now"]'],
          atMs: 100,
          // Intentionally omit screenId/protoTab so hollow landing cannot invent plp.
        },
      ],
    };
    const { journey, warnings } = compileRecordingToJourney(session);
    expect(journey.beats[0]?.id).toBe("plp");
    expect(
      warnings.some((w) => w.startsWith("start-screen-prepended:plp")) ||
        journey.beats.some((b) => b.id === "plp-book-now")
    ).toBe(true);
  });

  it("compile v2 maps usable demo-clicks into recordedClick beats", () => {
    const session: RecordingSession = {
      id: "click-compile",
      version: 1,
      startedAt: "2026-07-20T12:00:00.000Z",
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
      journeyId: "agentic-cjm",
      orchestraMode: "agentic-cjm",
      events: [
        {
          kind: "screen",
          screenId: "chat",
          atMs: 0,
          snapshot: { currentTabIndex: 1, screenId: "chat" },
        },
        {
          kind: "demo-click",
          element: "See what's available near me",
          selectorChain: ['[data-studio-action="chat-avail-near-me"]'],
          atMs: 100,
        },
        {
          kind: "screen",
          screenId: "chat",
          atMs: 200,
          studioUrl: "?screen=chat&modal=choose-pharmacy",
        },
        {
          kind: "demo-click",
          element: "Choose Location",
          selectorChain: ['[data-studio-action="avail-choose-location"]'],
          atMs: 400,
        },
        {
          kind: "screen",
          screenId: "book-step-2",
          atMs: 500,
          snapshot: { currentTabIndex: 5, screenId: "book-step-2" },
        },
        {
          kind: "demo-click",
          element: "hollow",
          selectorChain: ["#root"],
          atMs: 800,
        },
      ],
    };

    const { journey, gaps } = compileRecordingToJourney(session);
    const clickBeats = journey.beats.filter((b) => b.recordedClick);
    expect(clickBeats.length).toBe(2);
    expect(clickBeats[0]?.recordedClick?.selectorChain).toEqual([
      '[data-studio-action="chat-avail-near-me"]',
    ]);
    expect(clickBeats[1]?.recordedClick?.selectorChain).toEqual([
      '[data-studio-action="avail-choose-location"]',
    ]);
    expect(clickBeats[1]?.recordedClick?.modalId).toBe("choose-pharmacy");
    expect(clickBeats.every((b) => (b.dwellMs ?? 0) >= 4000)).toBe(true);
    expect(journey.beats.some((b) => b.id === "chat-2")).toBe(false);
    expect(gaps).toContain("demo-click:unusable-selector");
  });

  it("inherits any recorded modal URL for inside clicks and clears it on close", () => {
    const session: RecordingSession = {
      id: "generic-modal-compile",
      version: 1,
      startedAt: "2026-07-21T12:00:00.000Z",
      projectId: "concept-project",
      personaId: "persona",
      events: [
        {
          kind: "screen",
          screenId: "catalog",
          atMs: 0,
          studioUrl: "?project=concept-project&screen=catalog",
        },
        {
          kind: "demo-click",
          element: "Open details",
          selectorChain: ['[data-studio-action="open-details"]'],
          atMs: 100,
        },
        {
          kind: "screen",
          screenId: "catalog",
          studioUrl: "?project=concept-project&screen=catalog&modal=details",
          atMs: 200,
        },
        {
          kind: "demo-click",
          element: "Confirm details",
          selectorChain: ['[data-studio-action="confirm-details"]'],
          atMs: 300,
        },
        {
          kind: "screen",
          screenId: "catalog",
          studioUrl: "?project=concept-project&screen=catalog",
          atMs: 400,
        },
        {
          kind: "demo-click",
          element: "Continue browsing",
          selectorChain: ['[data-studio-action="continue-browsing"]'],
          atMs: 500,
        },
      ],
    };

    const { journey } = compileRecordingToJourney(session);
    const clicks = journey.beats.filter((beat) => beat.recordedClick);

    expect(clicks.map((beat) => beat.recordedClick?.modalId)).toEqual([
      undefined,
      "details",
      undefined,
    ]);
  });

  it("refuses to save a human recording when every product click is unplayable", () => {
    const session: RecordingSession = {
      id: "unplayable-clicks",
      version: 1,
      startedAt: "2026-07-21T12:00:00.000Z",
      projectId: "concept-project",
      metadata: { recordedFrom: "ui", startScreenId: "catalog" },
      events: [
        { kind: "screen", screenId: "catalog", atMs: 0 },
        { kind: "demo-click", element: "Open dialog", selectorChain: [], atMs: 100 },
      ],
    };

    expect(() => saveRecordingAsJourney(session)).toThrow(
      "recorded interactions have no stable playback target"
    );
  });

  it("scroll-stop ≥2s compiles to kind:camera beat (dwell + target)", () => {
    const session: RecordingSession = {
      id: "scroll-stop-compile",
      version: 1,
      startedAt: "2026-07-21T12:00:00.000Z",
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
      journeyId: "traditional-cjm",
      orchestraMode: "traditional-cjm",
      events: [
        {
          kind: "screen",
          screenId: "book-step-3",
          atMs: 0,
          snapshot: { currentTabIndex: 6, screenId: "book-step-3" },
        },
        {
          kind: "scroll",
          selectorChain: ['[data-studio-open-appointment="true"]'],
          anchorSelector: '[data-studio-open-appointment="true"]',
          atMs: 100,
        },
        {
          kind: "scroll-stop",
          durationMs: 2400,
          selectorChain: ['[data-studio-open-appointment="true"]'],
          anchorSelector: '[data-studio-open-appointment="true"]',
          atMs: 2500,
        },
      ],
    };

    const { journey, gaps } = compileRecordingToJourney(session);
    const cameras = journey.beats.filter((b) => b.kind === "camera");
    expect(cameras.length).toBeGreaterThanOrEqual(1);
    expect(cameras[0]?.camera).toMatchObject({
      dwellMs: 2400,
      selectorChain: ['[data-studio-open-appointment="true"]'],
      anchorSelector: '[data-studio-open-appointment="true"]',
    });
    expect(gaps).not.toContain("scroll-stop");
  });

  it("scroll-stop before click stamps camera dwell then recordedClick", () => {
    const session: RecordingSession = {
      id: "scroll-stop-click",
      version: 1,
      startedAt: "2026-07-21T12:00:00.000Z",
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
      journeyId: "traditional-cjm",
      orchestraMode: "traditional-cjm",
      events: [
        {
          kind: "screen",
          screenId: "book-step-3",
          atMs: 0,
          snapshot: { currentTabIndex: 6, screenId: "book-step-3" },
        },
        {
          kind: "scroll",
          selectorChain: ['[data-studio-open-appointment="true"]'],
          atMs: 50,
        },
        {
          kind: "scroll-stop",
          durationMs: 2100,
          selectorChain: ['[data-studio-open-appointment="true"]'],
          atMs: 2200,
        },
        {
          kind: "demo-click",
          element: "Open appointments",
          selectorChain: ['[data-studio-action="confirmation-open-appointments"]'],
          atMs: 2300,
        },
      ],
    };

    const { journey } = compileRecordingToJourney(session);
    const camera = journey.beats.find((b) => b.kind === "camera");
    const click = journey.beats.find((b) => b.recordedClick);
    expect(camera?.camera?.dwellMs).toBe(2100);
    expect(camera?.camera?.selectorChain).toEqual([
      '[data-studio-open-appointment="true"]',
    ]);
    expect(click?.recordedClick?.selectorChain).toEqual([
      '[data-studio-action="confirmation-open-appointments"]',
    ]);
    expect(click?.recordedClick?.cameraSelectorChain).toBeUndefined();
  });

  it("coalesces consecutive scroll-stops into one camera beat", () => {
    const session: RecordingSession = {
      id: "scroll-stop-coalesce",
      version: 1,
      startedAt: "2026-07-21T12:00:00.000Z",
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
      journeyId: "traditional-cjm",
      orchestraMode: "traditional-cjm",
      events: [
        {
          kind: "screen",
          screenId: "plp",
          atMs: 0,
          snapshot: { currentTabIndex: 4, screenId: "plp" },
        },
        {
          kind: "scroll",
          selectorChain: ['[data-studio-probe-below-fold="true"]'],
          anchorSelector: '[data-studio-probe-below-fold="true"]',
          atMs: 100,
        },
        {
          kind: "scroll-stop",
          durationMs: 2100,
          selectorChain: ['[data-studio-probe-below-fold="true"]'],
          anchorSelector: '[data-studio-probe-below-fold="true"]',
          atMs: 2200,
        },
        {
          kind: "scroll-stop",
          durationMs: 4000,
          selectorChain: ['[data-studio-probe-below-fold="true"]'],
          anchorSelector: '[data-studio-probe-below-fold="true"]',
          atMs: 6200,
        },
        {
          kind: "demo-click",
          element: "Quick View",
          selectorChain: ['[data-studio-action="plp-quick-view"]'],
          atMs: 6300,
        },
      ],
    };

    const { journey } = compileRecordingToJourney(session);
    const cameras = journey.beats.filter((b) => b.kind === "camera");
    expect(cameras).toHaveLength(1);
    expect(cameras[0]?.camera?.dwellMs).toBe(4000);
  });

  it("emits concise human labels — not Legacy data-name soup", () => {
    const session: RecordingSession = {
      id: "human-labels",
      version: 1,
      startedAt: "2026-07-21T12:00:00.000Z",
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
      journeyId: "traditional-cjm",
      orchestraMode: "traditional-cjm",
      events: [
        {
          kind: "screen",
          screenId: "plp",
          atMs: 0,
          snapshot: { currentTabIndex: 2, screenId: "plp" },
        },
        {
          kind: "scroll-stop",
          durationMs: 2200,
          selectorChain: ['[data-name="component.plp.tile.title"]'],
          anchorSelector: '[data-name="component.plp.tile.title"]',
          atMs: 2300,
        },
        {
          kind: "demo-click",
          element: 'data-name="module.plp.tiles"',
          selectorChain: ['[data-studio-action="plp-book-now"]'],
          atMs: 2500,
          snapshot: { currentTabIndex: 2, screenId: "plp" },
        },
      ],
    };

    const { journey } = compileRecordingToJourney(session);
    for (const beat of journey.beats) {
      expect(beat.label).not.toMatch(/data-name=/i);
      expect(beat.label).not.toMatch(/^module\./i);
      expect(beat.label).not.toMatch(/^component\./i);
    }
    const click = journey.beats.find((b) => b.recordedClick);
    expect(click?.label).toMatch(/tiles|book/i);
    const land = journey.beats.find((b) => b.id === "plp" || b.label === "Vaccinations");
    expect(land?.label).toBe("Vaccinations");
  });

  it("drops weak filter checkbox scroll-stop anchors at compile", () => {
    const session: RecordingSession = {
      id: "weak-filter-anchor",
      version: 1,
      startedAt: "2026-07-21T12:00:00.000Z",
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
      journeyId: "traditional-cjm",
      orchestraMode: "traditional-cjm",
      events: [
        {
          kind: "screen",
          screenId: "plp",
          atMs: 0,
          snapshot: { currentTabIndex: 2, screenId: "plp" },
        },
        {
          kind: "scroll-stop",
          durationMs: 2200,
          selectorChain: [
            '[data-name="component.plp.filter.checkbox.item"]',
          ],
          anchorSelector:
            '[data-name="component.plp.filter.checkbox.item"]',
          atMs: 2300,
        },
      ],
    };

    const { journey } = compileRecordingToJourney(session);
    const cam = journey.beats.find((b) => b.kind === "camera");
    expect(cam?.camera?.selectorChain).toBeUndefined();
    expect(cam?.camera?.anchorSelector).toBeUndefined();
    expect(cam?.label).toMatch(/^Camera/i);
  });

  it("persists raw recording session with Add as CJM", () => {
    const session = sessionWithTouchpoints();
    const saved = saveRecordingAsJourney(session, {
      label: "PO prove persist",
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
    });
    expect(saved.file.recording?.id).toBe(session.id);
    expect(saved.file.recording?.events.length).toBe(session.events.length);
    expect(saved.json).toContain('"kind": "touchpoint"');
    expect(saved.json).toContain('"recording"');
  });

  it("refuses placeholder titles for agent-created CJMs", () => {
    const session = sessionWithTouchpoints();
    session.metadata = { ...session.metadata, author: "agent" };
    expect(() =>
      saveRecordingAsJourney(session, { label: "QA Route 7" })
    ).toThrow(/human journey|forbidden/i);
    expect(() =>
      saveRecordingAsJourney(session, {
        label: "Sarah · Home→Chat vaccination advice",
      })
    ).not.toThrow();
  });

  it("adds a new CJM id without overwriting built-in slots", () => {
    const saved = saveRecordingAsJourney(sessionWithTouchpoints());
    expect(saved.summary.beatCount).toBe(3);
    expect(saved.journey.id).toMatch(/^rec-agentic-/);
    expect(saved.json).toContain('"agentic-home"');

    const merged = resolveRuntimeJourneys([
      AGENTIC_CJM_JOURNEY,
      TRADITIONAL_CJM_JOURNEY,
    ]);
    expect(merged.find((j) => j.id === "agentic-cjm")?.label).toBe(
      AGENTIC_CJM_JOURNEY.label
    );
    expect(merged.find((j) => j.id === "traditional-cjm")?.label).toBe(
      TRADITIONAL_CJM_JOURNEY.label
    );
    const recorded = merged.find((j) => j.id === saved.journey.id);
    expect(recorded?.beats[0]?.homeScript).toBe("sarah-query-submit");

    clearImportedJourneys();
    expect(resolveRuntimeJourneys([AGENTIC_CJM_JOURNEY])[0]?.label).toBe(
      AGENTIC_CJM_JOURNEY.label
    );
  });
});
