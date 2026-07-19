/**
 * Studio release identity — one source of truth for the chrome version chip.
 *
 * - Semver: live `package.json` `version` (JSON import — HMR/dev picks up bumps).
 * - Fallback: Vite/Vitest `define` `__STUDIO_PACKAGE_VERSION__` (build inject).
 * - Channel: Director default here; PO accepts channel changes (alpha|beta|rc|stable).
 *
 * Policy: docs/product/VERSIONING.md
 * DoD: Ben bumps package.json → chip shows new semver with no UI edit; Quinn proves.
 */

import studioPackage from "../../../package.json";

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
  /** Display label, e.g. `v0.0.3`. */
  label: string;
};

function isSemver(value: unknown): value is string {
  return typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value);
}

/**
 * Resolve package.json version. Prefer the JSON import (tracks file changes in
 * Vite/Vitest). Fall back to define inject, never a hardcoded ship number.
 */
export function readStudioPackageVersion(): string {
  const fromJson = (studioPackage as { version?: unknown })?.version;
  if (isSemver(fromJson)) return fromJson;
  if (isSemver(__STUDIO_PACKAGE_VERSION__)) return __STUDIO_PACKAGE_VERSION__;
  return "0.0.0";
}

export function getStudioRelease(): StudioRelease {
  const version = readStudioPackageVersion();
  return {
    version,
    channel: STUDIO_RELEASE_CHANNEL,
    label: `v${version}`,
  };
}
