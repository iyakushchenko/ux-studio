/**
 * Lean QA chat rows for blocking modals (REC + Play).
 * Open / close / pick only — no spam on every URL churn.
 */

import { logAgentTestingStep } from "@/app/shell/agent-testing";

export type QaModalTrackSource = "url" | "rec" | "play" | "pick" | "drain";

let lastTrackedModalId: string | null = null;

function cleanModalId(raw: string | null | undefined): string | null {
  const id = typeof raw === "string" ? raw.trim() : "";
  return id || null;
}

function screenSuffix(screenId?: string | null): string {
  const s = typeof screenId === "string" ? screenId.trim() : "";
  return s ? ` · screen=${s}` : "";
}

/** Reset between ALWAYS CLEAR sessions (tests / prove). */
export function resetQaModalTrackForTests(): void {
  lastTrackedModalId = null;
}

export function getLastTrackedModalIdForTests(): string | null {
  return lastTrackedModalId;
}

/**
 * Diff previous→next modal id and emit at most one open + one close row.
 * Safe to call from URL sync (Play) and REC capture.
 */
export function trackStudioModalForQa(options: {
  modalId: string | null | undefined;
  screenId?: string | null;
  source?: QaModalTrackSource;
}): void {
  const next = cleanModalId(options.modalId);
  const prev = lastTrackedModalId;
  if (next === prev) return;

  const source = options.source ?? "url";
  const screen = options.screenId;

  try {
    if (prev && next && prev !== next) {
      logAgentTestingStep({
        kind: "info",
        action: "QaModalClose",
        label: `Modal close · ${prev}${screenSuffix(screen)}`,
        outcome: "ok",
      });
      logAgentTestingStep({
        kind: "info",
        action: "QaModalOpen",
        label: `Modal open · ${next}${screenSuffix(screen)} · ${source}`,
        outcome: "ok",
      });
    } else if (next && !prev) {
      logAgentTestingStep({
        kind: "info",
        action: "QaModalOpen",
        label: `Modal open · ${next}${screenSuffix(screen)} · ${source}`,
        outcome: "ok",
      });
    } else if (!next && prev) {
      logAgentTestingStep({
        kind: "info",
        action: "QaModalClose",
        label: `Modal close · ${prev}${screenSuffix(screen)}`,
        outcome: "ok",
      });
    }
  } catch {
    /* hang-safe */
  }

  lastTrackedModalId = next;
}

/** Pharmacy / location picked inside an open modal (lean one-liner). */
export function trackStudioModalPickForQa(options: {
  modalId?: string | null;
  storeId?: string | null;
  detail?: string | null;
  screenId?: string | null;
  source?: QaModalTrackSource;
}): void {
  const modalId = cleanModalId(options.modalId) ?? "choose-pharmacy";
  const store = options.storeId?.trim();
  const detail = options.detail?.trim();
  const parts = [
    `Modal pick · ${modalId}`,
    store ? `store=${store}` : null,
    detail || null,
    options.screenId ? `screen=${options.screenId}` : null,
    options.source ? options.source : null,
  ].filter(Boolean);
  try {
    logAgentTestingStep({
      kind: "info",
      action: "QaModalPick",
      label: parts.join(" · "),
      outcome: "ok",
    });
  } catch {
    /* hang-safe */
  }
}
