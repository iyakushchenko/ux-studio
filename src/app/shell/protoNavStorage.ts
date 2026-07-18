/** Per-project session storage keys for nav and hub state. */

export function protoNavStorageKey(projectId: string): string {
  return `proto-nav:${projectId}`;
}

export function protoHubStorageKey(projectId: string): string {
  return `proto-hub:${projectId}`;
}

/** Pre–project-registry keys (Boots prototype). */
const LEGACY_BOOTS_NAV_KEY = "boots-vaccine-proto-nav";
const LEGACY_BOOTS_HUB_KEY = "boots-vaccine-proto-hub";
const BOOTS_PHARMACY_PROJECT_ID = "boots-pharmacy";

function readLegacyNavIndex(projectId: string): number | null {
  if (projectId !== BOOTS_PHARMACY_PROJECT_ID) return null;
  try {
    const raw = sessionStorage.getItem(LEGACY_BOOTS_NAV_KEY);
    if (raw == null) return null;
    const i = Number(raw);
    if (!Number.isFinite(i)) return null;
    sessionStorage.removeItem(LEGACY_BOOTS_NAV_KEY);
    return i;
  } catch {
    return null;
  }
}

function readLegacyHubOpen(projectId: string): boolean | null {
  if (projectId !== BOOTS_PHARMACY_PROJECT_ID) return null;
  try {
    const raw = sessionStorage.getItem(LEGACY_BOOTS_HUB_KEY);
    if (raw == null) return null;
    sessionStorage.removeItem(LEGACY_BOOTS_HUB_KEY);
    return raw === "1";
  } catch {
    return null;
  }
}

function clampNavIndex(index: number, screenCount: number): number {
  return Math.max(0, Math.min(Math.max(screenCount - 1, 0), index));
}

export function readStoredNavIndex(
  projectId: string,
  screenCount: number
): number {
  try {
    const raw = sessionStorage.getItem(protoNavStorageKey(projectId));
    if (raw != null) {
      const i = Number(raw);
      if (Number.isFinite(i)) return clampNavIndex(i, screenCount);
    }
    const legacy = readLegacyNavIndex(projectId);
    if (legacy != null) {
      const clamped = clampNavIndex(legacy, screenCount);
      storeNavIndex(projectId, clamped);
      return clamped;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function readStoredHubOpen(projectId: string): boolean {
  try {
    const raw = sessionStorage.getItem(protoHubStorageKey(projectId));
    if (raw != null) return raw === "1";
    const legacy = readLegacyHubOpen(projectId);
    if (legacy != null) {
      storeHubOpen(projectId, legacy);
      return legacy;
    }
    return false;
  } catch {
    return false;
  }
}

export function storeNavIndex(projectId: string, index: number): void {
  try {
    sessionStorage.setItem(protoNavStorageKey(projectId), String(index));
  } catch {
    /* ignore */
  }
}

export function storeHubOpen(projectId: string, open: boolean): void {
  try {
    sessionStorage.setItem(protoHubStorageKey(projectId), open ? "1" : "0");
  } catch {
    /* ignore */
  }
}
