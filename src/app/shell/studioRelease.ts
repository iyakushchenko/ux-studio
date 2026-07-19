/**
 * Studio release identity — one source of truth for the chrome version chip.
 *
 * - Semver: injected from package.json at build/test time (`__STUDIO_PACKAGE_VERSION__`).
 * - Channel: Director default here; PO accepts channel changes (alpha|beta|rc|stable).
 *
 * Policy: docs/product/VERSIONING.md
 */

export type StudioReleaseChannel = "alpha" | "beta" | "rc" | "stable";

/** Maturity channel. 0.0.x ships as alpha until PO accepts a higher channel. */
export const STUDIO_RELEASE_CHANNEL: StudioReleaseChannel = "alpha";

export const STUDIO_RELEASE_CHANNELS: readonly StudioReleaseChannel[] = [
  "alpha",
  "beta",
  "rc",
  "stable",
] as const;

declare const __STUDIO_PACKAGE_VERSION__: string;

export type StudioRelease = {
  version: string;
  channel: StudioReleaseChannel;
  /** Display label, e.g. `v0.0.1`. */
  label: string;
};

export function getStudioRelease(): StudioRelease {
  const version =
    typeof __STUDIO_PACKAGE_VERSION__ === "string" &&
    /^\d+\.\d+\.\d+$/.test(__STUDIO_PACKAGE_VERSION__)
      ? __STUDIO_PACKAGE_VERSION__
      : "0.0.0";

  return {
    version,
    channel: STUDIO_RELEASE_CHANNEL,
    label: `v${version}`,
  };
}
