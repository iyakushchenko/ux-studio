/**
 * Blocking modal drain for agent REC — code law.
 *
 * If URL has `&modal=` (e.g. choose-pharmacy), the agent MUST handle it
 * before continuing. Never rush past Continue into an open modal.
 */

import { simulateDemoPointerClick } from "@/app/scenario/demoCursor";
import { logAgentTestingStep, touchAgentTestingOverlay } from "@/app/shell/agent-testing";
import { parseStudioUrl } from "@/app/shell/studioUrl";
import { STUDIO_MODAL } from "@/app/shell/studioModalGuard";
import { recUserPace } from "@/app/recording/recUserPace";
import {
  trackStudioModalForQa,
  trackStudioModalPickForQa,
} from "@/app/shell/qaModalTrack";

export type RecModalDrainResult = {
  ok: boolean;
  modalId: string | null;
  drained: boolean;
  reason?: string;
  storeId?: string;
};

const CHOOSE_PHARMACY = STUDIO_MODAL.choosePharmacy;

/** Prefer demo store; fall back to first visible Choose Location. */
const PHARMACY_PICK_SELECTORS = [
  `[data-studio-modal="${CHOOSE_PHARMACY}"] [data-studio-avail-store="covent"] [data-studio-action="avail-choose-location"]`,
  `[data-studio-modal="${CHOOSE_PHARMACY}"] [data-studio-action="avail-choose-location"]`,
  `[data-studio-modal="${CHOOSE_PHARMACY}"] [data-studio-avail-store]`,
] as const;

export function readUrlModalId(
  search: string = typeof window !== "undefined" ? window.location.search : ""
): string | null {
  try {
    const id = parseStudioUrl(search).modalId;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

export function isBlockingModalOpenInDom(modalId?: string | null): boolean {
  if (typeof document === "undefined") return false;
  if (modalId) {
    return Boolean(
      document.querySelector(`[data-studio-modal="${modalId}"]`)
    );
  }
  return Boolean(document.querySelector("[data-studio-modal]"));
}

function logQaModal(
  action: string,
  label: string,
  outcome: "ok" | "fail" | "info" = "ok"
): void {
  try {
    touchAgentTestingOverlay("AGENT TESTING — REC modal");
    logAgentTestingStep({
      kind: "rec",
      action,
      label,
      outcome: outcome === "info" ? "ok" : outcome,
    });
  } catch {
    /* hang-safe */
  }
}

async function waitForModal(
  modalId: string,
  attempts = 12
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    const urlHas = readUrlModalId() === modalId;
    const domHas = isBlockingModalOpenInDom(modalId);
    if (urlHas || domHas) return true;
    await recUserPace("modalOpenWait");
  }
  return isBlockingModalOpenInDom(modalId) || readUrlModalId() === modalId;
}

async function pickChoosePharmacyStore(): Promise<{
  ok: boolean;
  storeId?: string;
  reason?: string;
}> {
  for (const sel of PHARMACY_PICK_SELECTORS) {
    const el = document.querySelector<HTMLElement>(sel);
    if (!el || !el.getClientRects().length) continue;
    const storeHost = el.closest<HTMLElement>("[data-studio-avail-store]");
    const storeId =
      storeHost?.getAttribute("data-studio-avail-store") ?? undefined;
    trackStudioModalPickForQa({
      modalId: CHOOSE_PHARMACY,
      storeId,
      detail: "Choose Location",
      source: "drain",
    });
    logQaModal(
      "RecModalPharmacyPick",
      `choose-pharmacy · pick ${storeId ?? "store"} · ${sel.slice(0, 72)}`
    );
    await recUserPace("beforeCta");
    const ok = await simulateDemoPointerClick(el, { scroll: true });
    await recUserPace("modalPickSettle");
    if (!ok) {
      return { ok: false, storeId, reason: "pharmacy pick click failed" };
    }
    return { ok: true, storeId };
  }
  return {
    ok: false,
    reason: "no avail-choose-location target in choose-pharmacy modal",
  };
}

async function pickLoginSignIn(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const root =
    document.querySelector<HTMLElement>('[data-studio-modal="login"]') ??
    document.querySelector<HTMLElement>(".proto-login-card");
  if (!root) {
    return { ok: false, reason: "login modal DOM missing" };
  }
  const signIn =
    root.querySelector<HTMLElement>(".proto-login-cta") ??
    Array.from(root.querySelectorAll<HTMLElement>("button")).find((btn) =>
      /^sign in$/i.test((btn.textContent ?? "").trim())
    );
  if (!signIn) {
    return { ok: false, reason: "login Sign in button missing" };
  }
  trackStudioModalPickForQa({
    modalId: STUDIO_MODAL.login,
    detail: "Sign in",
    source: "drain",
  });
  logQaModal("RecModalPharmacyPick", "login · Sign in");
  await recUserPace("beforeCta");
  const ok = await simulateDemoPointerClick(signIn, { scroll: true });
  await recUserPace("modalPickSettle");
  if (!ok) return { ok: false, reason: "login Sign in click failed" };
  // Wait for modal to clear.
  for (let i = 0; i < 20; i++) {
    const still =
      readUrlModalId() === STUDIO_MODAL.login ||
      isBlockingModalOpenInDom(STUDIO_MODAL.login) ||
      Boolean(document.querySelector(".proto-login-card"));
    if (!still) return { ok: true };
    await recUserPace("modalOpenWait");
  }
  const stillOpen =
    readUrlModalId() === STUDIO_MODAL.login ||
    isBlockingModalOpenInDom(STUDIO_MODAL.login);
  if (stillOpen) {
    return { ok: false, reason: "login still open after Sign in" };
  }
  return { ok: true };
}

/**
 * If a blocking modal is open (URL or DOM), drain it before the next REC beat.
 * choose-pharmacy → pick a real pharmacy (Choose Location).
 * login → Sign in (traditional Book path).
 * Other modals → FAIL loudly so agents cannot ignore.
 */
export async function drainBlockingModalIfOpen(): Promise<RecModalDrainResult> {
  const modalId =
    readUrlModalId() ??
    document
      .querySelector<HTMLElement>("[data-studio-modal]")
      ?.getAttribute("data-studio-modal") ??
    null;

  if (!modalId) {
    return { ok: true, modalId: null, drained: false };
  }

  trackStudioModalForQa({
    modalId,
    source: "drain",
  });
  logQaModal(
    "RecModalOpen",
    `URL/DOM modal=${modalId} — must handle before next beat`
  );

  if (modalId === STUDIO_MODAL.login || modalId === "account") {
    const ready = await waitForModal(STUDIO_MODAL.login);
    if (!ready) {
      return {
        ok: false,
        modalId,
        drained: false,
        reason: "login modal not visible",
      };
    }
    const pick = await pickLoginSignIn();
    if (!pick.ok) {
      logQaModal("RecModalPharmacyPick", pick.reason ?? "login fail", "fail");
      return {
        ok: false,
        modalId: STUDIO_MODAL.login,
        drained: false,
        reason: pick.reason,
      };
    }
    trackStudioModalForQa({ modalId: null, source: "drain" });
    logQaModal("RecModalPharmacyPick", "login drained · signed in");
    return { ok: true, modalId: STUDIO_MODAL.login, drained: true };
  }

  if (modalId === CHOOSE_PHARMACY || modalId === "avail") {
    const ready = await waitForModal(CHOOSE_PHARMACY);
    if (!ready) {
      const fail: RecModalDrainResult = {
        ok: false,
        modalId,
        drained: false,
        reason: "choose-pharmacy modal not visible after Continue",
      };
      logQaModal("RecModalOpen", fail.reason!, "fail");
      return fail;
    }
    trackStudioModalForQa({
      modalId: CHOOSE_PHARMACY,
      source: "drain",
    });
    logQaModal(
      "RecModalOpen",
      `modal=choose-pharmacy visible · ${window.location.search}`
    );
    const pick = await pickChoosePharmacyStore();
    if (!pick.ok) {
      logQaModal("RecModalPharmacyPick", pick.reason ?? "pick failed", "fail");
      return {
        ok: false,
        modalId: CHOOSE_PHARMACY,
        drained: false,
        reason: pick.reason,
      };
    }
    // Modal should close after Choose Location; confirm URL cleared or DOM gone.
    await recUserPace("afterClick");
    const still =
      readUrlModalId() === CHOOSE_PHARMACY &&
      isBlockingModalOpenInDom(CHOOSE_PHARMACY);
    if (still) {
      logQaModal(
        "RecModalPharmacyPick",
        "pharmacy picked but modal still open — check confirm path",
        "fail"
      );
      return {
        ok: false,
        modalId: CHOOSE_PHARMACY,
        drained: false,
        storeId: pick.storeId,
        reason: "choose-pharmacy still open after pick",
      };
    }
    trackStudioModalForQa({
      modalId: null,
      source: "drain",
    });
    logQaModal(
      "RecModalPharmacyPick",
      `choose-pharmacy drained · store=${pick.storeId ?? "?"}`
    );
    return {
      ok: true,
      modalId: CHOOSE_PHARMACY,
      drained: true,
      storeId: pick.storeId,
    };
  }

  // Unknown blocking modal — do not invent a dismiss path; fail prove.
  const reason = `blocking modal=${modalId} open — agent must handle (no silent skip)`;
  logQaModal("RecModalOpen", reason, "fail");
  return { ok: false, modalId, drained: false, reason };
}

/**
 * Call after every REC click that might open a modal (e.g. book-step-1 Continue).
 * Enforces drain before returning control to the next beat.
 */
export async function afterRecClickDrainModal(): Promise<RecModalDrainResult> {
  await recUserPace("modalOpenWait");
  return drainBlockingModalIfOpen();
}
