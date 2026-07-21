import { describe, expect, it } from "vitest";
import { resolveRecordingSessionFromImportJson } from "@/app/recording/recordingImport";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import { serializeJourneyFile } from "@/app/journey/journeyFile";
import type { JourneyDefinition } from "@/app/orchestra/types";

function sampleSession(overrides?: Partial<RecordingSession>): RecordingSession {
  return {
    version: 1,
    id: "rec-test-1",
    startedAt: "2026-07-21T00:00:00.000Z",
    events: [
      { kind: "screen", atMs: 0, screenId: "plp" },
      { kind: "demo-click", atMs: 100, element: "cta" },
    ],
    ...overrides,
  };
}

const sampleJourney: JourneyDefinition = {
  id: "rec-trad-sample",
  label: "Sarah · PLP→Book · sample",
  beats: [
    {
      id: "b1",
      label: "PLP",
      kind: "tab-landing",
      protoTab: 1,
    },
  ],
};

describe("resolveRecordingSessionFromImportJson", () => {
  it("imports raw .recording.json sessions", () => {
    const session = sampleSession();
    const resolved = resolveRecordingSessionFromImportJson(
      JSON.stringify(session)
    );
    expect(resolved.source).toBe("recording");
    expect(resolved.session.id).toBe("rec-test-1");
    expect(resolved.session.events).toHaveLength(2);
    expect(resolved.suggestedLabel).toBeUndefined();
  });

  it("imports .journey.json with embedded recording (unlocks +)", () => {
    const session = sampleSession();
    const json = serializeJourneyFile({
      journey: sampleJourney,
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
      recording: session,
    });
    const resolved = resolveRecordingSessionFromImportJson(json);
    expect(resolved.source).toBe("journey-recording");
    expect(resolved.session.id).toBe(session.id);
    expect(resolved.suggestedLabel).toBe(sampleJourney.label);
  });

  it("rejects .journey.json without embedded recording", () => {
    const json = serializeJourneyFile({
      journey: sampleJourney,
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
    });
    expect(() => resolveRecordingSessionFromImportJson(json)).toThrow(
      /no embedded recording/i
    );
  });

  it("rejects unsupported payloads", () => {
    expect(() => resolveRecordingSessionFromImportJson("{")).toThrow();
    expect(() =>
      resolveRecordingSessionFromImportJson(JSON.stringify({ version: 1 }))
    ).toThrow();
  });
});
