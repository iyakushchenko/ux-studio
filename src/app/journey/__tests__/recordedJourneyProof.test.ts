/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it } from "vitest";
import {
  markPersistedJourneyPlaybackProven,
  persistRecordedJourneys,
  readPersistedRecordingForJourney,
  withPersistedJourneyPlaybackProof,
} from "@/app/journey/recordedJourneyPersist";
import type { JourneyDefinition } from "@/app/orchestra/types";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import { getStudioRelease } from "@/app/shell/studioRelease";

const journey: JourneyDefinition = {
  id: "rec-proof",
  label: "Sarah · PLP→Book",
  beats: [{ id: "plp", label: "PLP", kind: "tab-landing", protoTab: 3 }],
};
const recording: RecordingSession = {
  id: "session-proof",
  version: 1,
  startedAt: "2026-07-21T18:00:00.000Z",
  events: [],
  metadata: { studioVersion: "0.0.0", recordingContractVersion: 1 },
};

describe("recorded journey playback proof", () => {
  beforeEach(() => localStorage.clear());

  it("persists proof separately from the recording's creation version", () => {
    persistRecordedJourneys("boots-pharmacy", "sarah-jenkins", [journey], {
      [journey.id]: recording,
    });
    expect(markPersistedJourneyPlaybackProven(
      "boots-pharmacy",
      "sarah-jenkins",
      journey.id
    )).toBe(true);
    const updated = readPersistedRecordingForJourney(
      "boots-pharmacy",
      "sarah-jenkins",
      journey.id
    );
    expect(updated?.metadata?.studioVersion).toBe("0.0.0");
    expect(updated?.metadata?.compatibilityProof).toMatchObject({
      playbackContract: 1,
      studioVersion: getStudioRelease().version,
    });
  });

  it("stores a proof overlay for an immutable deployed recording", () => {
    expect(markPersistedJourneyPlaybackProven(
      "boots-pharmacy",
      "sarah-jenkins",
      journey.id
    )).toBe(true);
    const updated = withPersistedJourneyPlaybackProof(
      "boots-pharmacy",
      "sarah-jenkins",
      journey.id,
      recording
    );
    expect(updated?.metadata?.studioVersion).toBe("0.0.0");
    expect(updated?.metadata?.compatibilityProof).toMatchObject({
      playbackContract: 1,
      studioVersion: getStudioRelease().version,
    });
    expect(recording.metadata?.compatibilityProof).toBeUndefined();
  });
});
