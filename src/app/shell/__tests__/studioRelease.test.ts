import { describe, expect, it } from "vitest";
import {
  getStudioRelease,
  STUDIO_RELEASE_CHANNEL,
  STUDIO_RELEASE_CHANNELS,
} from "@/app/shell/studioRelease";

describe("studioRelease", () => {
  it("exposes a valid semver + channel from the package inject", () => {
    const release = getStudioRelease();
    expect(release.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(release.label).toBe(`v${release.version}`);
    expect(STUDIO_RELEASE_CHANNELS).toContain(release.channel);
    expect(release.channel).toBe(STUDIO_RELEASE_CHANNEL);
  });

  it("defaults channel to alpha at 0.0.x maturity", () => {
    expect(STUDIO_RELEASE_CHANNEL).toBe("alpha");
  });
});
