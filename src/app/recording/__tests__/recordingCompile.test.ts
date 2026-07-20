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
