import { describe, expect, it } from "vitest";
import type { JourneyFile } from "@/app/journey/journeyFile";
import { buildCjmMetadataCatalog } from "@/app/recording/recordingMetadata";
import {
  SARAH_JENKINS_CJM_RECORDINGS,
  SARAH_JENKINS_CJMS,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm";

const recordedFiles = import.meta.glob<JourneyFile>("../recorded/*.journey.json", {
  eager: true,
  import: "default",
});

describe("Sarah Jenkins deployed CJM catalog", () => {
  it("owns every current CJM under project/persona/cjm", () => {
    expect(SARAH_JENKINS_CJMS).toHaveLength(13);
    expect(new Set(SARAH_JENKINS_CJMS.map((journey) => journey.id)).size).toBe(13);
    expect(Object.keys(recordedFiles)).toHaveLength(11);
  });

  it("keeps every recorded file scoped and playable", () => {
    for (const file of Object.values(recordedFiles)) {
      expect(file.projectId).toBe("boots-pharmacy");
      expect(file.personaId).toBe("sarah-jenkins");
      expect(file.journey.id).toBeTruthy();
      expect(file.journey.label).toBeTruthy();
      expect(file.journey.beats.length).toBeGreaterThan(0);
      expect(file.recording?.events.length).toBeGreaterThan(0);
    }
  });

  it("is playable on a clean deployment without browser persistence", () => {
    const metadata = buildCjmMetadataCatalog(
      SARAH_JENKINS_CJMS,
      (journeyId) => SARAH_JENKINS_CJM_RECORDINGS[journeyId]
    );
    expect(Object.values(metadata)).toHaveLength(13);
    expect(
      Object.values(metadata).flatMap((item) => item.issues).map((issue) => issue.code)
    ).not.toContain("recording-source-missing");
    const currentContractRecordings = Object.values(metadata).filter(
      (item) => item.journeyId.startsWith("rec-trad-")
    );
    expect(currentContractRecordings).toHaveLength(10);
    expect(currentContractRecordings.every((item) => item.playable)).toBe(true);
    const legacy = metadata["rec-agentic-mru4b15c-jnhv"];
    expect(legacy?.playable).toBe(true);
    expect(legacy?.issues).toContainEqual(expect.objectContaining({
      code: "legacy-recording-contract",
      severity: "warning",
    }));
  });
});
