import { describe, expect, it } from "vitest";
import {
  AGENTIC_CJM_JOURNEY,
  TRADITIONAL_CJM_JOURNEY,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";
import {
  deserializeJourneyBundleFile,
  deserializeJourneyFile,
  serializeJourneyBundleFile,
  buildSavedJourneyDownload,
  serializeJourneyFile,
  summarizeJourney,
} from "@/app/journey/journeyFile";

describe("journeyFile", () => {
  it("round-trips a single journey", () => {
    const json = serializeJourneyFile({
      journey: AGENTIC_CJM_JOURNEY,
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
    });
    const restored = deserializeJourneyFile(json);
    expect(restored.version).toBe(1);
    expect(restored.projectId).toBe("boots-pharmacy");
    expect(restored.journey).toEqual(AGENTIC_CJM_JOURNEY);
  });

  it("round-trips both CJMs in a bundle", () => {
    const json = serializeJourneyBundleFile({
      journeys: [AGENTIC_CJM_JOURNEY, TRADITIONAL_CJM_JOURNEY],
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
    });
    const restored = deserializeJourneyBundleFile(json);
    expect(restored.journeys).toHaveLength(2);
    expect(restored.journeys[0]?.id).toBe("agentic-cjm");
    expect(restored.journeys[1]?.id).toBe("traditional-cjm");
  });

  it("summarizes journey beats", () => {
    const summary = summarizeJourney(TRADITIONAL_CJM_JOURNEY);
    expect(summary.id).toBe("traditional-cjm");
    expect(summary.beatCount).toBeGreaterThan(0);
    expect(summary.beatIds[0]).toBe("traditional-plp");
  });

  it("rejects unsupported versions", () => {
    expect(() =>
      deserializeJourneyFile(
        JSON.stringify({ version: 99, journey: AGENTIC_CJM_JOURNEY })
      )
    ).toThrow(/Unsupported journey file version/);
  });

  it("builds saved-journey Download payload", () => {
    const exported = buildSavedJourneyDownload({
      journey: AGENTIC_CJM_JOURNEY,
      projectId: "boots-pharmacy",
      personaId: "sarah-jenkins",
    });
    expect(exported?.filename).toBe("agentic-cjm.journey.json");
    expect(exported?.json).toContain('"id": "agentic-cjm"');
    expect(buildSavedJourneyDownload({ journey: null })).toBeNull();
  });
});
