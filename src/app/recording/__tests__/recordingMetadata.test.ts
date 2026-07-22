import { describe, expect, it } from "vitest";
import {
  assertSemanticAgentCjmLabel,
  buildCjmOptionMetadata,
} from "@/app/recording/recordingMetadata";
import type { JourneyDefinition } from "@/app/orchestra/types";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import { getStudioRelease } from "@/app/shell/studioRelease";

const journey: JourneyDefinition = {
  id: "rec-agentic-meta",
  label: "Sarah · PLP→Book appointment",
  beats: [
    { id: "plp", label: "PLP", kind: "tab-landing", protoTab: 3 },
    { id: "book", label: "Book", kind: "tab-landing", protoTab: 5 },
  ],
};

function session(): RecordingSession {
  return {
    id: "session-meta",
    version: 1,
    startedAt: "2026-07-21T12:00:00.000Z",
    events: [],
    metadata: {
      author: "agent",
      authStates: ["guest", "user"],
      recordedFrom: "ui",
      studioVersion: getStudioRelease().version,
      recordingContractVersion: 1,
    },
  };
}

describe("recording metadata", () => {
  it("summarizes steps, mixed auth, timestamp and author", () => {
    const result = buildCjmOptionMetadata(journey, session());
    expect(result.stepCount).toBe(2);
    expect(result.authLabel).toBe("Guest + user");
    expect(result.authorLabel).toBe("Agent");
    expect(result.summary).toContain("2 steps");
    expect(result.issues).toEqual([]);
    expect(result.playable).toBe(true);
  });

  it("blocks only unsafe playback contracts", () => {
    const unsafe = session();
    unsafe.version = 2 as 1;
    const result = buildCjmOptionMetadata(journey, unsafe);
    expect(result.playable).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "recording-version-unsupported",
      severity: "blocking",
    }));
  });

  it("allows version-drift re-testing and clears it with a contract proof", () => {
    const prior = session();
    prior.metadata!.studioVersion = "0.0.0";
    const pending = buildCjmOptionMetadata(journey, prior);
    expect(pending.playable).toBe(true);
    expect(pending.issues).toContainEqual(expect.objectContaining({
      code: "retest-required",
      severity: "warning",
    }));
    prior.metadata!.compatibilityProof = {
      playbackContract: 1,
      studioVersion: getStudioRelease().version,
      provedAt: "2026-07-21T19:00:00.000Z",
    };
    expect(buildCjmOptionMetadata(journey, prior).issues).toEqual([]);
  });

  it("flags legacy recordings and missing raw REC diagnostics", () => {
    expect(buildCjmOptionMetadata(journey).issues[0]?.code).toBe(
      "recording-source-missing"
    );
    const legacy = session();
    legacy.metadata = { recordedFrom: "ui" };
    const pendingLegacy = buildCjmOptionMetadata(journey, legacy);
    expect(pendingLegacy.playable).toBe(true);
    expect(pendingLegacy.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "legacy-recording-contract",
          severity: "warning",
        }),
      ])
    );
    legacy.metadata.compatibilityProof = {
      playbackContract: 1,
      studioVersion: getStudioRelease().version,
      provedAt: "2026-07-21T20:00:00.000Z",
    };
    expect(buildCjmOptionMetadata(journey, legacy).issues).toEqual([]);
    legacy.metadata.compatibilityProof.studioVersion = "0.0.0";
    expect(buildCjmOptionMetadata(journey, legacy).issues).toContainEqual(
      expect.objectContaining({ code: "legacy-recording-contract" })
    );
  });

  it("guards agent naming against QA/test placeholders", () => {
    expect(() => assertSemanticAgentCjmLabel("QA Route 4")).toThrow();
    expect(() =>
      assertSemanticAgentCjmLabel("Sarah · PLP→Book appointment")
    ).not.toThrow();
  });
});
