/**
 * Studio address-bar URL scheme (query params — GitHub Pages `/ux-studio/` safe).
 *
 * Examples:
 *   /?project=boots-pharmacy&screen=book-step-2
 *   /ux-studio/?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy
 *   /ux-studio/?project=boots-pharmacy&screen=home&mode=agentic-cjm
 *
 * Ephemeral agent leftovers (`proof`, …) are stripped on boot / overlay stop.
 */

import {
  normalizeStudioModalId,
  type StudioModalId,
} from "@/app/shell/studioModalGuard";

export const STUDIO_QUERY = {
  project: "project",
  screen: "screen",
  persona: "persona",
  mode: "mode",
  modal: "modal",
} as const;

/** Never persist these in the address bar. */
export const EPHEMERAL_QUERY_KEYS = [
  "proof",
  "mcpDebug",
  "agentTest",
  "agentOverlay",
] as const;

export const HUB_SCREEN_ID = "hub";

const SCREEN_ALIASES: Record<string, string> = {
  onboarding: HUB_SCREEN_ID,
  "book-step1": "book-step-1",
  "book-step2": "book-step-2",
  "book-step3": "book-step-3",
  "agentic-home": "home",
  "site-pilot-home": "home",
  "site-pilot-chat": "chat",
};

export type StudioUrlState = {
  projectId?: string;
  screenId?: string;
  personaId?: string;
  modeId?: string;
  /** Blocking lightbox id (e.g. choose-pharmacy). */
  modalId?: StudioModalId | string;
};

export type StudioScreenRef = {
  screenId: string;
  childIndex: number;
  label: string;
};

export type StudioNavFromUrl = {
  hubOpen: boolean;
  /** Zero-based tab index (ignored when hubOpen). */
  current: number;
  screenId: string;
};

function normalizeScreenId(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return undefined;
  return SCREEN_ALIASES[trimmed] ?? trimmed;
}

export function parseStudioUrl(
  search: string = typeof window !== "undefined" ? window.location.search : ""
): StudioUrlState {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  const projectId = params.get(STUDIO_QUERY.project)?.trim() || undefined;
  const personaId = params.get(STUDIO_QUERY.persona)?.trim() || undefined;
  const modeId = params.get(STUDIO_QUERY.mode)?.trim() || undefined;
  const screenId = normalizeScreenId(params.get(STUDIO_QUERY.screen));
  const modalId = normalizeStudioModalId(params.get(STUDIO_QUERY.modal));
  return { projectId, screenId, personaId, modeId, modalId };
}

export function serializeStudioUrl(state: StudioUrlState): string {
  const params = new URLSearchParams();
  if (state.projectId) params.set(STUDIO_QUERY.project, state.projectId);
  if (state.screenId) params.set(STUDIO_QUERY.screen, state.screenId);
  if (state.personaId) params.set(STUDIO_QUERY.persona, state.personaId);
  if (state.modeId) params.set(STUDIO_QUERY.mode, state.modeId);
  if (state.modalId) params.set(STUDIO_QUERY.modal, state.modalId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function studioUrlHref(state: StudioUrlState): string {
  return serializeStudioUrl(state);
}

/** True if any ephemeral key is present. */
export function hasEphemeralStudioQuery(
  search: string = typeof window !== "undefined" ? window.location.search : ""
): boolean {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  return EPHEMERAL_QUERY_KEYS.some((key) => params.has(key));
}

/**
 * Remove ephemeral query keys via replaceState. Preserves studio keys + hash.
 * Returns true when the address bar changed.
 */
export function stripEphemeralStudioQuery(
  loc: Pick<Location, "href" | "pathname" | "search" | "hash"> | undefined =
    typeof window !== "undefined" ? window.location : undefined
): boolean {
  if (typeof window === "undefined" || !loc?.href) return false;
  try {
    const url = new URL(loc.href);
    let changed = false;
    for (const key of EPHEMERAL_QUERY_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (!changed) return false;
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
    return true;
  } catch {
    return false;
  }
}

export function resolveScreenIdFromNav(options: {
  hubOpen: boolean;
  current: number;
  screens: ReadonlyArray<{ screenId?: string; childIndex: number }>;
}): string {
  if (options.hubOpen) return HUB_SCREEN_ID;
  const screen = options.screens[options.current];
  return screen?.screenId ?? `child-${screen?.childIndex ?? options.current}`;
}

export function resolveNavFromScreenId(
  screenId: string | undefined,
  screens: ReadonlyArray<{ screenId?: string; childIndex: number }>
): StudioNavFromUrl | null {
  const id = normalizeScreenId(screenId);
  if (!id) return null;
  if (id === HUB_SCREEN_ID) {
    return { hubOpen: true, current: 0, screenId: HUB_SCREEN_ID };
  }
  const index = screens.findIndex((s) => s.screenId === id);
  if (index < 0) return null;
  return { hubOpen: false, current: index, screenId: id };
}

/**
 * Resolve a screen target from a recording `studioUrl` and/or explicit ids.
 * `studioUrl` wins when it carries a field; otherwise fall back to discrete ids.
 */
export function resolveStudioScreenTarget(input: {
  studioUrl?: string;
  screenId?: string;
  projectId?: string;
  personaId?: string;
  modeId?: string;
  modalId?: string;
}): StudioUrlState {
  const fromUrl = input.studioUrl ? parseStudioUrl(input.studioUrl) : {};
  return {
    projectId: fromUrl.projectId ?? (input.projectId?.trim() || undefined),
    screenId: fromUrl.screenId ?? normalizeScreenId(input.screenId),
    personaId: fromUrl.personaId ?? (input.personaId?.trim() || undefined),
    modeId: fromUrl.modeId ?? (input.modeId?.trim() || undefined),
    modalId:
      fromUrl.modalId ??
      normalizeStudioModalId(input.modalId) ??
      undefined,
  };
}

export type ApplyStudioScreenInput = {
  studioUrl?: string;
  screenId?: string;
  projectId?: string;
  personaId?: string;
  modeId?: string;
  modalId?: string;
  screens: ReadonlyArray<{ screenId?: string; childIndex: number }>;
  /**
   * Write the address bar (default true). Deep-link boot / popstate use false —
   * the bar already holds the target.
   */
  syncUrl?: boolean;
  currentProjectId?: string;
  setProjectId?: (id: string) => void;
  setPersonaId?: (id: string) => void;
  setModeId?: (id: string) => void;
  setCurrent: (index: number) => void;
  setHubOpen: (open: boolean) => void;
  /** Apply blocking lightbox from URL / replay (open/close). */
  applyModal?: (modalId: string | undefined) => void;
};

export type ApplyStudioScreenResult = {
  /** True when nav (and/or project) was applied from a known screen id. */
  applied: boolean;
  state: StudioUrlState;
  nav: StudioNavFromUrl | null;
};

/**
 * Shared apply path for refresh deep-links, popstate, and recording replay.
 * Maps `screenId` / `studioUrl` → hub/tab setters (+ optional replaceState).
 */
export function applyStudioScreen(
  input: ApplyStudioScreenInput
): ApplyStudioScreenResult {
  const state = resolveStudioScreenTarget(input);
  const nav = resolveNavFromScreenId(state.screenId, input.screens);

  if (
    state.projectId &&
    input.setProjectId &&
    state.projectId !== input.currentProjectId
  ) {
    input.setProjectId(state.projectId);
  }
  if (state.personaId && input.setPersonaId) {
    input.setPersonaId(state.personaId);
  }
  if (state.modeId && input.setModeId) {
    input.setModeId(state.modeId);
  }
  if (nav) {
    input.setHubOpen(nav.hubOpen);
    if (!nav.hubOpen) {
      input.setCurrent(nav.current);
    }
  }
  input.applyModal?.(state.modalId);

  if (input.syncUrl !== false) {
    writeStudioUrl(state);
  }

  return {
    applied: nav != null,
    state,
    nav,
  };
}

/**
 * Write canonical studio query (and strip ephemeral). Uses replaceState by default
 * so tab navigation does not spam history.
 */
export function writeStudioUrl(
  state: StudioUrlState,
  options?: { push?: boolean }
): string {
  if (typeof window === "undefined") return serializeStudioUrl(state);
  const url = new URL(window.location.href);
  for (const key of EPHEMERAL_QUERY_KEYS) {
    url.searchParams.delete(key);
  }
  // Wipe then re-apply so param order stays canonical (project → screen → …).
  for (const key of Object.values(STUDIO_QUERY)) {
    url.searchParams.delete(key);
  }
  if (state.projectId) url.searchParams.set(STUDIO_QUERY.project, state.projectId);
  if (state.screenId) url.searchParams.set(STUDIO_QUERY.screen, state.screenId);
  if (state.personaId) url.searchParams.set(STUDIO_QUERY.persona, state.personaId);
  if (state.modeId) url.searchParams.set(STUDIO_QUERY.mode, state.modeId);
  if (state.modalId) url.searchParams.set(STUDIO_QUERY.modal, state.modalId);

  const next = `${url.pathname}${url.search}${url.hash}`;
  const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== cur) {
    if (options?.push) window.history.pushState(window.history.state, "", next);
    else window.history.replaceState(window.history.state, "", next);
  }
  return url.search;
}
