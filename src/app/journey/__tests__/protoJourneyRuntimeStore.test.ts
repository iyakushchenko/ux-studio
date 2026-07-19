import { afterEach, describe, expect, it } from "vitest";
import {
  AGENTIC_CJM_JOURNEY,
  TRADITIONAL_CJM_JOURNEY,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";
import {
  applyImportedJourneyBundle,
  clearImportedJourneys,
  resolveRuntimeJourneys,
  resetImportedJourneysForTests,
} from "@/app/journey/protoJourneyRuntimeStore";

describe("protoJourneyRuntimeStore", () => {
  afterEach(() => {
    resetImportedJourneysForTests();
  });

  it("returns base journeys when nothing imported", () => {
    expect(resolveRuntimeJourneys([AGENTIC_CJM_JOURNEY])).toEqual([
      AGENTIC_CJM_JOURNEY,
    ]);
  });

  it("replaces journey by id when imported", () => {
    const patched = {
      ...TRADITIONAL_CJM_JOURNEY,
      label: "Traditional CJM (imported)",
    };
    applyImportedJourneyBundle({
      version: 1,
      exportedAt: "2026-07-19T00:00:00.000Z",
      journeys: [patched],
    });
    const merged = resolveRuntimeJourneys([
      AGENTIC_CJM_JOURNEY,
      TRADITIONAL_CJM_JOURNEY,
    ]);
    expect(merged.find((j) => j.id === "traditional-cjm")?.label).toBe(
      "Traditional CJM (imported)"
    );
    expect(merged.find((j) => j.id === "agentic-cjm")?.label).toBe(
      AGENTIC_CJM_JOURNEY.label
    );
  });

  it("clears imported overlay", () => {
    applyImportedJourneyBundle({
      version: 1,
      exportedAt: "2026-07-19T00:00:00.000Z",
      journeys: [TRADITIONAL_CJM_JOURNEY],
    });
    clearImportedJourneys();
    expect(resolveRuntimeJourneys([TRADITIONAL_CJM_JOURNEY])[0]?.label).toBe(
      TRADITIONAL_CJM_JOURNEY.label
    );
  });
});
