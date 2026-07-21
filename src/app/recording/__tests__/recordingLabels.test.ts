import { describe, expect, it } from "vitest";
import {
  humanizeRecordingLabel,
  humanizeScreenLabel,
  isCoarseMakeModuleName,
  isWeakScrollAnchorName,
} from "@/app/recording/recordingLabels";

describe("humanizeRecordingLabel", () => {
  it("scrubs Make-ish data-name / module paths", () => {
    expect(humanizeRecordingLabel('data-name="module.plp.tiles"')).toBe(
      "Plp Tiles"
    );
    expect(humanizeRecordingLabel("component.plp.tile.title")).toBe(
      "Tile Title"
    );
    expect(humanizeRecordingLabel('[data-name="module.plp.filters"]')).toBe(
      "Plp Filters"
    );
  });

  it("maps screen ids and action slugs", () => {
    expect(humanizeScreenLabel("plp")).toBe("Vaccinations");
    expect(humanizeRecordingLabel("plp-book-now")).toBe("Book Now");
    expect(humanizeRecordingLabel("Book now")).toBe("Book now");
  });

  it("prefixes camera labels", () => {
    expect(humanizeRecordingLabel("plp", { camera: true })).toBe(
      "Camera — Vaccinations"
    );
  });

  it("flags weak / coarse anchors", () => {
    expect(isCoarseMakeModuleName("module.plp.tiles")).toBe(true);
    expect(isWeakScrollAnchorName("component.plp.filter.checkbox.item")).toBe(
      true
    );
    expect(isWeakScrollAnchorName("component.plp.tile.title")).toBe(false);
  });

  it("flags degraded click targets", async () => {
    const { isDegradedClickTarget } = await import(
      "@/app/recording/recordingLabels"
    );
    const tiles = {
      getAttribute: (n: string) =>
        n === "data-name" ? "module.plp.tiles" : null,
      matches: () => false,
      closest: () => null,
    } as unknown as Element;
    expect(isDegradedClickTarget(tiles)).toBe(true);
    const book = {
      getAttribute: (n: string) =>
        n === "data-studio-action" ? "plp-book-now" : null,
      matches: () => false,
      closest: () => null,
    } as unknown as Element;
    expect(isDegradedClickTarget(book)).toBe(false);
  });
});
