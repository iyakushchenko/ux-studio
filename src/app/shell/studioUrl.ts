/**
 * Studio address-bar URL scheme (query params — GitHub Pages `/ux-studio/` safe).
 *
 * Canonical:
 *   /?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=on&experience=agentic
 *   /ux-studio/?project=boots-pharmacy&screen=site-pilot&cjm=off&experience=agentic
 *
 * Legacy `mode=agentic-cjm` / `traditional-cjm` / bare aliases still parse → normalize
 * to `cjm` + `experience` (never re-serialized as `mode=`).
 *
 * Ephemeral agent leftovers (`proof`, …) are stripped on boot / overlay stop.
 */

import {
  experienceToOrchestraModeId,
  normalizeOrchestraModeId,
  normalizeStudioCjmFlag,
  normalizeStudioExperienceId,
  orchestraModeToExperienceId,
  type StudioExperienceId,
} from "@/app/orchestra/orchestraModes";
import type { OrchestraModeId } from "@/app/orchestra/types";
import { playbackDiagHubNav } from "@/app/shell/playbackDiag";
import {
  normalizeStudioModalId,
  type StudioModalId,
} from "@/app/shell/studioModalGuard";

export const STUDIO_QUERY = {
  project: "project",
  screen: "screen",
  persona: "persona",
  cjm: "cjm",
  experience: "experience",
  modal: "modal",
  /** Legacy alias only — accepted on parse, never written. */
  mode: "mode",
} as const;

/** Never persist these in the address bar. */
export const EPHEMERAL_QUERY_KEYS = [
  "proof",
  "mcpDebug",
  "agentTest",
  "agentOverlay",
] as const;

export const HUB_SCREEN_ID = "hub";

/** Default project when post-agent reset has no project in the bar. */
export const DEFAULT_STUDIO_PROJECT_ID = "boots-pharmacy";

/**
 * Legacy hub id for intentional Hub deep-links / unit tests only.
 * Journey smokes must use {@link ResetStudioAfterAgentTestOptions.resetToJourneyStart}
 * — never `resetToHub` (PO: hub only via Hub nav click).
 */
export const STUDIO_POST_AGENT_HOME_SCREEN_ID = HUB_SCREEN_ID;

/** Agentic CJM key-1 screen (never hub). */
export const AGENTIC_JOURNEY_START_SCREEN_ID = "site-pilot";

/** Traditional CJM key-1 screen (never hub). */
export const TRADITIONAL_JOURNEY_START_SCREEN_ID = "plp";

export type ResetStudioAfterAgentTestOptions = {
  /**
   * When true: land selected journey key 1 (`site-pilot` / `plp`) with CJM on.
   * Preferred smoke / Alarm-abort / Play-stop teardown — never hub.
   */
  resetToJourneyStart?: boolean;
  /**
   * When true: land hub. **Forbidden for product + journey smokes** — Hub nav
   * click only. Kept for deep-link unit tests; always emits PLAYBACK_DIAG hub-nav.
   */
  resetToHub?: boolean;
};

/** Window event: App closes lightboxes + applies post-agent home nav. */
export const STUDIO_POST_AGENT_RESET_EVENT = "studio-post-agent-reset";

const SCREEN_ALIASES: Record<string, string> = {
  onboarding: HUB_SCREEN_ID,
  "book-step1": "book-step-1",
  "book-step2": "book-step-2",
  "book-step3": "book-step-3",
  "agentic-home": "site-pilot",
  "site-pilot-home": "site-pilot",
  "site-pilot-chat": "chat",
};

export type StudioUrlState = {
  projectId?: string;
  screenId?: string;
  personaId?: string;
  /**
   * Orchestra journey slot (`agentic-cjm` | `traditional-cjm`).
   * Derived from canonical `experience=` or legacy `mode=`.
   */
  modeId?: OrchestraModeId;
  /** Canonical experience path — agentic vs traditional (not CJM on/off). */
  experienceId?: StudioExperienceId;
  /** CJM playback switch — on vs off. */
  cjm?: boolean;
  /** Blocking lightbox id (e.g. choose-pharmacy). */
  modalId?: StudioModalId | string;
};

export type StudioPostAgentResetDetail = {
  state: StudioUrlState;
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

function finalizeUrlState(partial: {
  projectId?: string;
  screenId?: string;
  personaId?: string;
  experienceId?: StudioExperienceId;
  modeId?: OrchestraModeId;
  cjm?: boolean;
  modalId?: StudioModalId | string;
}): StudioUrlState {
  const experienceId =
    partial.experienceId ??
    (partial.modeId ? orchestraModeToExperienceId(partial.modeId) : undefined);
  const modeId =
    partial.modeId ??
    (experienceId ? experienceToOrchestraModeId(experienceId) : undefined);
  return {
    projectId: partial.projectId,
    screenId: partial.screenId,
    personaId: partial.personaId,
    experienceId,
    modeId,
    cjm: partial.cjm,
    modalId: partial.modalId,
  };
}

export function parseStudioUrl(
  search: string = typeof window !== "undefined" ? window.location.search : ""
): StudioUrlState {
  const raw = typeof search === "string" ? search : "";
  const params = new URLSearchParams(
    raw.startsWith("?") ? raw.slice(1) : raw
  );
  const projectId = params.get(STUDIO_QUERY.project)?.trim() || undefined;
  const personaId = params.get(STUDIO_QUERY.persona)?.trim() || undefined;
  const screenId = normalizeScreenId(params.get(STUDIO_QUERY.screen));
  const modalId = normalizeStudioModalId(params.get(STUDIO_QUERY.modal));

  const experienceFromParam = normalizeStudioExperienceId(
    params.get(STUDIO_QUERY.experience)
  );
  const cjmFromParam = normalizeStudioCjmFlag(params.get(STUDIO_QUERY.cjm));

  const legacyModeRaw = params.get(STUDIO_QUERY.mode);
  const modeFromLegacy = normalizeOrchestraModeId(legacyModeRaw);
  const experienceFromLegacy = modeFromLegacy
    ? orchestraModeToExperienceId(modeFromLegacy)
    : undefined;

  // Canonical params win; legacy `mode=` only fills `experience` (never implies CJM on —
  // old `mode=agentic-cjm` selected the journey path, not the CJM switch).
  const experienceId = experienceFromParam ?? experienceFromLegacy;
  const modeId = experienceId
    ? experienceToOrchestraModeId(experienceId)
    : undefined;

  return finalizeUrlState({
    projectId,
    screenId,
    personaId,
    experienceId,
    modeId,
    cjm: cjmFromParam,
    modalId,
  });
}

export function serializeStudioUrl(state: StudioUrlState): string {
  const params = new URLSearchParams();
  const experienceId =
    state.experienceId ??
    (state.modeId ? orchestraModeToExperienceId(state.modeId) : undefined);
  if (state.projectId) params.set(STUDIO_QUERY.project, state.projectId);
  if (state.screenId) params.set(STUDIO_QUERY.screen, state.screenId);
  if (state.personaId) params.set(STUDIO_QUERY.persona, state.personaId);
  if (state.cjm !== undefined) {
    params.set(STUDIO_QUERY.cjm, state.cjm ? "on" : "off");
  }
  if (experienceId) {
    params.set(STUDIO_QUERY.experience, experienceId);
  }
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

/**
 * Build hub landing URL state — intentional Hub deep-link / unit tests only.
 * Preserves project when present; always hub; never modal / persona / experience / cjm.
 * @deprecated Prefer {@link buildStudioPostAgentJourneyStartState} for smokes.
 */
export function buildStudioPostAgentHomeState(
  search: string = typeof window !== "undefined" ? window.location.search : ""
): StudioUrlState {
  const current = parseStudioUrl(search);
  return {
    projectId: current.projectId ?? DEFAULT_STUDIO_PROJECT_ID,
    screenId: STUDIO_POST_AGENT_HOME_SCREEN_ID,
  };
}

/**
 * Journey smoke / Alarm-abort / Play-stop teardown → selected journey key 1.
 * Agentic → `site-pilot`; traditional → `plp`. Preserves project + persona;
 * forces `cjm=on` + experience; never hub / modal.
 */
export function buildStudioPostAgentJourneyStartState(
  search: string = typeof window !== "undefined" ? window.location.search : ""
): StudioUrlState {
  const current = parseStudioUrl(search);
  const experienceId =
    current.experienceId ??
    (current.modeId ? orchestraModeToExperienceId(current.modeId) : "agentic");
  const screenId =
    experienceId === "traditional"
      ? TRADITIONAL_JOURNEY_START_SCREEN_ID
      : AGENTIC_JOURNEY_START_SCREEN_ID;
  return finalizeUrlState({
    projectId: current.projectId ?? DEFAULT_STUDIO_PROJECT_ID,
    screenId,
    personaId: current.personaId,
    experienceId,
    cjm: true,
  });
}

/**
 * Default post-agent stay state: current project + screen (+ persona/experience/cjm).
 * Never preserves `&modal=` — probe/sitrep/forceClear must leave dialogs closed
 * (sticky choose-pharmacy after MCP was a recurring felony).
 * Ephemeral keys are stripped separately; live lightboxes close via event.
 */
export function buildStudioPostAgentStayState(
  search: string = typeof window !== "undefined" ? window.location.search : ""
): StudioUrlState {
  const current = parseStudioUrl(search);
  return finalizeUrlState({
    projectId: current.projectId ?? DEFAULT_STUDIO_PROJECT_ID,
    screenId: current.screenId ?? STUDIO_POST_AGENT_HOME_SCREEN_ID,
    personaId: current.personaId,
    experienceId: current.experienceId,
    modeId: current.modeId,
    cjm: current.cjm,
    // HARD: strip modal — closeAllPopups + applyModal(undefined) via event.
  });
}

/** Ignore nav→URL sync briefly so React cannot re-stamp `&modal=` during sitrep. */
let postAgentResetSyncLockUntil = 0;

const POST_AGENT_RESET_SYNC_LOCK_MS = 2500;

/** True while post-agent clean slate owns the address bar. */
export function isStudioPostAgentResetSyncLocked(
  now: number = Date.now()
): boolean {
  return now < postAgentResetSyncLockUntil;
}

/**
 * App post-agent apply: never default missing/hub screenId to hub overlay.
 * Prefer event state → address bar → agentic key 1.
 */
export function resolvePostAgentApplyScreenId(
  stateScreenId?: string | null,
  search: string = typeof window !== "undefined" ? window.location.search : ""
): string {
  const fromBar = parseStudioUrl(search).screenId;
  const stay = stateScreenId || fromBar || AGENTIC_JOURNEY_START_SCREEN_ID;
  return stay === HUB_SCREEN_ID ? AGENTIC_JOURNEY_START_SCREEN_ID : stay;
}

/**
 * After agent / MCP tests: strip ephemeral + `&modal=`.
 * Default: stay on current project + screen (+ persona/experience/cjm); never keep modal.
 * Prefer `{ resetToJourneyStart: true }` for CJM/journey smoke teardown (key 1, never hub).
 * `{ resetToHub: true }` is forbidden for product/smoke — Hub nav click only (logged).
 * Writes the address bar, then dispatches {@link STUDIO_POST_AGENT_RESET_EVENT}
 * so App can dismiss sticky lightboxes / popups and apply nav (no-reload path).
 * Call again immediately before `location.reload()` so a settle-window race
 * cannot re-stamp ephemeral keys or `&modal=`.
 */
export function resetStudioAfterAgentTest(
  options?: ResetStudioAfterAgentTestOptions
): StudioUrlState {
  const toJourneyStart = options?.resetToJourneyStart === true;
  const toHub = !toJourneyStart && options?.resetToHub === true;
  const state = toJourneyStart
    ? buildStudioPostAgentJourneyStartState()
    : toHub
      ? buildStudioPostAgentHomeState()
      : buildStudioPostAgentStayState();
  // Never re-stamp modal from a stale caller detail — stay/hub builders omit it.
  const cleanState: StudioUrlState = { ...state, modalId: undefined };
  if (toHub) {
    try {
      playbackDiagHubNav({
        reason: "resetStudioAfterAgentTest(resetToHub) — forbidden for smoke/product",
        source: "studioUrl.resetStudioAfterAgentTest",
      });
    } catch {
      /* hang-safe */
    }
  }
  postAgentResetSyncLockUntil = Date.now() + POST_AGENT_RESET_SYNC_LOCK_MS;
  stripEphemeralStudioQuery();
  writeStudioUrl(cleanState);
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(
      new CustomEvent<StudioPostAgentResetDetail>(STUDIO_POST_AGENT_RESET_EVENT, {
        detail: { state: cleanState },
      })
    );
  }
  return cleanState;
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
  experienceId?: string;
  cjm?: boolean;
  modalId?: string;
}): StudioUrlState {
  const fromUrl = input.studioUrl ? parseStudioUrl(input.studioUrl) : {};
  const experienceId =
    fromUrl.experienceId ??
    normalizeStudioExperienceId(input.experienceId) ??
    (input.modeId
      ? (() => {
          const mode = normalizeOrchestraModeId(input.modeId);
          return mode ? orchestraModeToExperienceId(mode) : undefined;
        })()
      : undefined);
  const modeId =
    fromUrl.modeId ??
    (experienceId
      ? experienceToOrchestraModeId(experienceId)
      : normalizeOrchestraModeId(input.modeId));
  const cjm = fromUrl.cjm ?? input.cjm;
  return finalizeUrlState({
    projectId: fromUrl.projectId ?? (input.projectId?.trim() || undefined),
    screenId: fromUrl.screenId ?? normalizeScreenId(input.screenId),
    personaId: fromUrl.personaId ?? (input.personaId?.trim() || undefined),
    experienceId,
    modeId,
    cjm,
    modalId:
      fromUrl.modalId ??
      normalizeStudioModalId(input.modalId) ??
      undefined,
  });
}

export type ApplyStudioScreenInput = {
  studioUrl?: string;
  screenId?: string;
  projectId?: string;
  personaId?: string;
  modeId?: string;
  experienceId?: string;
  cjm?: boolean;
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
  setJourneyMode?: (enabled: boolean) => void;
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
    const mode = normalizeOrchestraModeId(state.modeId);
    if (mode) input.setModeId(mode);
  }
  if (state.cjm !== undefined && input.setJourneyMode) {
    input.setJourneyMode(state.cjm);
  }
  if (nav) {
    if (nav.hubOpen) {
      try {
        playbackDiagHubNav({
          reason: `applyStudioScreen(screen=${state.screenId ?? "hub"})`,
          source: "studioUrl.applyStudioScreen",
        });
      } catch {
        /* hang-safe */
      }
    }
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
  // Includes legacy `mode` so old compound params do not stick after normalize.
  for (const key of Object.values(STUDIO_QUERY)) {
    url.searchParams.delete(key);
  }
  const experienceId =
    state.experienceId ??
    (state.modeId ? orchestraModeToExperienceId(state.modeId) : undefined);
  if (state.projectId) url.searchParams.set(STUDIO_QUERY.project, state.projectId);
  if (state.screenId) url.searchParams.set(STUDIO_QUERY.screen, state.screenId);
  if (state.personaId) url.searchParams.set(STUDIO_QUERY.persona, state.personaId);
  if (state.cjm !== undefined) {
    url.searchParams.set(STUDIO_QUERY.cjm, state.cjm ? "on" : "off");
  }
  if (experienceId) {
    url.searchParams.set(STUDIO_QUERY.experience, experienceId);
  }
  if (state.modalId) url.searchParams.set(STUDIO_QUERY.modal, state.modalId);

  const next = `${url.pathname}${url.search}${url.hash}`;
  const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== cur) {
    if (options?.push) window.history.pushState(window.history.state, "", next);
    else window.history.replaceState(window.history.state, "", next);
  }
  return url.search;
}
