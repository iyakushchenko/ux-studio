import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  getStudioRelease,
  readStudioPackageVersion,
  STUDIO_RELEASE_CHANNEL,
  STUDIO_RELEASE_CHANNELS,
} from "@/app/shell/studioRelease";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../"
);

describe("studioRelease", () => {
  it("matches package.json version exactly (chip source of truth)", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, "package.json"), "utf8")
    ) as { version: string };
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(readStudioPackageVersion()).toBe(pkg.version);
    const release = getStudioRelease();
    expect(release.version).toBe(pkg.version);
    expect(release.label).toBe(`v${pkg.version}`);
  });

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
